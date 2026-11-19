INSERT INTO "partner_programs" (
  "slug",
  "name",
  "short_description",
  "long_description",
  "category",
  "difficulty",
  "tags",
  "website_url",
  "affiliate_url",
  "editorial_rating",
  "editorial_source",
  "status"
)
VALUES (
  'prolific',
  'Prolific',
  'Participe de estudos remunerados para treinar IA e responder pesquisas.',
  'A Prolific conecta participantes a estudos acadêmicos e pesquisas de mercado. Você completa um perfil, entra na lista de espera quando necessário e recebe convites compatíveis com suas respostas. A disponibilidade depende do país, da demanda e do perfil; não existe garantia de tarefas diárias. Confira as condições antes de participar e trate a remuneração como variável.',
  'Pesquisas remuneradas',
  'fácil',
  '["pesquisas", "IA", "estudos", "inglês", "trabalho remoto"]'::jsonb,
  'https://app.prolific.com/register/participant/join-waitlist/profile',
  'https://app.prolific.com/register/participant/join-waitlist/profile',
  8,
  'Descrição editorial revisada com base na página pública e na experiência relatada pelo curador.',
  'published'
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "short_description" = EXCLUDED."short_description",
  "long_description" = EXCLUDED."long_description",
  "category" = EXCLUDED."category",
  "difficulty" = EXCLUDED."difficulty",
  "tags" = EXCLUDED."tags",
  "website_url" = EXCLUDED."website_url",
  "affiliate_url" = EXCLUDED."affiliate_url",
  "editorial_rating" = EXCLUDED."editorial_rating",
  "editorial_source" = EXCLUDED."editorial_source",
  "status" = EXCLUDED."status",
  "updated_at" = now();
