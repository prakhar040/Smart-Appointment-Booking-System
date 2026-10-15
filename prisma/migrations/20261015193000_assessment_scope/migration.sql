DROP INDEX IF EXISTS "Appointment_status_endTime_idx";
DROP INDEX IF EXISTS "uniq_active_slot";

ALTER TABLE "Appointment"
DROP COLUMN IF EXISTS "idempotencyKey";

DROP TABLE IF EXISTS "Patient";

UPDATE "Appointment"
SET "status" = 'BOOKED'::"AppointmentStatus"
WHERE "status"::text = 'COMPLETED';

ALTER TABLE "Appointment"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TYPE "AppointmentStatus" RENAME TO "AppointmentStatus_old";

CREATE TYPE "AppointmentStatus" AS ENUM ('BOOKED', 'CANCELLED');

ALTER TABLE "Appointment"
ALTER COLUMN "status" TYPE "AppointmentStatus"
USING ("status"::text::"AppointmentStatus");

ALTER TABLE "Appointment"
ALTER COLUMN "status" SET DEFAULT 'BOOKED';

DROP TYPE "AppointmentStatus_old";

CREATE UNIQUE INDEX "uniq_active_slot"
ON "Appointment" ("providerId", "startTime")
WHERE "status" = 'BOOKED';
