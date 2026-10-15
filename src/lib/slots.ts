import { DateTime } from "luxon";
import { config, type SlotConfig } from "./config";
import { AppError } from "./errors";

export type Slot = { start: Date; end: Date };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse "YYYY-MM-DD" as midnight in the configured timezone. */
export function parseDay(date: string, cfg: SlotConfig = config): DateTime {
  const day = DATE_RE.test(date)
    ? DateTime.fromFormat(date, "yyyy-MM-dd", { zone: cfg.timezone })
    : null;
  if (!day || !day.isValid) {
    throw new AppError("VALIDATION_ERROR", "date must be a valid YYYY-MM-DD", 400);
  }
  return day;
}

/** The calendar date (in the configured timezone) that an instant falls on. */
export function toDateString(instant: Date, cfg: SlotConfig = config): string {
  return DateTime.fromJSDate(instant, { zone: cfg.timezone }).toFormat("yyyy-MM-dd");
}

/** All slots for a given local date. Empty on non-working days. */
export function generateSlots(date: string, cfg: SlotConfig = config): Slot[] {
  const day = parseDay(date, cfg);
  if (!cfg.workingDays.includes(day.weekday)) return [];

  const close = day.set({ hour: cfg.workEndHour }).toMillis();
  let cursor = day.set({ hour: cfg.workStartHour });
  const slots: Slot[] = [];

  while (cursor.plus({ minutes: cfg.slotMinutes }).toMillis() <= close) {
    const end = cursor.plus({ minutes: cfg.slotMinutes });
    slots.push({ start: cursor.toJSDate(), end: end.toJSDate() });
    cursor = end;
  }
  return slots;
}

/**
 * Validates a requested start time and returns the canonical slot
 * (with a server-computed end time). Throws AppError(400) if invalid.
 */
export function validateSlot(
  start: Date,
  now: Date = new Date(),
  cfg: SlotConfig = config,
): Slot {
  if (Number.isNaN(start.getTime())) {
    throw new AppError("VALIDATION_ERROR", "startTime is not a valid date", 400);
  }

  const slots = generateSlots(toDateString(start, cfg), cfg);
  if (slots.length === 0) {
    throw new AppError("VALIDATION_ERROR", "Appointments are not available on this day", 400);
  }

  const slot = slots.find((s) => s.start.getTime() === start.getTime());
  if (!slot) {
    const fmt = (d: Date) =>
      DateTime.fromJSDate(d, { zone: cfg.timezone }).toFormat("HH:mm");
    throw new AppError(
      "VALIDATION_ERROR",
      `Start time must be a ${cfg.slotMinutes}-minute slot between ${fmt(slots[0].start)} and ${fmt(slots[slots.length - 1].start)}`,
      400,
    );
  }

  if (slot.start.getTime() <= now.getTime()) {
    throw new AppError("VALIDATION_ERROR", "Cannot book an appointment in the past", 400);
  }

  return slot;
}