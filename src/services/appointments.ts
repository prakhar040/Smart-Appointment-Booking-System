import { Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { prisma } from "../lib/db";
import { AppError } from "../lib/errors";
import { bookingSchema, isUuid, parseInput } from "../lib/schemas";
import { generateSlots, validateSlot } from "../lib/slots";
import { parseDay } from "../lib/slots";

export type SlotAvailability = {
  start: string; // ISO UTC
  end: string;
  available: boolean;
  reason: "BOOKED" | "PAST" | null;
};

const REFERENCE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function createReference() {
  const symbols = Array.from(randomBytes(8), (byte) => REFERENCE_ALPHABET[byte & 31]);
  return `VIS-${symbols.slice(0, 4).join("")}-${symbols.slice(4).join("")}`;
}

function normalizeReference(value: string) {
  const compact = value.trim().toUpperCase().replace(/[\s-]/g, "");
  return /^VIS[A-Z0-9]{8}$/.test(compact)
    ? `VIS-${compact.slice(3, 7)}-${compact.slice(7)}`
    : value.trim().toUpperCase();
}

async function requireProvider(providerId: string) {
  const provider = isUuid(providerId)
    ? await prisma.provider.findUnique({ where: { id: providerId } })
    : null;
  if (!provider) throw new AppError("NOT_FOUND", "Doctor not found", 404);
  return provider;
}

export function listProviders() {
  return prisma.provider.findMany({ orderBy: { name: "asc" } });
}

export async function getAvailability(providerId: string, date: string, now = new Date()) {
  await requireProvider(providerId);
  parseDay(date); // throws 400 on bad input, even though generateSlots also checks
  const slots = generateSlots(date);

  if (slots.length === 0) {
    return { providerId, date, closed: true, slots: [] as SlotAvailability[] };
  }

  const booked = await prisma.appointment.findMany({
    where: {
      providerId,
      status: "BOOKED", // CANCELLED rows never block (BR-08)
      startTime: { gte: slots[0].start, lt: slots[slots.length - 1].end },
    },
    select: { startTime: true },
  });
  const bookedSet = new Set(booked.map((b) => b.startTime.getTime()));

  const result: SlotAvailability[] = slots.map((s) => {
    const isBooked = bookedSet.has(s.start.getTime());
    const isPast = s.start.getTime() <= now.getTime();
    return {
      start: s.start.toISOString(),
      end: s.end.toISOString(),
      available: !isBooked && !isPast,
      reason: isBooked ? "BOOKED" : isPast ? "PAST" : null,
    };
  });

  return { providerId, date, closed: false, slots: result };
}

export async function bookAppointment(raw: unknown, now = new Date()) {
  const input = parseInput(bookingSchema, raw);
  const slot = validateSlot(new Date(input.startTime), now);
  await requireProvider(input.providerId);

  // Insert directly. The partial unique index decides the winner when
  // two requests race. We never "check, then insert".
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = createReference();
    try {
      return await prisma.appointment.create({
        data: {
          reference,
          providerId: input.providerId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          startTime: slot.start,
          endTime: slot.end,
        },
        include: { provider: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const referenceExists = await prisma.appointment.findUnique({
          where: { reference },
          select: { id: true },
        });
        if (referenceExists) continue;
        throw new AppError("SLOT_TAKEN", "That time has just been booked. Please choose another.", 409);
      }
      throw e;
    }
  }
  throw new AppError("INTERNAL_ERROR", "Could not create a visit reference. Please try again.", 503);
}

export async function getAppointment(idOrReference: string) {
  const appointment = isUuid(idOrReference)
    ? await prisma.appointment.findUnique({ where: { id: idOrReference }, include: { provider: true } })
    : await prisma.appointment.findUnique({ where: { reference: normalizeReference(idOrReference) }, include: { provider: true } });
  if (!appointment) throw new AppError("NOT_FOUND", "Appointment not found", 404);
  return appointment;
}

export async function cancelAppointment(idOrReference: string) {
  const appointment = await getAppointment(idOrReference);

  // Atomic, conditional update. Only a BOOKED row can transition.
  const { count } = await prisma.appointment.updateMany({
    where: { id: appointment.id, status: "BOOKED" },
    data: { status: "CANCELLED" },
  });

  const updatedAppointment = await getAppointment(appointment.id);
  return { appointment: updatedAppointment, alreadyCancelled: count === 0 };
}

export function listAppointments() {
  return prisma.appointment.findMany({
    include: { provider: true },
    orderBy: { startTime: "desc" },
  });
}
