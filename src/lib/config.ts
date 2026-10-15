export type SlotConfig = {
  timezone: string;
  workStartHour: number;
  workEndHour: number;
  slotMinutes: number;
  workingDays: number[]; // Luxon weekdays: 1 = Mon ... 7 = Sun
};

function int(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return value !== undefined && Number.isInteger(n) ? n : fallback;
}

export const config: SlotConfig = {
  timezone: process.env.TIMEZONE ?? "Asia/Kolkata",
  workStartHour: int(process.env.WORK_START_HOUR, 10),
  workEndHour: int(process.env.WORK_END_HOUR, 18),
  slotMinutes: int(process.env.SLOT_MINUTES, 30),
  workingDays: (process.env.WORKING_DAYS ?? "1,2,3,4,5,6")
    .split(",")
    .map((d) => Number(d.trim()))
    .filter((d) => d >= 1 && d <= 7),
};