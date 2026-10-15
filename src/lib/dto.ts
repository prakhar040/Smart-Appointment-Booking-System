import type { Appointment, Provider } from "@prisma/client";
import { toDateString } from "./slots";

export type AppointmentDto = {
  id: string;
  provider: { id: string; name: string };
  customerName: string;
  customerEmail: string;
  date: string; // YYYY-MM-DD in the configured timezone
  startTime: string; // ISO instant (UTC)
  endTime: string;
  status: "BOOKED" | "CANCELLED";
  createdAt: string;
};

export type ApiErrorBody = { error: { code: string; message: string } };

export function toAppointmentDto(a: Appointment & { provider: Provider }): AppointmentDto {
  return {
    id: a.id,
    provider: { id: a.provider.id, name: a.provider.name },
    customerName: a.customerName,
    customerEmail: a.customerEmail,
    date: toDateString(a.startTime),
    startTime: a.startTime.toISOString(),
    endTime: a.endTime.toISOString(),
    status: a.status,
    createdAt: a.createdAt.toISOString(),
  };
}