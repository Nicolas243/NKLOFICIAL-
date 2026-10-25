ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "is_suspended" boolean NOT NULL DEFAULT false;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "suspended_at" timestamp;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "suspension_reason" text;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "resolved_reports_count" integer NOT NULL DEFAULT 0;
ALTER TABLE "business_directory" ADD COLUMN IF NOT EXISTS "is_suspended" boolean NOT NULL DEFAULT false;
ALTER TABLE "business_directory" ADD COLUMN IF NOT EXISTS "suspended_at" timestamp;
ALTER TABLE "business_directory" ADD COLUMN IF NOT EXISTS "suspension_reason" text;
ALTER TABLE "business_directory" ADD COLUMN IF NOT EXISTS "resolved_reports_count" integer NOT NULL DEFAULT 0;
ALTER TABLE "class_bookings" ADD COLUMN IF NOT EXISTS "completed_at" timestamp;

CREATE INDEX IF NOT EXISTS "user_profiles_is_suspended_idx"
  ON "user_profiles" ("is_suspended") WHERE "is_suspended" = true;
CREATE INDEX IF NOT EXISTS "business_directory_is_suspended_idx"
  ON "business_directory" ("is_suspended") WHERE "is_suspended" = true;

ALTER TABLE "teacher_availability" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "class_bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "student_plan_enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teacher_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "entity_reports" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "teacher_availability_owner_policy" ON "teacher_availability"
    USING (auth.uid() = "teacher_id") WITH CHECK (auth.uid() = "teacher_id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "class_bookings_participant_policy" ON "class_bookings"
    USING (auth.uid() = "student_id" OR auth.uid() = "teacher_id")
    WITH CHECK (auth.uid() = "student_id" OR auth.uid() = "teacher_id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "student_plan_enrollments_participant_policy" ON "student_plan_enrollments"
    USING (auth.uid() = "student_id" OR auth.uid() = "teacher_id")
    WITH CHECK (auth.uid() = "student_id" OR auth.uid() = "teacher_id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "teacher_reviews_visibility_policy" ON "teacher_reviews"
    USING (auth.uid() = "student_id" OR auth.uid() = "teacher_id" OR "visibility" = 'public');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "entity_reports_owner_policy" ON "entity_reports"
    USING (auth.uid() = "reporter_id" OR auth.uid() = "target_user_id")
    WITH CHECK (auth.uid() = "reporter_id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
