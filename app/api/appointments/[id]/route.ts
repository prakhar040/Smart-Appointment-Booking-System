import { toAppointmentDto } from "../../../../src/lib/dto";
import { handle, json } from "../../../../src/lib/http";
import { getAppointment } from "../../../../src/services/appointments";

export function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const appointment = await getAppointment(id);
    return json({ appointment: toAppointmentDto(appointment) });
  });
}
