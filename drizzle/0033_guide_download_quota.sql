ALTER TABLE "guide_purchases"
  ALTER COLUMN "max_downloads" SET DEFAULT 8;

ALTER TABLE "guide_subscriptions"
  ALTER COLUMN "max_downloads" SET DEFAULT 8;

UPDATE "guide_purchases"
SET "max_downloads" = 8
WHERE "max_downloads" = 3;

UPDATE "guide_subscriptions"
SET "max_downloads" = 8
WHERE "max_downloads" = 3;
