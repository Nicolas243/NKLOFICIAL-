CREATE TABLE IF NOT EXISTS "favorite_professors" (
	"user_id" uuid NOT NULL,
	"professor_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_professors_user_id_professor_id_pk" PRIMARY KEY("user_id","professor_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorite_professors" ADD CONSTRAINT "favorite_professors_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorite_professors" ADD CONSTRAINT "favorite_professors_professor_id_user_profiles_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;