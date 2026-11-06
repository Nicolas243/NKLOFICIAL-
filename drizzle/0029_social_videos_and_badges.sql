ALTER TABLE "partner_programs"
  ADD COLUMN IF NOT EXISTS "youtube_video_id" text,
  ADD COLUMN IF NOT EXISTS "tiktok_video_id" text,
  ADD COLUMN IF NOT EXISTS "zero_investment_required" boolean NOT NULL DEFAULT true;
