-- Copie este arquivo e cole no SQL Editor do Supabase Cloud para sincronizar o schema.
-- O bundle foi escrito para ser reaplicavel com seguranca.

CREATE TABLE IF NOT EXISTS "password_change_attempts" (
  "user_id" uuid PRIMARY KEY NOT NULL,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "last_attempt_at" timestamp DEFAULT now() NOT NULL,
  "last_success_at" timestamp
);

ALTER TABLE "business_directory" ADD COLUMN IF NOT EXISTS "image_url" text;
ALTER TABLE "business_directory" ADD COLUMN IF NOT EXISTS "instrument_types" text;
ALTER TABLE "business_directory" ADD COLUMN IF NOT EXISTS "repair_types" text;
ALTER TABLE "news_feed" ADD COLUMN IF NOT EXISTS "author" varchar(255) DEFAULT 'Admin-flame';
ALTER TABLE "news_suggestions" ADD COLUMN IF NOT EXISTS "image_url" text;

CREATE TABLE IF NOT EXISTS "favorite_businesses" (
  "user_id" uuid NOT NULL,
  "business_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "favorite_businesses_user_id_business_id_pk" PRIMARY KEY ("user_id", "business_id")
);

CREATE TABLE IF NOT EXISTS "favorite_professors" (
  "user_id" uuid NOT NULL,
  "professor_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "favorite_professors_user_id_professor_id_pk" PRIMARY KEY ("user_id", "professor_id")
);

CREATE TABLE IF NOT EXISTS "news_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "news_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "author_name" varchar(255) NOT NULL,
  "comment" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "news_likes" (
  "news_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "news_likes_news_id_user_id_pk" PRIMARY KEY ("news_id", "user_id")
);

CREATE TABLE IF NOT EXISTS "partner_programs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(120) NOT NULL UNIQUE,
  "name" varchar(180) NOT NULL,
  "short_description" text NOT NULL,
  "long_description" text NOT NULL,
  "category" varchar(80) NOT NULL,
  "difficulty" varchar(20) NOT NULL,
  "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "website_url" text NOT NULL,
  "affiliate_url" text,
  "editorial_rating" integer NOT NULL,
  "editorial_source" text NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'published',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "partner_program_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "program_id" uuid NOT NULL,
  "reviewer_key_hash" varchar(64) NOT NULL,
  "rating" integer NOT NULL,
  "reason" text NOT NULL,
  "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "status" varchar(20) NOT NULL DEFAULT 'published',
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "partner_program_reviews_program_reviewer_unique" UNIQUE ("program_id", "reviewer_key_hash")
);

CREATE TABLE IF NOT EXISTS "partner_suggestions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(180) NOT NULL,
  "website_url" text,
  "reason" text NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "password_change_attempts"
    ADD CONSTRAINT "password_change_attempts_user_id_user_profiles_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "favorite_businesses"
    ADD CONSTRAINT "favorite_businesses_user_id_user_profiles_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "favorite_businesses"
    ADD CONSTRAINT "favorite_businesses_business_id_business_directory_id_fk"
    FOREIGN KEY ("business_id") REFERENCES "public"."business_directory"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "favorite_professors"
    ADD CONSTRAINT "favorite_professors_user_id_user_profiles_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "favorite_professors"
    ADD CONSTRAINT "favorite_professors_professor_id_user_profiles_id_fk"
    FOREIGN KEY ("professor_id") REFERENCES "public"."user_profiles"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "news_comments"
    ADD CONSTRAINT "news_comments_news_id_news_feed_id_fk"
    FOREIGN KEY ("news_id") REFERENCES "public"."news_feed"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "news_comments"
    ADD CONSTRAINT "news_comments_user_id_user_profiles_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "news_likes"
    ADD CONSTRAINT "news_likes_news_id_news_feed_id_fk"
    FOREIGN KEY ("news_id") REFERENCES "public"."news_feed"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "news_likes"
    ADD CONSTRAINT "news_likes_user_id_user_profiles_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."appointment_status" AS ENUM ('pending', 'confirmed', 'completed', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "professor_availability" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "professor_id" uuid NOT NULL,
  "day_of_week" integer NOT NULL CHECK ("day_of_week" BETWEEN 0 AND 6),
  "start_time" time NOT NULL,
  "end_time" time NOT NULL
);

CREATE TABLE IF NOT EXISTS "appointments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL,
  "professor_id" uuid NOT NULL,
  "scheduled_at" timestamp with time zone NOT NULL,
  "status" "public"."appointment_status" DEFAULT 'pending' NOT NULL,
  "daily_room_url" text,
  "payment_id" text
);

DO $$ BEGIN
  CREATE TYPE "public"."class_booking_status" AS ENUM ('pending', 'confirmed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."payment_status" AS ENUM ('pending', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "teacher_availability" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "teacher_id" uuid NOT NULL,
  "day_of_week" integer NOT NULL CHECK ("day_of_week" BETWEEN 0 AND 6),
  "start_time" time NOT NULL,
  "end_time" time NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "class_bookings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL,
  "teacher_id" uuid NOT NULL,
  "scheduled_at" timestamp with time zone NOT NULL,
  "status" "public"."class_booking_status" DEFAULT 'pending' NOT NULL,
  "payment_status" "public"."payment_status" DEFAULT 'pending' NOT NULL,
  "meeting_url" text,
  "price_cents" integer DEFAULT 15000 NOT NULL,
  "platform_fee_cents" integer DEFAULT 1500 NOT NULL
);

ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "hourly_rate_cents" integer DEFAULT 15000 NOT NULL;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "mp_collector_id" text;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "mp_access_token" text;
ALTER TABLE "class_bookings" ADD COLUMN IF NOT EXISTS "price_cents" integer DEFAULT 15000 NOT NULL;
ALTER TABLE "class_bookings" ADD COLUMN IF NOT EXISTS "platform_fee_cents" integer DEFAULT 1500 NOT NULL;

DO $$ BEGIN
  ALTER TABLE "professor_availability" ADD CONSTRAINT "professor_availability_professor_id_user_profiles_id_fk"
    FOREIGN KEY ("professor_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "appointments" ADD CONSTRAINT "appointments_student_id_users_id_fk"
    FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "appointments" ADD CONSTRAINT "appointments_professor_id_user_profiles_id_fk"
    FOREIGN KEY ("professor_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "teacher_availability" ADD CONSTRAINT "teacher_availability_teacher_id_users_id_fk"
    FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "class_bookings" ADD CONSTRAINT "class_bookings_student_id_users_id_fk"
    FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "class_bookings" ADD CONSTRAINT "class_bookings_teacher_id_users_id_fk"
    FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
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
