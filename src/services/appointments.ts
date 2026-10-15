import { Prisma } from "@prisma/client";
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

async function requireProvider(providerId: string) {
  const provider = isUuid(providerId)
    ? await prisma.provider.findUnique({ where: { id: providerId } })
    : null;
  if (!provider) throw new AppError("NOT_FOUND", "Provider not found", 404);
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

  try {
    // Insert directly. The partial unique index decides the winner when
    // two requests race. We never "check, then insert".
    return await prisma.appointment.create({
      data: {
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
      throw new AppError("SLOT_TAKEN", "That slot has just been booked. Please pick another.", 409);
    }
    throw e;
  }
}

export async function getAppointment(id: string) {
  const appointment = isUuid(id)
    ? await prisma.appointment.findUnique({ where: { id }, include: { provider: true } })
    : null;
  if (!appointment) throw new AppError("NOT_FOUND", "Appointment not found", 404);
  return appointment;
}

export async function cancelAppointment(id: string) {
  if (!isUuid(id)) throw new AppError("NOT_FOUND", "Appointment not found", 404);

  // Atomic, conditional update. Only a BOOKED row can transition.
  const { count } = await prisma.appointment.updateMany({
    where: { id, status: "BOOKED" },
    data: { status: "CANCELLED" },
  });

  const appointment = await getAppointment(id); // 404 if it never existed
  return { appointment, alreadyCancelled: count === 0 };
}

export function listAppointments() {
  return prisma.appointment.findMany({
    include: { provider: true },
    orderBy: { startTime: "desc" },
  });
}