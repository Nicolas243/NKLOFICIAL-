UPDATE "partner_programs"
SET
  "category" = 'Testes e avaliação de IA',
  "tags" = '["testes", "avaliação de IA", "tarefas digitais", "QA", "renda extra sem investimento"]'::jsonb,
  "short_description" = 'Participe de tarefas de avaliação e treinamento de IA, no estilo de plataformas de testes e projetos sob demanda.',
  "long_description" = 'A Aligner reúne tarefas de avaliação, comparação e treinamento de sistemas de inteligência artificial, em uma proposta mais próxima de uTest e Testlio do que de um marketplace de serviços. Você pode analisar respostas, seguir critérios, apontar problemas e ajudar a melhorar modelos em projetos específicos. O cadastro pode exigir seleção ou avaliações, e a quantidade de tarefas depende do perfil, país, idioma e campanhas abertas. Confira o escopo, o tempo estimado e as regras de pagamento antes de começar; entrar na plataforma não garante volume fixo de trabalho.',
  "updated_at" = now()
WHERE "slug" = 'aligner';
