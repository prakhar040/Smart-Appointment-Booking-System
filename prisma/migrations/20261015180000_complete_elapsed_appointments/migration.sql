ALTER TYPE "AppointmentStatus" ADD VALUE 'COMPLETED';

CREATE INDEX "Appointment_status_endTime_idx"
ON "Appointment"("status", "endTime");
