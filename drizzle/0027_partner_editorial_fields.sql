ALTER TABLE "partner_programs"
  ADD COLUMN IF NOT EXISTS "pros" jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "cons" jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "requirements" jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "payment_methods" jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "earning_potential" text,
  ADD COLUMN IF NOT EXISTS "last_verified_at" timestamp;
