import { toAppointmentDto } from "../../../src/lib/dto";
import { handle, json, readJson } from "../../../src/lib/http";
import { bookAppointment, listAppointments } from "../../../src/services/appointments";

export function GET() {
  return handle(async () => {
    const appointments = await listAppointments();
    return json({ appointments: appointments.map(toAppointmentDto) });
  });
}

export function POST(request: Request) {
  return handle(async () => {
    const body = await readJson(request);
    const appointment = await bookAppointment(body);
    return json({ appointment: toAppointmentDto(appointment) }, 201);
  });
}