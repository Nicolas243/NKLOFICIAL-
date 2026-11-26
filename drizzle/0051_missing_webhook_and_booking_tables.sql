-- 0051_missing_webhook_and_booking_tables.sql
-- Additive, idempotent schema parity migration restoring tables/columns
-- from 0011-0016 and 0035 missing in remote Supabase Postgres.

DO $$ BEGIN
  CREATE TYPE "public"."class_booking_status" AS ENUM ('pending', 'confirmed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."payment_status" AS ENUM ('pending', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."class_plan_modality" AS ENUM ('single', 'monthly', 'semiannual', 'annual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enrollment_status" AS ENUM ('active', 'exhausted', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."review_visibility" AS ENUM ('public', 'teacher_only', 'admin_only');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."report_target_type" AS ENUM ('student', 'teacher', 'store', 'luthier');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."report_reason" AS ENUM ('fraud', 'harassment', 'no_show', 'inappropriate_content', 'commercial_violation', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."report_status" AS ENUM ('open', 'under_review', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "public"."stripe_webhook_events" (
  "id" text PRIMARY KEY NOT NULL,
  "type" varchar(100) NOT NULL,
  "processed_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."teacher_availability" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "teacher_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "day_of_week" integer NOT NULL,
  "start_time" time NOT NULL,
  "end_time" time NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  CONSTRAINT "teacher_availability_day_of_week_check" CHECK ("day_of_week" BETWEEN 0 AND 6)
);

CREATE TABLE IF NOT EXISTS "public"."student_plan_enrollments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "teacher_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "modality" "public"."class_plan_modality" NOT NULL,
  "total_credits" integer NOT NULL,
  "used_credits" integer DEFAULT 0 NOT NULL,
  "price_paid_cents" integer NOT NULL,
  "platform_fee_cents" integer NOT NULL,
  "status" "public"."enrollment_status" DEFAULT 'active' NOT NULL,
  "mp_payment_id" text,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."class_bookings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "teacher_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "scheduled_at" timestamp with time zone NOT NULL,
  "status" "public"."class_booking_status" DEFAULT 'pending' NOT NULL,
  "payment_status" "public"."payment_status" DEFAULT 'pending' NOT NULL,
  "meeting_url" text,
  "price_cents" integer DEFAULT 15000 NOT NULL,
  "platform_fee_cents" integer DEFAULT 1500 NOT NULL,
  "plan_modality" "public"."class_plan_modality" DEFAULT 'single' NOT NULL,
  "enrollment_id" uuid REFERENCES "public"."student_plan_enrollments"("id"),
  "teacher_net_cents" integer DEFAULT 14250 NOT NULL,
  "cancelled_at" timestamp,
  "reminder_sent_at" timestamp,
  "completed_at" timestamp
);

CREATE TABLE IF NOT EXISTS "public"."teacher_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "booking_id" uuid NOT NULL UNIQUE REFERENCES "public"."class_bookings"("id") ON DELETE CASCADE,
  "student_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "teacher_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "rating" integer NOT NULL,
  "comment" text NOT NULL,
  "visibility" "public"."review_visibility" DEFAULT 'public' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."entity_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "reporter_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "target_type" "public"."report_target_type" NOT NULL,
  "target_user_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "target_directory_id" uuid REFERENCES "public"."business_directory"("id") ON DELETE SET NULL,
  "booking_id" uuid REFERENCES "public"."class_bookings"("id") ON DELETE SET NULL,
  "reason" "public"."report_reason" NOT NULL,
  "details" text NOT NULL,
  "status" "public"."report_status" DEFAULT 'open' NOT NULL,
  "admin_notes" text,
  "resolved_by" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "resolved_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "public"."business_directory" ADD COLUMN IF NOT EXISTS "is_suspended" boolean DEFAULT false NOT NULL;
ALTER TABLE "public"."business_directory" ADD COLUMN IF NOT EXISTS "suspended_at" timestamp;
ALTER TABLE "public"."business_directory" ADD COLUMN IF NOT EXISTS "suspension_reason" text;
ALTER TABLE "public"."business_directory" ADD COLUMN IF NOT EXISTS "resolved_reports_count" integer DEFAULT 0 NOT NULL;

