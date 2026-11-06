UPDATE partner_programs
SET
  pros = CASE
    WHEN pros @> '["Dica: ao responder formulários de novos projetos, informe quando você foi indicado por uma referência experiente, se isso for verdadeiro e puder ser comprovado."]'::jsonb THEN pros
    ELSE pros || '["Dica: ao responder formulários de novos projetos, informe quando você foi indicado por uma referência experiente, se isso for verdadeiro e puder ser comprovado."]'::jsonb
  END,
  updated_at = NOW()
WHERE slug = 'utest';
