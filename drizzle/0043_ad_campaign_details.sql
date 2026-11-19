ALTER TABLE "ad_campaigns"
  ADD COLUMN IF NOT EXISTS "responsible_name" varchar(180),
  ADD COLUMN IF NOT EXISTS "whatsapp" varchar(30),
  ADD COLUMN IF NOT EXISTS "business_category" varchar(80),
  ADD COLUMN IF NOT EXISTS "offer_description" varchar(500),
  ADD COLUMN IF NOT EXISTS "campaign_objective" varchar(80),
  ADD COLUMN IF NOT EXISTS "target_audience" varchar(300),
  ADD COLUMN IF NOT EXISTS "social_url" text;
