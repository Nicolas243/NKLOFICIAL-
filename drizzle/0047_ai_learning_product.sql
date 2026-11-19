DO $$ BEGIN
  CREATE TYPE "ai_access_status" AS ENUM ('pending', 'active', 'canceling', 'canceled', 'past_due');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "ai_access_plan" AS ENUM ('one_time', 'subscription');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_course_lessons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "module_slug" varchar(80) NOT NULL,
  "lesson_slug" varchar(120) NOT NULL,
  "title" varchar(180) NOT NULL,
  "objective" text NOT NULL,
  "content_json" jsonb NOT NULL,
  "published_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ai_course_lessons_lesson_slug_unique" UNIQUE("lesson_slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_access_grants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
  "product_key" varchar(80) NOT NULL,
  "plan" "ai_access_plan" NOT NULL,
  "status" "ai_access_status" NOT NULL,
  "stripe_customer_id" varchar(255),
  "stripe_subscription_id" varchar(255),
  "access_until" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ai_access_grants_user_product_unique" UNIQUE("user_id", "product_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_learning_progress" (
  "user_id" uuid NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
  "lesson_slug" varchar(120) NOT NULL,
  "completed_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ai_learning_progress_pk" PRIMARY KEY("user_id", "lesson_slug")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_access_grants_product_status_idx"
  ON "ai_access_grants" USING btree ("product_key", "status");
CREATE INDEX IF NOT EXISTS "ai_learning_progress_lesson_idx"
  ON "ai_learning_progress" USING btree ("lesson_slug");
