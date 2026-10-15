import { POST as bookRoute } from "../../app/api/appointments/route";
import { POST as cancelRoute } from "../../app/api/appointments/[id]/cancel/route";
import { GET as slotsRoute } from "../../app/api/providers/[id]/slots/route";

export const MONDAY = "2030-01-07";
export const SUNDAY = "2030-01-06";

/** An IST wall-clock time, e.g. at("10:30") -> 2030-01-07T10:30:00+05:30 */
export const at = (hhmm: string, date = MONDAY) => `${date}T${hhmm}:00+05:30`;

export const payload = (
  providerId: string,
  startTime: string,
  overrides: Record<string, unknown> = {},
) => ({
  providerId,
  customerName: "Asha",
  customerEmail: "asha@example.com",
  startTime,
  ...overrides,
});

export async function book(body: unknown) {
  const res = await bookRoute(
    new Request("http://test/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
  return { status: res.status, body: await res.json() };
}

export async function cancel(id: string) {
  const res = await cancelRoute(
    new Request(`http://test/api/appointments/${id}/cancel`, { method: "POST" }),
    { params: Promise.resolve({ id }) },
  );
  return { status: res.status, body: await res.json() };
}

export async function slots(providerId: string, date?: string) {
  const query = date === undefined ? "" : `?date=${encodeURIComponent(date)}`;
  const res = await slotsRoute(
    new Request(`http://test/api/providers/${providerId}/slots${query}`),
    { params: Promise.resolve({ id: providerId }) },
  );
  return { status: res.status, body: await res.json() };
}
