CREATE TABLE IF NOT EXISTS "saved_partner_programs" (
  "user_id" uuid NOT NULL,
  "program_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "saved_partner_programs_user_id_program_id_pk" PRIMARY KEY("user_id","program_id"),
  CONSTRAINT "saved_partner_programs_user_id_user_profiles_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE,
  CONSTRAINT "saved_partner_programs_program_id_partner_programs_id_fk"
    FOREIGN KEY ("program_id") REFERENCES "public"."partner_programs"("id") ON DELETE CASCADE
);
