import { toAppointmentDto } from "../../../../../src/lib/dto";
import { handle, json } from "../../../../../src/lib/http";
import { cancelAppointment } from "../../../../../src/services/appointments";

export function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const { appointment, alreadyCancelled } = await cancelAppointment(id);
    return json({
      appointment: toAppointmentDto(appointment),
      alreadyCancelled,
      message: alreadyCancelled
        ? "This visit was already cancelled."
        : "Your visit has been cancelled.",
    });
  });
}
