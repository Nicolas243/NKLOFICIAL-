ALTER TABLE "news_feed" ADD COLUMN "author" varchar(255) DEFAULT 'Admin-flame';
--> statement-breakpoint
ALTER TABLE "news_suggestions" ADD COLUMN "image_url" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "news_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"news_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"author_name" varchar(255) NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "news_likes" (
	"news_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "news_likes_news_id_user_id_pk" PRIMARY KEY("news_id","user_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "news_comments" ADD CONSTRAINT "news_comments_news_id_news_feed_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news_feed"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "news_comments" ADD CONSTRAINT "news_comments_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "news_likes" ADD CONSTRAINT "news_likes_news_id_news_feed_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news_feed"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "news_likes" ADD CONSTRAINT "news_likes_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;