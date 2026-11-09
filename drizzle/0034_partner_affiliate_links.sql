UPDATE "partner_programs"
SET "affiliate_url" = 'https://go.montink.com/c1n80h',
    "updated_at" = now()
WHERE "slug" = 'montink-embaixador';
--> statement-breakpoint
UPDATE "partner_programs"
SET "affiliate_url" = 'https://discoverpawns.eu/20876897',
    "updated_at" = now()
WHERE "slug" = 'pawns-app';
--> statement-breakpoint
UPDATE "partner_programs"
SET "affiliate_url" = 'https://www.fiverr.com/pe/gvv64y9',
    "updated_at" = now()
WHERE "slug" = 'fiverr';
--> statement-breakpoint
UPDATE "partner_programs"
SET "affiliate_url" = 'https://attapoll.app/join/uilux',
    "updated_at" = now()
WHERE "slug" = 'attapoll';
--> statement-breakpoint
UPDATE "partner_programs"
SET "affiliate_url" = 'https://www.tubebuddy.com/pricing?a=NICOLASSANTOSNKL',
    "updated_at" = now()
WHERE "slug" = 'afiliados-b2b-tubebuddy-make';
--> statement-breakpoint
UPDATE "partner_programs"
SET "long_description" = CASE
  WHEN "long_description" LIKE '%MHT3TVKF%' THEN "long_description"
  ELSE "long_description" || ' Código informado para tarefas residenciais do Minute: MHT3TVKF. Use-o apenas no campo oficial da plataforma e confirme as condições vigentes antes de começar.'
END,
    "updated_at" = now()
WHERE "slug" = 'flambra';
