import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type BookEntry = {
  number: number;
  title: string;
  chapter: number;
  investment: 'Zero investimento' | 'Com investimento inicial';
  payoutModel: string;
  howItWorks: string;
  firstWeekStep: string;
  companionTools: string;
};

const CHAPTERS: ReadonlyArray<{ number: number; title: string; subtitle: string }> = [
  { number: 1, title: 'IA, Avaliação de Respostas e Pesquisas Pagas', subtitle: 'Caminhos com entrada gratuita que remuneram atenção, leitura crítica e feedback humano.' },
  { number: 2, title: 'Testes de Apps, Software (QA) e Entrevistas UX', subtitle: 'Encontre erros em sites, narre experiências reais e receba em dólar por entrega.' },
  { number: 3, title: 'Conteúdo UGC, Vídeo Curto e Economia de Criadores', subtitle: 'Grave demonstrações simples ou edite cortes para marcas sem depender de milhões de seguidores.' },
  { number: 4, title: 'Freelancing, Ensino e Desafios Remunerados', subtitle: 'Transforme conhecimento técnico, didática ou organização em serviços fechados.' },
  { number: 5, title: 'Afiliados, Indicações e Renda Complementar', subtitle: 'Conecte quem já quer resolver um problema com ferramentas e produtos verificados.' },
  { number: 6, title: 'Negócios Escaláveis e Modelos com Investimento Inicial', subtitle: 'Publicação, produtos digitais, Print on Demand, automação B2B e revenda estruturada.' },
];

