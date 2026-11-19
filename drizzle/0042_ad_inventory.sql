DO $$ BEGIN
  CREATE TYPE "public"."ad_campaign_status" AS ENUM (
    'draft',
    'pending_payment',
    'pending_review',
    'approved',
    'active',
    'rejected',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ad_campaigns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
  "business_name" varchar(180) NOT NULL,
  "contact_email" varchar(320) NOT NULL,
  "destination_url" text NOT NULL,
  "asset_url" text,
  "asset_storage_path" text,
  "asset_mime_type" varchar(80),
  "asset_alt_text" varchar(180) NOT NULL,
  "slot_count" integer DEFAULT 1 NOT NULL,
  "monthly_amount_cents" integer NOT NULL,
  "status" "public"."ad_campaign_status" DEFAULT 'draft' NOT NULL,
  "billing_status" varchar(40) DEFAULT 'pending' NOT NULL,
  "stripe_checkout_session_id" varchar(255) UNIQUE,
  "stripe_subscription_id" varchar(255) UNIQUE,
  "contract_version" varchar(40) NOT NULL,
  "advertiser_accepted_at" timestamp,
  "admin_approved_at" timestamp,
  "review_notes" text,
  "reserved_until" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ad_campaigns_status_idx" ON "ad_campaigns" ("status");
CREATE INDEX IF NOT EXISTS "ad_campaigns_user_id_idx" ON "ad_campaigns" ("user_id");

CREATE TABLE IF NOT EXISTS "ad_inventory_slots" (
  "slot_number" integer PRIMARY KEY,
  "campaign_id" uuid REFERENCES "ad_campaigns"("id") ON DELETE SET NULL,
  "click_count" integer DEFAULT 0 NOT NULL,
  "impression_count" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

INSERT INTO "ad_inventory_slots" ("slot_number")
SELECT slot_number FROM generate_series(1, 10) AS slot_number
ON CONFLICT ("slot_number") DO NOTHING;
