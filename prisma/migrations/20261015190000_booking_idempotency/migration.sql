ALTER TABLE "Appointment"
ADD COLUMN "idempotencyKey" UUID;

UPDATE "Appointment"
SET "idempotencyKey" = gen_random_uuid()
WHERE "idempotencyKey" IS NULL;

ALTER TABLE "Appointment"
ALTER COLUMN "idempotencyKey" SET NOT NULL;

CREATE UNIQUE INDEX "Appointment_idempotencyKey_key"
ON "Appointment"("idempotencyKey");
