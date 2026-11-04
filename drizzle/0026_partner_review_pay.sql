ALTER TABLE "partner_program_reviews"
  ADD COLUMN IF NOT EXISTS "pay_amount" numeric(10, 2),
  ADD COLUMN IF NOT EXISTS "pay_currency" varchar(3),
  ADD COLUMN IF NOT EXISTS "pay_period" varchar(20);
