INSERT INTO "partner_programs" (
  "slug", "name", "short_description", "long_description", "category",
  "difficulty", "tags", "website_url", "affiliate_url", "editorial_rating",
  "editorial_source", "status"
)
VALUES (
  'fluencify',
  'Fluencify',
  'Crie vídeos para marcas e encontre contratos de conteúdo com mais facilidade, conforme seu perfil.',
  'A Fluencify conecta criadores a marcas que precisam de conteúdo UGC. Você pode apresentar seu estilo, receber briefings e se candidatar a trabalhos de vídeo sem depender apenas de uma audiência enorme. Pela experiência relatada no catálogo, pode ser mais fácil encontrar contratos do que em algumas plataformas parecidas, mas isso depende do perfil, região e campanhas disponíveis. Confira o briefing, o uso de imagem, o prazo e o pagamento antes de aceitar.',
  'Conteúdo e vídeo',
  'médio',
  '["gravar vídeos em casa", "UGC", "criadores", "vender serviços", "ganhar pela internet"]'::jsonb,
  'https://app.fluencify.io/',
  'https://app.fluencify.io/r/NBGXP6',
  8,
  'Descrição editorial baseada na proposta pública da plataforma e na experiência informada pelo curador; disponibilidade e contratos variam.',
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
  "updated_at" = now();

UPDATE "partner_programs"
SET
  "affiliate_url" = 'https://app.sideshift.app/r/NICOLASSANTOS9VPYMJ',
  "updated_at" = now()
WHERE "slug" = 'sideshift';

UPDATE "partner_programs"
SET "long_description" = 'Programas de afiliados de marketplaces permitem recomendar produtos por links rastreáveis e receber comissão quando uma compra qualificada acontece. O caminho mais sustentável é escolher um tema, comparar produtos com honestidade, criar conteúdo útil e acompanhar cliques, conversões e cancelamentos. As taxas variam conforme loja, categoria, campanha e prazo de atribuição; algumas compras não geram comissão. Evite copiar descrições ou fazer spam em grupos. O resultado depende da confiança do público, da qualidade da recomendação e da constância da divulgação.'
WHERE "slug" = 'marketplaces-afiliados';
