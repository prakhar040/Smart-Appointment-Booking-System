const TZ = "Asia/Kolkata";

/** Today's calendar date in IST as YYYY-MM-DD (never derived from UTC). */
export const todayIST = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

function shift(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export const isSunday = (date: string) =>
  new Date(`${date}T00:00:00Z`).getUTCDay() === 0;

/** The first non-Sunday on or after `date`. */
export function nextWorkingDay(date: string): string {
  return isSunday(date) ? shift(date, 1) : date;
}

export const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));

/** Formats a YYYY-MM-DD calendar date without shifting its day. */
export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
