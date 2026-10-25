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

CREATE TABLE IF NOT EXISTS "teacher_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "booking_id" uuid NOT NULL UNIQUE REFERENCES "class_bookings"("id") ON DELETE CASCADE,
  "student_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "teacher_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "rating" integer NOT NULL,
  "comment" text NOT NULL,
  "visibility" "public"."review_visibility" DEFAULT 'public' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "entity_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "reporter_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "target_type" "public"."report_target_type" NOT NULL,
  "target_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "target_directory_id" uuid REFERENCES "business_directory"("id") ON DELETE SET NULL,
  "booking_id" uuid REFERENCES "class_bookings"("id") ON DELETE SET NULL,
  "reason" "public"."report_reason" NOT NULL,
  "details" text NOT NULL,
  "status" "public"."report_status" DEFAULT 'open' NOT NULL,
  "admin_notes" text,
  "resolved_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "resolved_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "teacher_reviews_teacher_id_idx" ON "teacher_reviews" ("teacher_id");
CREATE INDEX IF NOT EXISTS "entity_reports_status_created_at_idx" ON "entity_reports" ("status", "created_at");
