UPDATE "partner_programs"
SET
  "requirements" = '[
    "iPhone 12 ao 18 (Mini, Plus, Pro e Pro Max). Incompatível com modelos 16e, 17e e 18e.",
    "Google Pixel 6 ao 10 (incluindo modelos Pro).",
    "Samsung Galaxy S21 ao S26 (incluindo modelos Plus e Ultra)."
  ]'::jsonb,
  "updated_at" = NOW()
WHERE "slug" IN ('apphub', 'dataannotation');
