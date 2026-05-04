ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "recurrence_days_of_week" jsonb;
UPDATE "tasks"
SET "recurrence_days_of_week" = jsonb_build_array("recurrence_day_of_week")
WHERE "recurrence_day_of_week" IS NOT NULL
  AND "recurrence_type" IN ('weekly', 'biweekly')
  AND "recurrence_days_of_week" IS NULL;