CREATE INDEX IF NOT EXISTS "business_directory_is_suspended_idx"
  ON "public"."business_directory" ("is_suspended") WHERE "is_suspended" = true;
CREATE INDEX IF NOT EXISTS "idx_teacher_availability_teacher_id"
  ON "public"."teacher_availability" ("teacher_id");
CREATE INDEX IF NOT EXISTS "student_plan_enrollments_student_teacher_status_idx"
  ON "public"."student_plan_enrollments" ("student_id", "teacher_id", "status");
CREATE INDEX IF NOT EXISTS "idx_student_plan_enrollments_teacher_id"
  ON "public"."student_plan_enrollments" ("teacher_id");
CREATE INDEX IF NOT EXISTS "idx_class_bookings_student_id"
  ON "public"."class_bookings" ("student_id");
CREATE INDEX IF NOT EXISTS "idx_class_bookings_teacher_id"
  ON "public"."class_bookings" ("teacher_id");
CREATE INDEX IF NOT EXISTS "class_bookings_enrollment_id_idx"
  ON "public"."class_bookings" ("enrollment_id");
CREATE INDEX IF NOT EXISTS "class_bookings_reminder_window_idx"
  ON "public"."class_bookings" ("status", "payment_status", "scheduled_at", "reminder_sent_at");
CREATE INDEX IF NOT EXISTS "idx_teacher_reviews_student_id"
  ON "public"."teacher_reviews" ("student_id");
CREATE INDEX IF NOT EXISTS "teacher_reviews_teacher_id_idx"
  ON "public"."teacher_reviews" ("teacher_id");
CREATE INDEX IF NOT EXISTS "idx_entity_reports_reporter_id"
  ON "public"."entity_reports" ("reporter_id");
CREATE INDEX IF NOT EXISTS "idx_entity_reports_target_user_id"
  ON "public"."entity_reports" ("target_user_id");
CREATE INDEX IF NOT EXISTS "idx_entity_reports_target_directory_id"
  ON "public"."entity_reports" ("target_directory_id");
CREATE INDEX IF NOT EXISTS "idx_entity_reports_booking_id"
  ON "public"."entity_reports" ("booking_id");
CREATE INDEX IF NOT EXISTS "idx_entity_reports_resolved_by"
  ON "public"."entity_reports" ("resolved_by");
CREATE INDEX IF NOT EXISTS "entity_reports_status_created_at_idx"
  ON "public"."entity_reports" ("status", "created_at");

ALTER TABLE "public"."stripe_webhook_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."teacher_availability" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_plan_enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."class_bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."teacher_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."entity_reports" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "deny_direct_client_access" ON "public"."stripe_webhook_events"
    AS RESTRICTIVE FOR ALL TO anon, authenticated
    USING (false) WITH CHECK (false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "teacher_availability_owner_policy" ON "public"."teacher_availability"
    USING ((SELECT auth.uid()) = "teacher_id")
    WITH CHECK ((SELECT auth.uid()) = "teacher_id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "class_bookings_participant_policy" ON "public"."class_bookings"
    USING ((SELECT auth.uid()) = "student_id" OR (SELECT auth.uid()) = "teacher_id")
    WITH CHECK ((SELECT auth.uid()) = "student_id" OR (SELECT auth.uid()) = "teacher_id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "student_plan_enrollments_participant_policy" ON "public"."student_plan_enrollments"
    USING ((SELECT auth.uid()) = "student_id" OR (SELECT auth.uid()) = "teacher_id")
    WITH CHECK ((SELECT auth.uid()) = "student_id" OR (SELECT auth.uid()) = "teacher_id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "teacher_reviews_visibility_policy" ON "public"."teacher_reviews"
    USING ((SELECT auth.uid()) = "student_id" OR (SELECT auth.uid()) = "teacher_id" OR "visibility" = 'public');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "entity_reports_owner_policy" ON "public"."entity_reports"
    USING ((SELECT auth.uid()) = "reporter_id" OR (SELECT auth.uid()) = "target_user_id")
    WITH CHECK ((SELECT auth.uid()) = "reporter_id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
