CREATE TABLE IF NOT EXISTS "partner_referral_leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "program_id" uuid NOT NULL,
  "contact_name" varchar(180) NOT NULL,
  "phone" varchar(30) NOT NULL,
  "consent_confirmed" boolean NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'new',
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "partner_referral_leads_program_id_partner_programs_id_fk"
    FOREIGN KEY ("program_id") REFERENCES "partner_programs"("id") ON DELETE CASCADE
);
