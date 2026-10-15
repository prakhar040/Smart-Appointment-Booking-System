import type { ApiErrorBody, AppointmentDto } from "./dto";
import type { SlotAvailability } from "../services/appointments";

export type ProviderDto = { id: string; name: string };
export type SlotsResponse = {
  providerId: string;
  date: string;
  closed: boolean;
  slots: SlotAvailability[];
};

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiClientError(
      "NETWORK_ERROR",
      "Could not reach the server. Check your connection and try again.",
      0,
    );
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // A non-JSON server response is reported with a safe fallback below.
  }

  if (!res.ok) {
    const err = (data as ApiErrorBody | null)?.error;
    throw new ApiClientError(
      err?.code ?? "UNKNOWN",
      err?.message ?? "Something went wrong. Please try again.",
      res.status,
    );
  }

  return data as T;
}

export const api = {
  providers: () => request<{ providers: ProviderDto[] }>("/api/providers"),

  slots: (providerId: string, date: string) =>
    request<SlotsResponse>(
      `/api/providers/${encodeURIComponent(providerId)}/slots?date=${encodeURIComponent(date)}`,
    ),

  book: (body: {
    providerId: string;
    customerName: string;
    customerEmail: string;
    startTime: string;
  }) =>
    request<{ appointment: AppointmentDto }>("/api/appointments", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  appointment: (id: string) =>
    request<{ appointment: AppointmentDto }>(
      `/api/appointments/${encodeURIComponent(id)}`,
    ),

  cancel: (id: string) =>
    request<{
      appointment: AppointmentDto;
      alreadyCancelled: boolean;
      message: string;
    }>(`/api/appointments/${encodeURIComponent(id)}/cancel`, { method: "POST" }),

  list: () => request<{ appointments: AppointmentDto[] }>("/api/appointments"),
};
