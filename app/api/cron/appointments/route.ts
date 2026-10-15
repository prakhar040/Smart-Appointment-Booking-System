import { timingSafeEqual } from "node:crypto";
import { AppError } from "../../../../src/lib/errors";
import { handle, json } from "../../../../src/lib/http";
import { completeElapsedAppointments } from "../../../../src/services/appointments";

export function POST(request: Request) {
  return handle(async () => {
    const secret = process.env.APPOINTMENT_CRON_SECRET;
    if (!secret || secret.length < 32) {
      throw new AppError("INTERNAL_ERROR", "Appointment scheduler is not configured.", 500);
    }
    const authorization = request.headers.get("authorization") ?? "";
    const provided = Buffer.from(authorization.startsWith("Bearer ") ? authorization.slice(7) : "");
    const expected = Buffer.from(secret);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      throw new AppError("UNAUTHORIZED", "Invalid scheduler credentials.", 401);
    }

    const completed = await completeElapsedAppointments();
    return json({ completed });
  });
}
