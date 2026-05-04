ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "assigned_user_ids" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "completion_mode" text NOT NULL DEFAULT 'single';

-- Migrate existing single assignee to array
UPDATE "tasks"
SET "assigned_user_ids" = jsonb_build_array("assigned_user_id"::text)
WHERE "assigned_user_id" IS NOT NULL
  AND "assigned_user_ids" = '[]'::jsonb;
