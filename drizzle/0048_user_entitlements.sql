DO $$ BEGIN
  CREATE TYPE "entitlement_status" AS ENUM ('active', 'revoked', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_entitlements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
  "product_slug" varchar(80) NOT NULL,
  "status" "entitlement_status" DEFAULT 'active' NOT NULL,
  "order_reference" varchar(255) NOT NULL,
  "granted_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_entitlements_user_product_unique'
  ) THEN
    ALTER TABLE "user_entitlements"
      ADD CONSTRAINT "user_entitlements_user_product_unique" UNIQUE ("user_id", "product_slug");
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_entitlements_user_id_idx"
  ON "user_entitlements" USING btree ("user_id");
--> statement-breakpoint
ALTER TABLE "user_entitlements" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "user_entitlements_select_own"
    ON "user_entitlements"
    FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = "user_id");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
