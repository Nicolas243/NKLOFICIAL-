CREATE TABLE "business_directory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"plan_type" text DEFAULT 'free' NOT NULL,
	"whatsapp" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"location" text,
	"image_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_feed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"tags" varchar(255),
	"image_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strings_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"projection" text NOT NULL,
	"sound_color" text NOT NULL,
	"core_material" text NOT NULL,
	"price_min" numeric,
	"price_max" numeric,
	"real_price" numeric,
	"response_speed" text,
	"environment" text,
	"quality_level" text NOT NULL,
	"community_score" numeric DEFAULT '0.0',
	"durability" text,
	"climate_sensitivity" text,
	"coating" text,
	"fixation" text,
	"arc_tolerance" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "strings_catalog_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "business_directory" ADD CONSTRAINT "business_directory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_events" ADD CONSTRAINT "news_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;