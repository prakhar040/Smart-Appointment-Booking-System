-- Add a readable public reference while preserving UUIDs as internal IDs.
ALTER TABLE "Appointment" ADD COLUMN "reference" VARCHAR(13);

-- Backfill existing appointments with unique references before enforcing NOT NULL.
DO $$
DECLARE
  appointment_row RECORD;
  candidate TEXT;
BEGIN
  FOR appointment_row IN SELECT "id" FROM "Appointment" ORDER BY "id" LOOP
    LOOP
      candidate := 'VIS-'
        || substr(upper(replace(gen_random_uuid()::text, '-', '')), 1, 4)
        || '-'
        || substr(upper(replace(gen_random_uuid()::text, '-', '')), 1, 4);
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM "Appointment" WHERE "reference" = candidate
      );
    END LOOP;

    UPDATE "Appointment"
    SET "reference" = candidate
    WHERE "id" = appointment_row."id";
  END LOOP;
END $$;

ALTER TABLE "Appointment" ALTER COLUMN "reference" SET NOT NULL;
CREATE UNIQUE INDEX "Appointment_reference_key" ON "Appointment"("reference");
