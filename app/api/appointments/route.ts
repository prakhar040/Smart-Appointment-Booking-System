import { toAppointmentDto } from "../../../src/lib/dto";
import { handle, json, readJson } from "../../../src/lib/http";
import { bookAppointment, listPatientAppointments } from "../../../src/services/appointments";
import { requirePatient } from "../../../src/lib/patient-auth";

export function GET(request: Request) {
  return handle(async () => {
    const email = requirePatient(request);
    const appointments = await listPatientAppointments(email);
    return json({ appointments: appointments.map(toAppointmentDto) });
  });
}

export function POST(request: Request) {
  return handle(async () => {
    const email = requirePatient(request);
    const body = await readJson(request);
    const idempotencyKey = request.headers.get("Idempotency-Key") ?? "";
    const appointment = await bookAppointment(body, email, idempotencyKey);
    return json({ appointment: toAppointmentDto(appointment) }, 201);
  });
}
