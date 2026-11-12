ALTER TABLE "guide_purchases"
  ADD COLUMN IF NOT EXISTS "guest_full_name" varchar(160),
  ADD COLUMN IF NOT EXISTS "guest_email" varchar(320),
  ADD COLUMN IF NOT EXISTS "encrypted_cpf" text,
  ADD COLUMN IF NOT EXISTS "cpf_consent_version" varchar(40),
  ADD COLUMN IF NOT EXISTS "cpf_consent_at" timestamp,
  ADD COLUMN IF NOT EXISTS "guest_access_token_hash" varchar(64),
  ADD COLUMN IF NOT EXISTS "guest_access_token_expires_at" timestamp,
  ADD COLUMN IF NOT EXISTS "guest_access_token_consumed_at" timestamp;

ALTER TABLE "guide_subscriptions"
  ADD COLUMN IF NOT EXISTS "guest_full_name" varchar(160),
  ADD COLUMN IF NOT EXISTS "guest_email" varchar(320),
  ADD COLUMN IF NOT EXISTS "encrypted_cpf" text,
  ADD COLUMN IF NOT EXISTS "cpf_consent_version" varchar(40),
  ADD COLUMN IF NOT EXISTS "cpf_consent_at" timestamp,
  ADD COLUMN IF NOT EXISTS "guest_access_token_hash" varchar(64),
  ADD COLUMN IF NOT EXISTS "guest_access_token_expires_at" timestamp,
  ADD COLUMN IF NOT EXISTS "guest_access_token_consumed_at" timestamp;

CREATE INDEX IF NOT EXISTS "guide_purchases_guest_access_token_hash_idx"
  ON "guide_purchases" ("guest_access_token_hash");

CREATE INDEX IF NOT EXISTS "guide_subscriptions_guest_access_token_hash_idx"
  ON "guide_subscriptions" ("guest_access_token_hash");
