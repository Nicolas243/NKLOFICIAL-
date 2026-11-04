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
SELECT
  'tiktok-shop',
  'TikTok Shop',
  'Crie conteúdo e recomende produtos no TikTok Shop conforme as campanhas e regras disponíveis na sua região.',
  'O TikTok Shop permite que criadores apresentem produtos e recebam comissão quando uma venda elegível acontece pelas ferramentas da plataforma. A disponibilidade, a aprovação, as categorias, as taxas e os requisitos dependem da região e podem mudar. Leia as regras oficiais antes de publicar, sinalize conteúdo comercial e não prometa resultado ou remuneração fixa.',
  'Conteúdo e vídeo',
  'médio',
  '["TikTok", "afiliados", "vídeos curtos", "vendas", "renda extra pelo celular"]'::jsonb,
  'https://www.tiktok.com/shop',
  'https://www.tiktok.com/d/1/ZS9y3kC6kW7Tx-TCI1K/',
  8,
  'Descrição editorial baseada na proposta pública do TikTok Shop; elegibilidade, campanhas e comissões variam por região e período.',
  'published'
WHERE NOT EXISTS (
  SELECT 1 FROM "partner_programs" WHERE "slug" = 'tiktok-shop'
);