const ENTRIES: readonly BookEntry[] = [
  { number: 1, title: 'Micro1 — Projetos de Treinamento de IA e Especialistas', chapter: 1, investment: 'Zero investimento', payoutModel: 'US$ por hora/projeto', howItWorks: 'Conecta programadores, linguistas e especialistas a projetos pagos de avaliação e coleta de dados.', firstWeekStep: 'Complete perfil técnico detalhado e realize a triagem objetiva em inglês.', companionTools: 'Wise / Payoneer + Inglês NKL' },
  { number: 2, title: 'Outlier AI — Revisão e Escrita para Modelos de Linguagem', chapter: 1, investment: 'Zero investimento', payoutModel: 'US$ por tarefa/hora', howItWorks: 'Remunera comparação de respostas, correção factual e escrita estruturada em português ou inglês.', firstWeekStep: 'Leia as rubricas com atenção antes de fazer a avaliação classificatória inicial.', companionTools: 'Wise + Guia de Prompting NKL' },
  { number: 3, title: 'DataAnnotation — Avaliação Lógica e Raciocínio de IA', chapter: 1, investment: 'Zero investimento', payoutModel: 'US$ por hora', howItWorks: 'Testes rigorosos de lógica, código e checagem factual para liberar projetos recorrentes.', firstWeekStep: 'Separe 60 minutos calmos para o teste inicial sem pular critérios.', companionTools: 'PayPal / Wise' },
  { number: 4, title: 'Claru IA — Microprojetos de Curadoria e Dados', chapter: 1, investment: 'Zero investimento', payoutModel: 'US$ variável por tarefa', howItWorks: 'Campanhas pontuais de rotulagem, áudio, imagem e validação de respostas.', firstWeekStep: 'Configure conta e ative alertas de campanhas para o Brasil.', companionTools: 'Wise / Payoneer' },
  { number: 5, title: 'Mindrift — Anotação Editorial e Contexto Multilíngue', chapter: 1, investment: 'Zero investimento', payoutModel: 'US$ por hora/tarefa', howItWorks: 'Projetos guiados da Toloka focados em clareza de texto e verificação de respostas.', firstWeekStep: 'Faça testes de português e inglês para ampliar elegibilidade.', companionTools: 'Wise / Payoneer' },
  { number: 6, title: 'Prolific — Estudos Acadêmicos e Pesquisas Universitárias', chapter: 1, investment: 'Zero investimento', payoutModel: 'GBP / US$ por estudo', howItWorks: 'Pesquisadores de universidades pagam participação honesta em estudos comportamentais.', firstWeekStep: 'Preencha 100% do "About You" e aguarde liberação da fila sem bots.', companionTools: 'PayPal / Wise' },
  { number: 7, title: 'Dscout — Diários de Experiência e Vídeos de Produto', chapter: 1, investment: 'Zero investimento', payoutModel: 'US$ 25 a US$ 150 por missão', howItWorks: 'Missões pelo celular avaliando aplicativos, bancos ou hábitos de compra.', firstWeekStep: 'Grave resposta clara de 45s para o screener com boa iluminação.', companionTools: 'Suporte de celular / Ring light' },
  { number: 8, title: 'OneForma — Localização, Transcrição e Avaliações', chapter: 1, investment: 'Zero investimento', payoutModel: 'US$ por projeto', howItWorks: 'Plataforma global com certificações internas para tarefas em português.', firstWeekStep: 'Complete certificações de idioma português para desbloquear projetos.', companionTools: 'Payoneer / PayPal' },
  { number: 9, title: 'Crowtado — Microtarefas e Classificação de Mídia', chapter: 1, investment: 'Zero investimento', payoutModel: 'US$ variável', howItWorks: 'Validações curtas de texto, áudio e contexto visual conforme disponibilidade.', firstWeekStep: 'Revise regras de saque mínimo e países aceitos.', companionTools: 'Wise / PayPal' },
  { number: 10, title: 'SERP Raters (Welocalize / TELUS) — Qualidade de Busca', chapter: 1, investment: 'Zero investimento', payoutModel: 'US$ por hora', howItWorks: 'Avaliação de relevância de resultados de buscadores seguindo guia oficial de qualidade.', firstWeekStep: 'Estude o Quality Guidelines antes da prova de admissão.', companionTools: 'Payoneer + Guia de Inglês NKL' },
  { number: 11, title: 'IA que Paga por Uso e Curadoria (Grass / Toloka)', chapter: 1, investment: 'Zero investimento', payoutModel: 'Pontos / US$ variável', howItWorks: 'Redes abertas de indexação pública e validação leve com navegador dedicado.', firstWeekStep: 'Use apenas em conexão residencial própria e separada de trabalho.', companionTools: 'Perfil de navegador isolado' },
  { number: 12, title: 'uTest — Testes Funcionais de Sites e Aplicativos', chapter: 2, investment: 'Zero investimento', payoutModel: 'US$ por bug + ciclo', howItWorks: 'Reportar falhas reais em apps bancários, streaming e lojas antes do lançamento.', firstWeekStep: 'Conclua a uTest Academy para receber convites iniciais.', companionTools: 'Payoneer + Captura de tela' },
  { number: 13, title: 'Testlio — Ciclos Estruturados de QA Freelance', chapter: 2, investment: 'Zero investimento', payoutModel: 'US$ por hora de teste', howItWorks: 'Rede seletiva que paga por hora fixa quando selecionado para runs em dispositivos específicos.', firstWeekStep: 'Cadastre todos os celulares e computadores disponíveis.', companionTools: 'Wise / Payoneer' },
  { number: 14, title: 'Alligner — Avaliação Técnica e Engenharia Agêntica', chapter: 2, investment: 'Zero investimento', payoutModel: 'US$ por projeto/hora', howItWorks: 'Projetos especializados para código, raciocínio complexo e validação em português.', firstWeekStep: 'Finalize avaliação de área técnica para entrar no banco ativo.', companionTools: 'Wise / Deel' },
  { number: 15, title: 'Testes UX Narrados (UserTesting e similares)', chapter: 2, investment: 'Zero investimento', payoutModel: 'US$ 10 por teste de 15 min', howItWorks: 'Você navega em protótipos falando em voz alta o que entende ou sente dificuldade.', firstWeekStep: 'Faça o teste de microfone sem eco e pratique pensar em voz alta.', companionTools: 'Microfone USB + PayPal' },
  { number: 16, title: 'Entrevistas B2B (Respondent / User Interviews)', chapter: 2, investment: 'Zero investimento', payoutModel: 'US$ 50 a US$ 200 por chamada', howItWorks: 'Empresas entrevistam profissionais reais para validar softwares e produtos.', firstWeekStep: 'Vincule LinkedIn verdadeiro e aplique apenas para sua área real.', companionTools: 'Webcam HD + Microfone + PayPal' },
  { number: 17, title: 'Clickworker — Microtarefas Móveis e Coleta', chapter: 2, investment: 'Zero investimento', payoutModel: 'EUR / US$ por lote', howItWorks: 'Tarefas rápidas de fotos, áudio, busca e UHRS pelo celular ou navegador.', firstWeekStep: 'Verifique endereço e método Payoneer antes do primeiro lote.', companionTools: 'Payoneer' },
  { number: 18, title: 'AttaPoll — Pesquisas Rápidas no Celular', chapter: 2, investment: 'Zero investimento', payoutModel: 'US$ por pesquisa', howItWorks: 'Questionários curtos de opinião com saque baixo e interface simples.', firstWeekStep: 'Responda com consistência para não ser filtrado por contradição.', companionTools: 'PayPal' },
  { number: 19, title: 'Nyte-X — Coleta de Vídeo em Primeira Pessoa', chapter: 2, investment: 'Zero investimento', payoutModel: 'US$ por projeto aprovado', howItWorks: 'Gravação de tarefas cotidianas seguindo roteiro e requisitos técnicos de câmera.', firstWeekStep: 'Leia especificações de ângulo e privacidade antes de gravar.', companionTools: 'Suporte de cabeça / Câmera' },
  { number: 20, title: 'Billo — Vídeos UGC para Marcas Globais', chapter: 3, investment: 'Zero investimento', payoutModel: 'US$ 50+ por vídeo', howItWorks: 'Empresas enviam briefings e pagam por vídeos curtos autênticos de demonstração.', firstWeekStep: 'Grave vídeo de apresentação claro sem filtros excessivos.', companionTools: 'Ring Light + CapCut' },
  { number: 21, title: 'JoinBrands — Criadores de Conteúdo de Produto', chapter: 3, investment: 'Zero investimento', payoutModel: 'US$ por entrega', howItWorks: 'Fotos e vídeos caseiros bem produzidos para lojas de e-commerce.', firstWeekStep: 'Complete verificação inicial com 2 exemplos em luz natural.', companionTools: 'Tripé + CapCut + Payoneer' },
  { number: 22, title: 'UGC Roster — Portfólio para Agências', chapter: 3, investment: 'Zero investimento', payoutModel: 'US$ por campanha', howItWorks: 'Diretório conectado a agências buscando criadores por nicho e idioma.', firstWeekStep: 'Suba 3 vídeos de nichos distintos (casa, tech, rotina).', companionTools: 'Canva + Wise' },
  { number: 23, title: 'Creator Space — Campanhas Sob Demanda', chapter: 3, investment: 'Zero investimento', payoutModel: 'US$ por vídeo aprovado', howItWorks: 'Marketplace de briefings curtos com aprovação direta pelo anunciante.', firstWeekStep: 'Revise prazo de entrega e direitos de uso em cada briefing.', companionTools: 'Canva + Notion' },
  { number: 24, title: 'AppHub — Promoção de Aplicativos por Vídeo', chapter: 3, investment: 'Zero investimento', payoutModel: 'US$ por visualização/campanha', howItWorks: 'Produção de formatos curtos apresentando aplicativos conforme guia criativo.', firstWeekStep: 'Estude os 3 formatos que mais retêm atenção nos 3 primeiros segundos.', companionTools: 'CapCut + Ring Light' },
  { number: 25, title: 'Fluencify — Conteúdo Curto em Português', chapter: 3, investment: 'Zero investimento', payoutModel: 'R$ por campanha', howItWorks: 'Conexão local entre criadores brasileiros e campanhas digitais.', firstWeekStep: 'Envie portfólio enxuto com áudio limpo.', companionTools: 'Microfone de lapela + Pix' },
  { number: 26, title: 'Flambra — Tarefas Criativas e Social', chapter: 3, investment: 'Zero investimento', payoutModel: 'US$ / R$ variável', howItWorks: 'Missões ligadas a criação e engajamento conforme regras de cada campanha.', firstWeekStep: 'Confira prazos de validação antes de iniciar.', companionTools: 'Canva' },
  { number: 27, title: 'Hub — Comunidade de Microcampanhas', chapter: 3, investment: 'Zero investimento', payoutModel: 'US$ variável', howItWorks: 'Pequenos projetos digitais para criadores e avaliadores de produto.', firstWeekStep: 'Cadastre links reais e acompanhe abertura de vagas.', companionTools: 'Notion' },
  { number: 28, title: 'TikTok Shop — Comissões por Demonstração em Vídeo', chapter: 3, investment: 'Zero investimento', payoutModel: 'Comissão % por venda', howItWorks: 'Mostre utilidade real de produtos acessíveis e ganhe comissão automática no carrinho nativo.', firstWeekStep: 'Escolha 3 itens que você realmente usa em casa para começar.', companionTools: 'Ring Light + CapCut' },
  { number: 29, title: 'Bilibili — Pesquisa de Formatos e Canal Asiático', chapter: 3, investment: 'Zero investimento', payoutModel: 'Receita de criador (avançado)', howItWorks: 'Referência de formatos visuais longos e oportunidades para quem domina idiomas.', firstWeekStep: 'Analise retenção de criadores educativos na plataforma.', companionTools: 'Guia Mandarim NKL' },
  { number: 30, title: 'Estratégia Canal Dark YouTube + NotebookLM', chapter: 3, investment: 'Zero investimento', payoutModel: 'AdSense + Afiliados', howItWorks: 'Roteiros profundos transformados em vídeos narrados sem precisar aparecer na câmera.', firstWeekStep: 'Publique 4 vídeos semanais consistentes sobre um único tema útil.', companionTools: 'NotebookLM + ElevenLabs + CapCut' },
  { number: 31, title: 'Edição de Cortes e Vídeos Curtos com IA', chapter: 3, investment: 'Com investimento inicial', payoutModel: 'R$ 400 a R$ 1.800/mês por cliente', howItWorks: 'Recorte palestras e podcasts em 15 a 30 Reels/Shorts mensais com legenda dinâmica.', firstWeekStep: 'Entregue 3 cortes gratuitos de amostra para 5 podcasts ou professores locais.', companionTools: 'OpusClip + CapCut Pro' },
  { number: 32, title: 'Fiverr — Serviços Digitais Empacotados (Gigs)', chapter: 4, investment: 'Zero investimento', payoutModel: 'US$ por pedido', howItWorks: 'Venda entregas claras de preço fechado (planilhas, tradução, revisão, áudio, código).', firstWeekStep: 'Crie 1 gig hiperespecífico com 3 amostras visuais limpas.', companionTools: 'Canva + Payoneer + Notion' },
  { number: 33, title: 'Upwork — Contratos Remotos Recorrentes', chapter: 4, investment: 'Zero investimento', payoutModel: 'US$ por hora/contrato', howItWorks: 'Propostas diretas para empresas internacionais precisando de suporte, QA, dev ou design.', firstWeekStep: 'Escreva propostas curtas focadas no problema da primeira linha.', companionTools: 'Wise + Loom + Guia Inglês NKL' },
  { number: 34, title: 'Aulas Particulares, Mentoria e Consultoria Prática', chapter: 4, investment: 'Zero investimento', payoutModel: 'R$ / hora-aula', howItWorks: 'Ensine violino, idiomas, Excel ou ferramentas digitais em sessões individuais online.', firstWeekStep: 'Defina objetivo claro da primeira aula experimental e organize agenda.', companionTools: 'Daily/Meet + Stripe/Pix' },
  { number: 35, title: 'Estudar e Ganhar (Kaggle, Bounties e Bolsas)', chapter: 4, investment: 'Zero investimento', payoutModel: 'Prêmios US$ por desafio', howItWorks: 'Resolva desafios públicos de dados ou reporte bugs reais em programas oficiais.', firstWeekStep: 'Resolva 2 notebooks públicos no Kaggle para construir histórico.', companionTools: 'GitHub + Estúdio IA NKL' },
  { number: 36, title: 'Amazon Influencer — Vitrine e Reviews em Vídeo', chapter: 5, investment: 'Zero investimento', payoutModel: 'Comissão % Amazon', howItWorks: 'Grave reviews honestos de produtos reais; quando alguém compra após assistir, você ganha.', firstWeekStep: 'Liste 10 itens úteis da sua casa com boa procura na Amazon.', companionTools: 'Tripé + Ring Light + Microfone' },
  { number: 37, title: 'Afiliados de Marketplaces (ML, Shopee, Amazon, Magalu)', chapter: 5, investment: 'Zero investimento', payoutModel: '2% a 15% por venda', howItWorks: 'Indique produtos úteis com comparativos honestos em guias, grupos ou vídeos.', firstWeekStep: 'Ative cadastros gratuitos e padronize links curtos por nicho.', companionTools: 'Canva + Metricool' },
  { number: 38, title: 'Hotmart Afiliados — Curadoria de Cursos e Guias', chapter: 5, investment: 'Zero investimento', payoutModel: 'Comissão por venda', howItWorks: 'Recomende apenas cursos que você revisou a ementa e que resolvem dúvidas reais.', firstWeekStep: 'Avalie página, suporte e taxa de reembolso antes de divulgar.', companionTools: 'Notion + Hostinger' },
  { number: 39, title: 'QuintoAndar Indica Aí — Indicação de Imóveis', chapter: 5, investment: 'Zero investimento', payoutModel: 'R$ 100+ por anúncio/aluguel', howItWorks: 'Indique apartamentos e casas vazias de conhecidos na área de cobertura.', firstWeekStep: 'Converse com porteiros, vizinhos e grupos de bairro com autorização.', companionTools: 'WhatsApp Business' },
  { number: 40, title: 'Mercado Pago — Indicações de Conta e Maquininhas', chapter: 5, investment: 'Zero investimento', payoutModel: 'R$ por indicação ativa', howItWorks: 'Comércios de bairro que começam a aceitar Pix/cartão via seu convite geram bônus.', firstWeekStep: 'Ajude pequenos prestadores locais a configurar taxas claras.', companionTools: 'Gestão financeira simples' },
  { number: 41, title: 'Afiliados B2B (Make, TubeBuddy, Hostinger)', chapter: 5, investment: 'Zero investimento', payoutModel: '20% a 30% recorrente', howItWorks: 'Recomende softwares que empresas usam todo mês para receber comissão recorrente.', firstWeekStep: 'Crie tutoriais práticos mostrando o software resolvendo um caso real.', companionTools: 'Hostinger + Notion + Loom' },
  { number: 42, title: 'Redes CPA (AffiliaXe e similares)', chapter: 5, investment: 'Zero investimento', payoutModel: 'CPA por ação qualificada', howItWorks: 'Campanhas de cadastro ou instalação com regras rígidas de origem de tráfego.', firstWeekStep: 'Estude termos de aprovação antes de enviar tráfego.', companionTools: 'Landing page própria' },
  { number: 43, title: 'Monetização de Atenção Web (Buy Me a Coffee / Brave)', chapter: 5, investment: 'Zero investimento', payoutModel: 'Apoios e tokens', howItWorks: 'Sustente ferramentas gratuitas, textos técnicos e portais úteis com apoio voluntário.', firstWeekStep: 'Explique com transparência o valor gratuito entregue ao leitor.', companionTools: 'Portal próprio + BuyMeACoffee' },
  { number: 44, title: 'Honeygain / Repocket / Pawns.app — Banda Ociosa', chapter: 5, investment: 'Zero investimento', payoutModel: 'US$ 5 a US$ 25/mês', howItWorks: 'Aplicativos de rede em segundo plano em dispositivos pessoais não corporativos.', firstWeekStep: 'Use apenas em equipamento próprio verificando consumo de dados.', companionTools: 'Nobreak / Roteador controlado' },
  { number: 45, title: 'SideShift e Ecossistema Cripto (Educação e Uso Cauteloso)', chapter: 5, investment: 'Zero investimento', payoutModel: 'Comissão / taxa variável', howItWorks: 'Referência técnica apenas para quem domina autocustódia e gestão de risco.', firstWeekStep: 'Nunca arrisque capital essencial; estude segurança digital primeiro.', companionTools: 'Hardware Wallet' },
  { number: 46, title: 'Amazon KDP — E-books e Livros Físicos Sob Demanda', chapter: 6, investment: 'Zero investimento', payoutModel: '35% a 70% royalties', howItWorks: 'Publique guias práticos em Kindle e versão impressa 6x9" sem estoque em casa.', firstWeekStep: 'Diagramar miolo limpo e validar capa em tamanho miniatura.', companionTools: 'Canva + Wise + Associados Amazon' },
  { number: 47, title: 'Loja de Templates e Produtos Digitais (Gumroad / Etsy)', chapter: 6, investment: 'Com investimento inicial', payoutModel: 'R$ 200 a R$ 2.000+/mês', howItWorks: 'Venda planilhas, sistemas no Notion, planners e packs editáveis com entrega automática.', firstWeekStep: 'Mostre 3 capturas reais e vídeo curto de 30s provando utilidade.', companionTools: 'Notion + Canva + Hostinger' },
  { number: 48, title: 'Comunidades Pagas e Microcursos (Skool / Systeme.io)', chapter: 6, investment: 'Com investimento inicial', payoutModel: 'Recorrência mensal', howItWorks: 'Grupos estruturados com desafios semanais, biblioteca e suporte contínuo.', firstWeekStep: 'Valide o tema gratuito com 10 membros antes de abrir assinatura.', companionTools: 'Systeme.io + Stripe' },
  { number: 49, title: 'Print on Demand (Montink Brasil / Printful Global)', chapter: 6, investment: 'Com investimento inicial', payoutModel: 'Margem por peça', howItWorks: 'Estampas autorais para nichos específicos produzidas apenas após venda confirmada.', firstWeekStep: 'Crie 5 estampas limpas 300 DPI para uma comunidade nichada.', companionTools: 'Canva Pro + Wise + Shopify' },
  { number: 50, title: 'Produção de Vídeos e Avatares com IA para Empresas', chapter: 6, investment: 'Com investimento inicial', payoutModel: 'R$ 400 a R$ 3.000+ / projeto', howItWorks: 'Vídeos explicativos, onboarding de funcionários e anúncios curtos sem estúdio físico.', firstWeekStep: 'Monte 2 vídeos demonstrativos curtos com locução limpa.', companionTools: 'HeyGen + ElevenLabs + Runway' },
  { number: 51, title: 'Automação e Assistentes de IA para Negócios Locais', chapter: 6, investment: 'Com investimento inicial', payoutModel: 'R$ 800 a R$ 4.000+ / projeto', howItWorks: 'Fluxos automáticos ligando WhatsApp, planilhas e agenda de clínicas ou oficinas.', firstWeekStep: 'Construa 1 demo funcional e apresente pessoalmente a 5 negócios.', companionTools: 'Make + Hostinger VPS + OpenAI' },
  { number: 52, title: 'Gestão de Tráfego Pago Local (Google Ads / Meta Ads)', chapter: 6, investment: 'Com investimento inicial', payoutModel: 'R$ 600 a R$ 2.000/mês por cliente', howItWorks: 'Campanhas geolocalizadas focadas em ligações e mensagens de orçamento.', firstWeekStep: 'Otimize primeiro o Google Perfil da Empresa de 1 parceiro local.', companionTools: 'Hostinger + Metricool + Canva' },
  { number: 53, title: 'Walmart Marketplace (Revenda e Arbitragem nos EUA)', chapter: 6, investment: 'Com investimento inicial', payoutModel: 'Margem líquida em US$', howItWorks: 'Revenda autorizada de produtos com demanda comprovada usando logística WFS.', firstWeekStep: 'Calcule todas as taxas, frete e devolução antes da compra inicial.', companionTools: 'Payoneer + Planilha Raio-X' },
];

