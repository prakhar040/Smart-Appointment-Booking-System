import { toAppointmentDto } from "../../../../src/lib/dto";
import { handle, json } from "../../../../src/lib/http";
import { getPatientAppointment } from "../../../../src/services/appointments";
import { requirePatient } from "../../../../src/lib/patient-auth";

export function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const email = requirePatient(request);
    const { id } = await params;
    const appointment = await getPatientAppointment(id, email);
    return json({ appointment: toAppointmentDto(appointment) });
  });
}
