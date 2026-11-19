INSERT INTO "partner_programs" (
  "slug", "name", "short_description", "long_description", "category",
  "difficulty", "tags", "website_url", "affiliate_url", "editorial_rating",
  "editorial_source", "status"
)
VALUES
(
  'dscout',
  'Dscout',
  'Participe de estudos de produto, vídeos e entrevistas remuneradas.',
  'A Dscout conecta participantes a estudos de pesquisa de experiência. Dependendo do projeto, você pode registrar vídeos, responder missões ao longo de alguns dias ou participar de entrevistas ao vivo. O convite, o idioma, a disponibilidade e o pagamento aparecem por estudo; não trate o cadastro como garantia de tarefas.',
  'Pesquisas remuneradas',
  'fácil',
  '["pesquisas", "vídeo", "entrevistas", "celular", "dólar"]'::jsonb,
  'https://www.dscout.com/participate-in-research-studies',
  'https://www.dscout.com/participate-in-research-studies',
  8,
  'Descrição editorial baseada na página pública da Dscout; estudos, elegibilidade e pagamentos variam.',
  'published'
),
(
  'repocket',
  'Repocket',
  'Compartilhe parte da sua conexão e acompanhe uma renda passiva variável.',
  'A Repocket segue o modelo de compartilhamento de banda, parecido com o Honeygain. A remuneração depende do tráfego disponível, do país, do dispositivo e das regras atuais. O próprio site pode apresentar instabilidades; use apenas equipamentos e conexões que você controla, confira consumo de dados e não instale versões fora dos canais oficiais.',
  'Renda passiva',
  'fácil',
  '["renda passiva", "celular", "internet", "sem investimento"]'::jsonb,
  'https://repocket.co/',
  'https://repocket.co/',
  6,
  'Descrição editorial baseada na proposta pública e no relato do curador; disponibilidade e estabilidade precisam ser confirmadas antes do uso.',
  'published'
),
(
  'nyte-x',
  'Nyte-X',
  'Grave vídeos de tarefas do dia a dia usando uma câmera presa à cabeça.',
  'A Nyte-X apresenta projetos de coleta de vídeo em primeira pessoa para dados e treinamento de IA. A tarefa pode envolver registrar atividades cotidianas seguindo um roteiro e enviar os arquivos conforme as instruções. Confirme equipamento, privacidade de terceiros, região elegível, prazo e pagamento antes de gravar.',
  'Vídeo e coleta de dados',
  'médio',
  '["vídeo", "IA", "celular", "coleta de dados", "dólar"]'::jsonb,
  'https://www.nyte-x.com/',
  'https://www.nyte-x.com/r/NICDSZ3',
  7,
  'Descrição editorial baseada no referral informado pelo curador; projeto, equipamento e remuneração podem mudar.',
  'published'
),
(
  'micro1',
  'Micro1',
  'Encontre projetos de treinamento de IA, programação, idiomas e especialidades.',
  'A Micro1 reúne projetos para especialistas, profissionais de tecnologia, idiomas, áudio, ciência, direito, saúde e outras áreas. A seleção, o valor, o país, o número de vagas e a continuidade variam por projeto. O Portal NKL exibe uma lista pública de oportunidades da Micro1 separada por especialidade, com tradução editorial e link de referral.',
  'Inteligência artificial',
  'médio',
  '["+300 opções", "IA", "freelance", "trabalho remoto", "dólar", "especialistas"]'::jsonb,
  'https://refer.micro1.ai/opportunities',
  'https://refer.micro1.ai/referral/jobs?referralCode=1ec6a2a7-5769-47a2-bbc8-5f9db5198d04&utm_source=referral&utm_medium=share&utm_campaign=job_referral',
  8,
  'Descrição editorial baseada na página pública de oportunidades e no referral informado pelo curador.',
  'published'
),
(
  'mindrift',
  'Mindrift',
  'Ajude a treinar IA com tarefas de texto, avaliação e conhecimento especializado.',
  'A Mindrift apresenta projetos de treinamento de inteligência artificial e microtarefas para diferentes perfis. O aplicativo e os briefings podem estar principalmente em inglês. Leia cada projeto, confirme os requisitos e considere que aprovação, volume de tarefas e pagamento variam conforme país e especialidade.',
  'Inteligência artificial',
  'médio',
  '["IA", "microtarefas", "escrita", "inglês", "trabalho remoto"]'::jsonb,
  'https://mindrift.toloka.ai/',
  'https://mindrift.toloka.ai/',
  7,
  'Descrição editorial baseada na página pública da Mindrift; projetos e elegibilidade podem variar.',
  'published'
),
(
  'bilibili',
  'Bilibili',
  'Explore uma alternativa chinesa ao YouTube para publicar e descobrir conteúdo.',
  'A Bilibili é uma plataforma de vídeo e comunidade muito forte na China. Ela pode servir como referência para estudar formatos, tendências e criação de conteúdo, mas monetização, idioma, elegibilidade e regras de direitos autorais são diferentes do YouTube. Use como canal de pesquisa e criação somente depois de confirmar as condições atuais.',
  'Conteúdo e vídeo',
  'médio',
  '["vídeo", "conteúdo", "China", "criadores", "estratégias de conteúdo"]'::jsonb,
  'https://www.bilibili.com/',
  'https://www.bilibili.com/',
  6,
  'Sugestão editorial do curador; monetização e acesso dependem das regras vigentes da plataforma.',
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

UPDATE "partner_programs"
SET
  "short_description" = 'Participe de estudos remunerados para treinar IA e responder pesquisas de mercado.',
  "long_description" = 'A Prolific conecta participantes a estudos acadêmicos e pesquisas de mercado. Você completa um perfil, entra na lista de espera quando necessário e recebe convites compatíveis com suas respostas. A disponibilidade depende do país, da demanda e do perfil; não existe garantia de tarefas diárias. Confira as condições antes de participar e trate a remuneração como variável.',
  "tags" = '["pesquisas", "IA", "estudos", "inglês", "trabalho remoto"]'::jsonb,
  "website_url" = 'https://app.prolific.com/register/participant/join-waitlist/profile',
  "affiliate_url" = 'https://app.prolific.com/register/participant/join-waitlist/profile',
  "editorial_source" = 'Descrição editorial revisada com base na página pública e na experiência relatada pelo curador.',
  "updated_at" = now()
WHERE "slug" = 'prolific';
