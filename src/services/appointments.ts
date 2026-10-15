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

export async function bookAppointment(
  raw: unknown,
  patientEmail: string,
  idempotencyKey: string,
  now = new Date(),
) {
  if (!isUuid(idempotencyKey)) {
    throw new AppError("VALIDATION_ERROR", "A valid Idempotency-Key header is required", 400);
  }
  const accountBoundInput = raw && typeof raw === "object" && !Array.isArray(raw)
    ? { ...raw, customerEmail: patientEmail }
    : raw;
  const parsed = parseInput(bookingSchema, accountBoundInput);
  const input = { ...parsed, customerEmail: patientEmail };

  const existing = await prisma.appointment.findUnique({
    where: { idempotencyKey },
    include: { provider: true },
  });
  if (existing) return matchIdempotentBooking(existing, input);

  const slot = validateSlot(new Date(input.startTime), now);
  await requireProvider(input.providerId);

  // Insert directly. The partial unique index decides the winner when
  // two requests race. We never "check, then insert".
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = createReference();
    try {
      return await prisma.appointment.create({
        data: {
          idempotencyKey,
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
        const replay = await prisma.appointment.findUnique({
          where: { idempotencyKey },
          include: { provider: true },
        });
        if (replay) return matchIdempotentBooking(replay, input);
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

function matchIdempotentBooking<T extends {
  providerId: string;
  customerName: string;
  customerEmail: string;
  startTime: Date;
}>(appointment: T, input: {
  providerId: string;
  customerName: string;
  customerEmail: string;
  startTime: string;
}) {
  const matches = appointment.providerId === input.providerId
    && appointment.customerName === input.customerName
    && appointment.customerEmail === input.customerEmail
    && appointment.startTime.getTime() === new Date(input.startTime).getTime();
  if (!matches) {
    throw new AppError("CONFLICT", "This booking request key was already used for different details.", 409);
  }
  return appointment;
}

function appointmentSelector(idOrReference: string) {
  return isUuid(idOrReference)
    ? { id: idOrReference }
    : { reference: normalizeReference(idOrReference) };
}

export async function getPatientAppointment(idOrReference: string, email: string) {
  let appointment = await prisma.appointment.findFirst({
    where: { ...appointmentSelector(idOrReference), customerEmail: email },
    include: { provider: true },
  });
  if (!appointment) throw new AppError("NOT_FOUND", "Visit not found", 404);
  if (appointment.status === "BOOKED" && appointment.endTime.getTime() <= Date.now()) {
    await prisma.$executeRaw`
      UPDATE "Appointment"
      SET "status" = 'COMPLETED'::"AppointmentStatus"
      WHERE "id" = ${appointment.id}::uuid
        AND "customerEmail" = ${email}
        AND "status" = 'BOOKED'
        AND "endTime" <= CURRENT_TIMESTAMP
    `;
    appointment = await prisma.appointment.findFirst({
      where: { id: appointment.id, customerEmail: email },
      include: { provider: true },
    });
    if (!appointment) throw new AppError("NOT_FOUND", "Visit not found", 404);
  }
  return appointment;
}

export async function cancelAppointment(idOrReference: string, email: string) {
  const appointment = await getPatientAppointment(idOrReference, email);

  if (String(appointment.status) === "COMPLETED") {
    return {
      appointment,
      alreadyCancelled: false,
      message: "This visit has ended and is marked as completed.",
    };
  }
  if (appointment.status === "CANCELLED") {
    return { appointment, alreadyCancelled: true, message: "This visit was already cancelled." };
  }
  if (appointment.startTime.getTime() <= Date.now()) {
    throw new AppError("CONFLICT", "This visit has started and can no longer be cancelled.", 409);
  }

  // Use the database clock in the conditional write so a concurrent request
  // cannot cancel after the appointment has started.
  const count = await prisma.$executeRaw`
    UPDATE "Appointment"
    SET "status" = 'CANCELLED'
    WHERE "id" = ${appointment.id}::uuid
      AND "customerEmail" = ${email}
      AND "status" = 'BOOKED'
      AND "startTime" > CURRENT_TIMESTAMP
  `;

  const updatedAppointment = await getPatientAppointment(appointment.id, email);
  if (String(updatedAppointment.status) === "COMPLETED") {
    return {
      appointment: updatedAppointment,
      alreadyCancelled: false,
      message: "This visit has ended and is marked as completed.",
    };
  }
  if (count === 0 && updatedAppointment.status === "BOOKED") {
    throw new AppError("CONFLICT", "This visit has started and can no longer be cancelled.", 409);
  }
  const alreadyCancelled = updatedAppointment.status === "CANCELLED";
  return {
    appointment: updatedAppointment,
    alreadyCancelled,
    message: alreadyCancelled ? "This visit was already cancelled." : "Your visit has been cancelled.",
  };
}

export function completeElapsedAppointments() {
  return prisma.$executeRaw`
    UPDATE "Appointment"
    SET "status" = 'COMPLETED'::"AppointmentStatus"
    WHERE "status" = 'BOOKED'
      AND "endTime" <= CURRENT_TIMESTAMP
  `;
}

export async function listPatientAppointments(email: string) {
  await completeElapsedAppointments();
  return prisma.appointment.findMany({
    where: { customerEmail: email },
    include: { provider: true },
    orderBy: { startTime: "desc" },
  });
}
