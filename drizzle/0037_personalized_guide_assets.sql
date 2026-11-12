ALTER TABLE "guide_purchases"
  ADD COLUMN IF NOT EXISTS "user_id" uuid REFERENCES "user_profiles"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "cpf" text,
  ADD COLUMN IF NOT EXISTS "cpf_consent_confirmed" boolean NOT NULL DEFAULT false;

ALTER TABLE "guide_subscriptions"
  ADD COLUMN IF NOT EXISTS "user_id" uuid REFERENCES "user_profiles"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "cpf" text,
  ADD COLUMN IF NOT EXISTS "cpf_consent_confirmed" boolean NOT NULL DEFAULT false;