function buildSharedStyles(isPrint: boolean): string {
  if (!isPrint) {
    return `
      body { font-family: Georgia, serif; line-height: 1.65; color: #111827; max-width: 720px; margin: 0 auto; padding: 24px; }
      h1, h2, h3 { font-family: Georgia, serif; line-height: 1.2; color: #0f172a; }
      h1 { font-size: 2.2em; margin-bottom: 0.4em; }
      h2 { font-size: 1.5em; margin-top: 2em; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; page-break-before: always; }
      .entry { margin: 1.4em 0; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 6px; page-break-inside: avoid; }
      .meta { font-size: 0.85em; color: #475569; margin-bottom: 6px; font-family: Arial, sans-serif; }
    `;
  }

  return `
    @page { size: 6in 9in; margin: 0.75in 0.65in 0.8in 0.75in; }
    body { font-family: Georgia, serif; font-size: 10.5pt; line-height: 1.5; color: #111111; margin: 0; }
    h1, h2, h3 { font-family: Georgia, serif; line-height: 1.2; color: #000000; }
    .cover { page-break-after: always; padding-top: 1.6in; text-align: center; }
    .cover h1 { font-size: 24pt; margin-bottom: 12pt; }
    .cover p { font-size: 12pt; color: #333333; max-width: 4in; margin: 0 auto 10pt; }
    .toc { page-break-after: always; }
    h2 { font-size: 15pt; margin-top: 0; border-bottom: 1pt solid #000000; padding-bottom: 4pt; page-break-before: always; }
    .entry { margin: 12pt 0; padding: 8pt 10pt; border: 0.6pt solid #94a3b8; page-break-inside: avoid; }
    .entry h3 { font-size: 11.5pt; margin: 0 0 4pt; }
    .meta { font-size: 8.5pt; color: #334155; margin-bottom: 5pt; font-family: Arial, sans-serif; }
    p { margin: 3pt 0; }
  `;
}

