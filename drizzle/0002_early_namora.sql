CREATE TABLE "favorite_luthiers" (
	"user_id" uuid NOT NULL,
	"luthier_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_luthiers_user_id_luthier_id_pk" PRIMARY KEY("user_id","luthier_id")
);
--> statement-breakpoint
CREATE TABLE "favorite_strings" (
	"user_id" uuid NOT NULL,
	"string_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_strings_user_id_string_id_pk" PRIMARY KEY("user_id","string_id")
);
--> statement-breakpoint
CREATE TABLE "luthier_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"luthier_id" uuid NOT NULL,
	"user_id" uuid,
	"action_type" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "luthier_portfolio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"luthier_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"title" varchar(255),
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "luthier_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"luthier_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "luthier_reviews_luthier_id_user_id_unique" UNIQUE("luthier_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(30) DEFAULT 'system_alert' NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"related_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "string_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"string_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "string_reviews_string_id_user_id_unique" UNIQUE("string_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"gateway_provider" varchar(30) DEFAULT 'mercadopago' NOT NULL,
	"gateway_subscription_id" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"current_period_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_gateway_subscription_id_unique" UNIQUE("gateway_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "business_directory" DROP CONSTRAINT "business_directory_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "strings_catalog" ADD COLUMN "affiliate_links" jsonb;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "plan_type" varchar(20) DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "favorite_luthiers" ADD CONSTRAINT "favorite_luthiers_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_luthiers" ADD CONSTRAINT "favorite_luthiers_luthier_id_user_profiles_id_fk" FOREIGN KEY ("luthier_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_strings" ADD CONSTRAINT "favorite_strings_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_strings" ADD CONSTRAINT "favorite_strings_string_id_strings_catalog_id_fk" FOREIGN KEY ("string_id") REFERENCES "public"."strings_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "luthier_leads" ADD CONSTRAINT "luthier_leads_luthier_id_user_profiles_id_fk" FOREIGN KEY ("luthier_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "luthier_leads" ADD CONSTRAINT "luthier_leads_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "luthier_portfolio" ADD CONSTRAINT "luthier_portfolio_luthier_id_user_profiles_id_fk" FOREIGN KEY ("luthier_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "luthier_reviews" ADD CONSTRAINT "luthier_reviews_luthier_id_user_profiles_id_fk" FOREIGN KEY ("luthier_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "luthier_reviews" ADD CONSTRAINT "luthier_reviews_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_reviews" ADD CONSTRAINT "string_reviews_string_id_strings_catalog_id_fk" FOREIGN KEY ("string_id") REFERENCES "public"."strings_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_reviews" ADD CONSTRAINT "string_reviews_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_directory" ADD CONSTRAINT "business_directory_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;