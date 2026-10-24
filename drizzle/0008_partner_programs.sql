CREATE TABLE IF NOT EXISTS "partner_programs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(120) NOT NULL UNIQUE,
  "name" varchar(180) NOT NULL,
  "short_description" text NOT NULL,
  "long_description" text NOT NULL,
  "category" varchar(80) NOT NULL,
  "difficulty" varchar(20) NOT NULL,
  "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "website_url" text NOT NULL,
  "affiliate_url" text,
  "editorial_rating" integer NOT NULL,
  "editorial_source" text NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'published',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partner_program_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "program_id" uuid NOT NULL REFERENCES "partner_programs"("id") ON DELETE cascade,
  "reviewer_key_hash" varchar(64) NOT NULL,
  "rating" integer NOT NULL,
  "reason" text NOT NULL,
  "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "status" varchar(20) NOT NULL DEFAULT 'published',
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "partner_program_reviews_program_reviewer_unique" UNIQUE("program_id", "reviewer_key_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partner_suggestions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(180) NOT NULL,
  "website_url" text,
  "reason" text NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "partner_programs"
("slug", "name", "short_description", "long_description", "category", "difficulty", "tags", "website_url", "affiliate_url", "editorial_rating", "editorial_source")
VALUES
('outlier-ai', 'Outlier AI', 'Avalie e refine modelos de inteligência artificial em projetos internacionais.', 'A Outlier conecta especialistas a tarefas de treinamento de IA. A disponibilidade de projetos, os critérios de seleção e o valor por hora variam por país, idioma e especialidade.', 'Inteligência artificial', 'médio', '["IA", "freelance", "dólar", "remoto"]', 'https://outlier.ai/', 'https://outlier.ai/', 8, 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.'),
('utest', 'uTest', 'Teste softwares, aplicativos e jogos em projetos globais de QA.', 'A uTest oferece projetos de testes funcionais, usabilidade e dispositivos. Leia o escopo de cada ciclo e responda aos formulários com atenção; a aceitação depende do perfil e do projeto.', 'Testes e QA', 'médio', '["QA", "testes", "freelance", "dólar"]', 'https://www.utest.com/', 'https://www.utest.com/', 8, 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.'),
('dataannotation', 'DataAnnotation', 'Trabalhe na avaliação e produção de dados para sistemas de IA.', 'A plataforma apresenta tarefas de avaliação, escrita e raciocínio para treinar modelos. A disponibilidade varia e exige aprovação no processo de entrada.', 'Inteligência artificial', 'difícil', '["IA", "escrita", "remoto", "dólar"]', 'https://www.dataannotation.tech/', 'https://app.dataannotation.tech/worker_signup?referral_code=MJ_OE3I', 8, 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.'),
('oneforma', 'OneForma', 'Encontre projetos de dados, voz, tradução e anotação para IA.', 'A OneForma reúne projetos linguísticos e de dados para diferentes países. O volume de trabalho, os requisitos e os pagamentos variam conforme o projeto.', 'Dados e idiomas', 'médio', '["anotação", "tradução", "IA", "remoto"]', 'https://www.oneforma.com/', 'https://www.oneforma.com/', 7, 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.'),
('clickworker', 'Clickworker', 'Realize microtarefas e projetos de dados pela internet.', 'A Clickworker oferece tarefas de pesquisa, classificação e dados. Use o link de indicação quando disponível e confira as regras de cada tarefa antes de começar.', 'Microtarefas', 'fácil', '["microtarefas", "IA", "remoto", "flexível"]', 'https://www.clickworker.com/', 'https://clickworker.app/vcP2nF', 7, 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.'),
('billo', 'Billo', 'Crie vídeos de conteúdo gerado por usuários para marcas.', 'A Billo aproxima criadores de marcas que precisam de vídeos para anúncios e páginas de produto. Verifique os requisitos de cada campanha, prazos e remuneração antes de aceitar.', 'Conteúdo e vídeo', 'médio', '["vídeo", "UGC", "freelance", "marcas"]', 'https://billo.app/', 'https://billo.app/', 7, 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.'),
('joinbrands', 'JoinBrands', 'Encontre campanhas de conteúdo para marcas e produtos.', 'A JoinBrands permite que criadores encontrem oportunidades de UGC. As campanhas têm briefing próprio, portanto avalie o esforço necessário e os direitos de uso do material.', 'Conteúdo e vídeo', 'médio', '["vídeo", "UGC", "marcas", "freelance"]', 'https://joinbrands.com/', 'https://joinbrands.com/', 7, 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.'),
('aligner', 'Aligner', 'Participe de trabalhos de avaliação e treinamento de IA.', 'A Aligner disponibiliza oportunidades específicas por especialidade. Algumas vagas podem exigir experiência avançada, como engenharia de software sênior; só use o referral quando ele estiver disponível para o trabalho correto.', 'Inteligência artificial', 'difícil', '["IA", "engenharia", "freelance", "remoto"]', 'https://alignerr.com/', NULL, 7, 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.'),
('amazon-influencer', 'Amazon Influencer', 'Divulgue produtos e publique vídeos para gerar comissões.', 'O programa permite criar conteúdo sobre produtos e, conforme elegibilidade e regras da Amazon, receber comissões por compras qualificadas. A aprovação e os formatos disponíveis podem variar por país.', 'Afiliados', 'médio', '["afiliados", "vídeo", "e-commerce", "conteúdo"]', 'https://www.amazon.com/shop/creators', NULL, 8, 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.'),
('marketplaces-afiliados', 'Afiliados de marketplaces', 'Divulgue produtos em grupos e redes sociais usando programas de afiliados.', 'Você pode pesquisar programas de afiliados de Shopee, Mercado Livre, Shein e AliExpress para compartilhar ofertas em grupos, vídeos e redes sociais. Cada marketplace possui regras, comissões e critérios próprios.', 'Afiliados', 'fácil', '["afiliados", "e-commerce", "grupos", "redes sociais"]', 'https://affiliate.shopee.com.br/', 'https://s.shopee.com.br/6VOofTDp0J', 8, 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.'),
('upwork', 'Upwork', 'Preste serviços profissionais para clientes do mundo inteiro.', 'A Upwork reúne projetos de tecnologia, design, tradução, marketing e muitas outras áreas. Monte um perfil específico, apresente portfólio e considere taxas e concorrência antes de enviar propostas.', 'Freelance', 'difícil', '["freelance", "tecnologia", "remoto", "internacional"]', 'https://www.upwork.com/', 'https://www.upwork.com/', 8, 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.'),
('testlio', 'Testlio', 'Participe de testes de produtos digitais para empresas globais.', 'A Testlio trabalha com testes de aplicativos, sites e experiências digitais. Os convites dependem do perfil, localização, dispositivos e disponibilidade de projetos.', 'Testes e QA', 'médio', '["QA", "testes", "aplicativos", "freelance"]', 'https://testlio.com/', 'https://testlio.com/', 8, 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.'),
('hotmart', 'Hotmart Afiliados', 'Promova produtos digitais como afiliado.', 'Na Hotmart, você pode escolher produtos digitais disponíveis no mercado de afiliados e divulgá-los conforme as regras da plataforma e do produtor. Analise comissão, reembolso e qualidade antes de promover.', 'Afiliados', 'fácil', '["afiliados", "produtos digitais", "marketing", "comissão"]', 'https://hotmart.com/pt-br/afiliados', 'https://hotmart.com/pt-br/afiliados', 7, 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.'),
('sideshift', 'SideShift', 'Conheça uma opção de troca de ativos digitais.', 'A SideShift é uma plataforma de troca de ativos digitais. Antes de usar, verifique disponibilidade regional, taxas, riscos e requisitos legais aplicáveis ao seu caso.', 'Finanças digitais', 'difícil', '["cripto", "finanças", "digital", "internacional"]', 'https://sideshift.ai/', NULL, 6, 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.'),
('crowdato', 'Crowdato', 'Explore oportunidades de dados e tarefas digitais.', 'O Crowdato é apresentado como uma opção para tarefas relacionadas a dados. Confirme a disponibilidade, os requisitos e as condições atuais diretamente no site antes de se cadastrar.', 'Dados e microtarefas', 'médio', '["dados", "microtarefas", "remoto"]', 'https://crowdato.com/', NULL, 5, 'Nota editorial inicial do Portal NKL, pendente de confirmação editorial.'),
('hub', 'Hub', 'Descubra oportunidades digitais reunidas em uma plataforma.', 'Esta oportunidade será detalhada conforme o Portal NKL confirmar o serviço, seus requisitos e o modelo de remuneração. Não envie documentos ou pagamentos antes de validar a plataforma.', 'Oportunidades digitais', 'médio', '["remoto", "oportunidades", "digital"]', 'https://hub.com/', NULL, 5, 'Nota editorial inicial do Portal NKL, pendente de confirmação editorial.'),
('claru-ia', 'Claru IA', 'Conheça oportunidades relacionadas a inteligência artificial.', 'Esta oportunidade será detalhada conforme o Portal NKL confirmar o serviço, seus requisitos e o modelo de remuneração. Não envie documentos ou pagamentos antes de validar a plataforma.', 'Inteligência artificial', 'médio', '["IA", "remoto", "dados"]', 'https://claru.ai/', NULL, 5, 'Nota editorial inicial do Portal NKL, pendente de confirmação editorial.'),
('flambra', 'Flambra', 'Explore possibilidades de trabalho e renda online.', 'Esta oportunidade será detalhada conforme o Portal NKL confirmar o serviço, seus requisitos e o modelo de remuneração. Não envie documentos ou pagamentos antes de validar a plataforma.', 'Oportunidades digitais', 'médio', '["remoto", "freelance", "digital"]', 'https://flambra.com/', NULL, 5, 'Nota editorial inicial do Portal NKL, pendente de confirmação editorial.'),
('fiverr', 'Fiverr', 'Ofereça serviços digitais para clientes internacionais.', 'Crie ofertas claras para serviços como design, edição, tradução, programação ou voz. A plataforma é competitiva e cobra taxas, por isso comece com um escopo que consiga entregar com qualidade.', 'Freelance', 'médio', '["freelance", "serviços", "remoto", "internacional"]', 'https://www.fiverr.com/', NULL, 8, 'Nota editorial inicial do Portal NKL, baseada em reputação pública geral.')
ON CONFLICT ("slug") DO NOTHING;
