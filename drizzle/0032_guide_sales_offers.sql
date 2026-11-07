DO $$ BEGIN
  CREATE TYPE "public"."guide_purchase_status" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "guide_purchases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text,
  "status" "public"."guide_purchase_status" DEFAULT 'pending' NOT NULL,
  "payment_id" text,
  "amount_cents" integer NOT NULL,
  "offer_variant" varchar(64),
  "download_count" integer DEFAULT 0 NOT NULL,
  "max_downloads" integer DEFAULT 8 NOT NULL,
  "last_downloaded_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "guide_purchases"
  ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "guide_purchases"
  ADD COLUMN IF NOT EXISTS "offer_variant" varchar(64);
ALTER TABLE "guide_purchases"
  ADD COLUMN IF NOT EXISTS "download_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "guide_purchases"
  ADD COLUMN IF NOT EXISTS "max_downloads" integer DEFAULT 8 NOT NULL;
ALTER TABLE "guide_purchases"
  ADD COLUMN IF NOT EXISTS "last_downloaded_at" timestamp;

CREATE TABLE IF NOT EXISTS "guide_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "external_reference" varchar(120) NOT NULL UNIQUE,
  "gateway_subscription_id" varchar(120) UNIQUE,
  "email" text,
  "status" varchar(30) DEFAULT 'pending' NOT NULL,
  "amount_cents" integer NOT NULL,
  "offer_variant" varchar(64),
  "download_count" integer DEFAULT 0 NOT NULL,
  "max_downloads" integer DEFAULT 8 NOT NULL,
  "last_downloaded_at" timestamp,
  "current_period_end" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "guide_subscriptions"
  ADD COLUMN IF NOT EXISTS "download_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "guide_subscriptions"
  ADD COLUMN IF NOT EXISTS "max_downloads" integer DEFAULT 8 NOT NULL;
ALTER TABLE "guide_subscriptions"
  ADD COLUMN IF NOT EXISTS "last_downloaded_at" timestamp;

CREATE TABLE IF NOT EXISTS "guide_offer_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "experiment" varchar(40) NOT NULL,
  "variant" varchar(64) NOT NULL,
  "event_type" varchar(20) NOT NULL,
  "purchase_id" uuid REFERENCES "guide_purchases"("id") ON DELETE SET NULL,
  "subscription_id" uuid REFERENCES "guide_subscriptions"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "guide_offer_events_experiment_variant_idx"
  ON "guide_offer_events" ("experiment", "variant", "event_type");
