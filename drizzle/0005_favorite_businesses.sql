ALTER TABLE "business_directory" ADD COLUMN "image_url" text;
--> statement-breakpoint
ALTER TABLE "business_directory" ADD COLUMN "instrument_types" text;
--> statement-breakpoint
ALTER TABLE "business_directory" ADD COLUMN "repair_types" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "favorite_businesses" (
	"user_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_businesses_user_id_business_id_pk" PRIMARY KEY("user_id","business_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorite_businesses" ADD CONSTRAINT "favorite_businesses_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorite_businesses" ADD CONSTRAINT "favorite_businesses_business_id_business_directory_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business_directory"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;