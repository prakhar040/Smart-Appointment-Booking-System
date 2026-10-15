import { toAppointmentDto } from "../../../../../src/lib/dto";
import { handle, json } from "../../../../../src/lib/http";
import { cancelAppointment } from "../../../../../src/services/appointments";
import { requirePatient } from "../../../../../src/lib/patient-auth";

export function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const email = requirePatient(request);
    const { id } = await params;
    const { appointment, alreadyCancelled, message } = await cancelAppointment(id, email);
    return json({
      appointment: toAppointmentDto(appointment),
      alreadyCancelled,
      message,
    });
  });
}
