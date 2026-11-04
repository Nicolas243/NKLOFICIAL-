UPDATE "partner_programs"
SET
  "website_url" = 'https://associados.amazon.com.br/',
  "affiliate_url" = 'https://associados.amazon.com.br/',
  "updated_at" = now()
WHERE "slug" = 'amazon-influencer';
