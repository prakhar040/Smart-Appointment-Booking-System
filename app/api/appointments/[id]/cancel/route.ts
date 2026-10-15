import { toAppointmentDto } from "../../../../../src/lib/dto";
import { handle, json } from "../../../../../src/lib/http";
import { cancelAppointment } from "../../../../../src/services/appointments";

export function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const result = await cancelAppointment(id);
    return json({
      appointment: toAppointmentDto(result.appointment),
      alreadyCancelled: result.alreadyCancelled,
      message: result.message,
    });
  });
}
