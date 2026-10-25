ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "hourly_rate_cents" integer DEFAULT 15000 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "mp_collector_id" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "mp_access_token" text;--> statement-breakpoint
ALTER TABLE "class_bookings" ADD COLUMN IF NOT EXISTS "price_cents" integer DEFAULT 15000 NOT NULL;--> statement-breakpoint
ALTER TABLE "class_bookings" ADD COLUMN IF NOT EXISTS "platform_fee_cents" integer DEFAULT 1500 NOT NULL;
