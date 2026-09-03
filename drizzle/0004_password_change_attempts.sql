CREATE TABLE IF NOT EXISTS "password_change_attempts" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp DEFAULT now() NOT NULL,
	"last_success_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "password_change_attempts" ADD CONSTRAINT "password_change_attempts_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;