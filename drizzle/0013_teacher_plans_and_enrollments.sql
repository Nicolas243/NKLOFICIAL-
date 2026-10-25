DO $$ BEGIN
  CREATE TYPE "public"."class_plan_modality" AS ENUM ('single', 'monthly', 'semiannual', 'annual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enrollment_status" AS ENUM ('active', 'exhausted', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "single_class_price_cents" integer DEFAULT 15000 NOT NULL;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "monthly_plan_price_cents" integer DEFAULT 54000 NOT NULL;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "semiannual_plan_price_cents" integer DEFAULT 288000 NOT NULL;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "annual_plan_price_cents" integer DEFAULT 504000 NOT NULL;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "mp_refresh_token" text;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "mp_token_expires_at" timestamp;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "mp_connected_at" timestamp;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "accepts_new_students" boolean DEFAULT true NOT NULL;

CREATE TABLE IF NOT EXISTS "student_plan_enrollments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "teacher_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
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

ALTER TABLE "class_bookings" ADD COLUMN IF NOT EXISTS "plan_modality" "public"."class_plan_modality" DEFAULT 'single' NOT NULL;
ALTER TABLE "class_bookings" ADD COLUMN IF NOT EXISTS "enrollment_id" uuid;
ALTER TABLE "class_bookings" ADD COLUMN IF NOT EXISTS "teacher_net_cents" integer DEFAULT 14250 NOT NULL;
ALTER TABLE "class_bookings" ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp;

DO $$ BEGIN
  ALTER TABLE "class_bookings" ADD CONSTRAINT "class_bookings_enrollment_id_student_plan_enrollments_id_fk"
    FOREIGN KEY ("enrollment_id") REFERENCES "student_plan_enrollments"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "student_plan_enrollments_student_teacher_status_idx"
  ON "student_plan_enrollments" ("student_id", "teacher_id", "status");
CREATE INDEX IF NOT EXISTS "class_bookings_enrollment_id_idx"
  ON "class_bookings" ("enrollment_id");
