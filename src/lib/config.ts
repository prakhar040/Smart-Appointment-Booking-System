export type SlotConfig = {
  timezone: string;
  workStartHour: number;
  workEndHour: number;
  slotMinutes: number;
  workingDays: number[]; // Luxon weekdays: 1 = Mon ... 7 = Sun
};

export const providerNames = ["Dr. Asha Verma", "Dr. Rohan Mehta"] as const;

export const config: SlotConfig = {
  timezone: "Asia/Kolkata",
  workStartHour: 10,
  workEndHour: 18,
  slotMinutes: 30,
  workingDays: [1, 2, 3, 4, 5, 6],
};