function buildBookHtml(mode: 'kindle' | 'print'): string {
  const isPrint = mode === 'print';
  const tocItems = CHAPTERS.map(
    (ch) => `<li><strong>Capítulo ${ch.number}: ${ch.title}</strong> — ${ch.subtitle}</li>`,
  ).join('\n');

  const chaptersHtml = CHAPTERS.map((ch) => {
    const items = ENTRIES.filter((entry) => entry.chapter === ch.number);
    const itemsHtml = items
      .map(
        (entry) => `
      <article class="entry">
        <h3>${String(entry.number).padStart(2, '0')}. ${entry.title}</h3>
        <div class="meta"><strong>Modelo:</strong> ${entry.investment} | <strong>Retorno:</strong> ${entry.payoutModel}</div>
        <p><strong>Como funciona:</strong> ${entry.howItWorks}</p>
        <p><strong>Primeiro passo em 7 dias:</strong> ${entry.firstWeekStep}</p>
        <p><strong>Ferramentas de apoio sugeridas:</strong> ${entry.companionTools}</p>
      </article>`,
      )
      .join('\n');

    return `
      <section>
        <h2>Capítulo ${ch.number}: ${ch.title}</h2>
        <p><em>${ch.subtitle}</em></p>
        ${itemsHtml}
      </section>
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>50+ Formas Reais de Construir Renda Extra — Portal NKL</title>
  <style>${buildSharedStyles(isPrint)}</style>
</head>
<body>
  <div class="cover">
    <p>PORTAL NKL · EDIÇÃO COMPLETA (${isPrint ? 'VERSÃO IMPRESSA 6x9"' : 'VERSÃO KINDLE E-BOOK'})</p>
    <h1>50+ Formas Reais de Construir Renda Extra</h1>
    <p>Critérios práticos, plataformas sem custo inicial, negócios com investimento e ferramentas recomendadas sem promessas irreais.</p>
    <p>Curadoria NKL_OFICIAL · Portal NKL (nkloficial.com.br)</p>
  </div>

  <div class="toc">
    <h3>Sumário</h3>
    <ol>${tocItems}</ol>
    <p><strong>Nota editorial:</strong> Nenhuma plataforma ou modelo citado garante aprovação ou renda fixa. Trate cada frente como teste de 7 a 14 dias registrando horas reais e retorno líquido.</p>
  </div>

  ${chaptersHtml}

  <section>
    <h2>Checklist Final: Evitando Reprovações e Golpes</h2>
    <ol>
      <li>Nunca pague taxa antecipada para liberar saque em plataformas de microtarefas ou pesquisas.</li>
      <li>Separe contas de recebimento em dólar/euro (Wise/Payoneer) antes de trabalhar para fora.</li>
      <li>Registre tempo efetivo por tarefa durante 14 dias: ganho bruto sem contar horas mascara retorno baixo.</li>
      <li>Comece por 1 frente de investimento zero antes de migrar parte do lucro para modelos com capital inicial.</li>
    </ol>
  </section>
</body>
</html>`;
}

function main(): void {
  const outDir = path.join(process.cwd(), 'private-assets', 'amazon-book');
  mkdirSync(outDir, { recursive: true });

  const kindlePath = path.join(outDir, '50-formas-renda-extra-kindle.html');
  const printPath = path.join(outDir, '50-formas-renda-extra-impresso-6x9.html');

  const kindleHtml = buildBookHtml('kindle');
  const printHtml = buildBookHtml('print');

  writeFileSync(kindlePath, kindleHtml, 'utf8');
  writeFileSync(printPath, printHtml, 'utf8');

  console.log(
    JSON.stringify({
      entriesCount: ENTRIES.length,
      chaptersCount: CHAPTERS.length,
      kindleBytes: Buffer.byteLength(kindleHtml, 'utf8'),
      printBytes: Buffer.byteLength(printHtml, 'utf8'),
      outDir: 'private-assets/amazon-book',
    }),
  );
}

main();
