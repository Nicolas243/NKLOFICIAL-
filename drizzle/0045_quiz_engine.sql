DO $$ BEGIN
  CREATE TYPE "business_tech_level" AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "business_risk_level" AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "business_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "min_capital" numeric(12, 2) DEFAULT '0' NOT NULL,
  "min_time_hours" integer DEFAULT 0 NOT NULL,
  "tech_level" "business_tech_level" NOT NULL,
  "risk_level" "business_risk_level" NOT NULL,
  CONSTRAINT "business_profiles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quiz_leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "answers_jsonb" jsonb NOT NULL,
  "calculated_profile" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_leads_email_idx" ON "quiz_leads" USING btree ("email");
--> statement-breakpoint
INSERT INTO "business_profiles" ("name", "min_capital", "min_time_hours", "tech_level", "risk_level")
VALUES
  ('Avaliação de IA e dados', '0', 4, 'medium', 'low'),
  ('Testes de usabilidade', '0', 3, 'low', 'low'),
  ('Produção de conteúdo UGC', '100', 8, 'medium', 'medium'),
  ('Afiliados e aquisição de tráfego', '300', 10, 'high', 'high'),
  ('Serviços digitais especializados', '0', 12, 'high', 'medium'),
  ('Comunidade e produtos digitais', '100', 15, 'medium', 'high')
ON CONFLICT ("name") DO NOTHING;
