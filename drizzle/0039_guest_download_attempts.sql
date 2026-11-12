CREATE TABLE IF NOT EXISTS "guide_download_attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "access_key" varchar(180) NOT NULL,
  "asset_id" varchar(80) NOT NULL,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "last_attempt_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "guide_download_attempts_access_asset_unique" UNIQUE("access_key", "asset_id")
);
