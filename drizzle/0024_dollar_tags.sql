UPDATE "partner_programs"
SET
  "tags" = CASE
    WHEN "tags" ? 'dólar' THEN "tags"
    ELSE "tags" || '["dólar"]'::jsonb
  END,
  "updated_at" = now()
WHERE "slug" IN ('outlier-ai', 'utest', 'dataannotation');
