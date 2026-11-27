import { escapeHtml, type BookBusinessProfileRow, type BookChapterPayload } from './types';

type BusinessPlaybook = {
  idealProfile: string;
  offerTiers: readonly [string, string, string];
  firstClientNoAds: string;
  sevenDayValidation: string;
};

type PromptItem = {
  code: string;
  title: string;
  whenToUse: string;
  body: string;
};

type PromptGroup = {
  title: string;
  summary: string;
  prompts: readonly PromptItem[];
};

type GlossaryEntry = {
  term: string;
  expanded: string;
  meaning: string;
  inPractice: string;
};

const LEVEL_LABELS: Record<'low' | 'medium' | 'high', string> = {
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
};

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, ' ')
    .trim();
}

function parseCapitalAmount(rawCapital: string): number {
  const normalized = rawCapital.replace(/[^\d.,-]/gu, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function formatCapitalBrl(rawCapital: string): string {
  const amount = parseCapitalAmount(rawCapital);
  if (amount === 0) {
    return 'R$ 0 (entrada sem custo financeiro)';
  }
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `R$ ${formatted}`;
}

function sortProfiles(profiles: readonly BookBusinessProfileRow[]): BookBusinessProfileRow[] {
  return [...profiles].sort((left, right) => {
    const capitalDiff = parseCapitalAmount(left.minCapital) - parseCapitalAmount(right.minCapital);
    if (capitalDiff !== 0) return capitalDiff;
    const timeDiff = left.minTimeHours - right.minTimeHours;
    if (timeDiff !== 0) return timeDiff;
    return left.name.localeCompare(right.name, 'pt-BR');
  });
}

const BUSINESS_PLAYBOOKS: ReadonlyMap<string, BusinessPlaybook> = new Map<string, BusinessPlaybook>([
  [
    normalizeKey('Avaliação de IA e dados'),
    {
      idealProfile: 'Pessoas analíticas, atentas a detalhes e confortáveis com leitura crítica sem precisar aparecer em câmera.',
      offerTiers: [
        'Entrada simples: lotes avulsos de comparação de respostas e checagem factual em português.',
        'Recomendada de alto valor: projetos bilíngues (português e inglês) com rubricas técnicas ou raciocínio lógico.',
        'Pacote completo/ancoragem: atuação recorrente como revisor especialista em dados ou código para múltiplas plataformas.',
      ],
      firstClientNoAds: 'Aprovação direta nas plataformas globais (Outlier, Micro1, Alignerr, OneForma) com perfil completo, inglês funcional e prova inicial feita sem pressa.',
      sevenDayValidation: 'Dias 1–2: criar conta Wise/Payoneer e preencher perfil. Dias 3–4: estudar o guia de rubricas e fazer a triagem. Dias 5–7: completar as primeiras tarefas pagas e medir ganho líquido por hora.',
    },
  ],
  [
    normalizeKey('Testes de usabilidade'),
    {
      idealProfile: 'Quem sabe explicar em voz alta o que funciona e o que confunde ao navegar por um site ou aplicativo novo.',
      offerTiers: [
        'Entrada simples: testes curtos não moderados de 10 a 15 minutos pelo celular ou computador.',
        'Recomendada de alto valor: sessões moderadas ao vivo de 30 a 60 minutos avaliando fluxos completos.',
        'Pacote completo/ancoragem: entrevistas B2B recorrentes e consultoria rápida de usabilidade para times locais de produto.',
      ],
      firstClientNoAds: 'Concluir o teste de áudio da UserTesting e preencher 100% do perfil demográfico real na Prolific, Dscout e User Interviews.',
      sevenDayValidation: 'Dias 1–2: testar microfone sem eco e gravar amostra clara. Dias 3–5: responder qualificadores honestos pela manhã e à tarde. Dias 6–7: fechar o primeiro teste aprovado e registrar o tempo real gasto.',
    },
  ],
  [
    normalizeKey('Testes de qualidade (QA) e localização multilíngue'),
    {
      idealProfile: 'Perfis metódicos que gostam de caçar falhas em aplicativos, validar traduções e documentar passos para reprodução de bugs.',
      offerTiers: [
        'Entrada simples: reporte de falhas funcionais avulsas em ciclos abertos (uTest) e checagem de textos em português.',
        'Recomendada de alto valor: ciclos pagos por hora em múltiplos dispositivos (Testlio) com revisão linguística completa.',
        'Pacote completo/ancoragem: contrato mensal de QA e revisão multilíngue para software houses ou e-commerces que vendem fora.',
      ],
      firstClientNoAds: 'Completar a trilha gratuita da uTest Academy, cadastrar todos os aparelhos de casa e enviar o primeiro relatório de bug com vídeo curto.',
      sevenDayValidation: 'Dias 1–3: concluir módulos iniciais da academia de QA. Dias 4–5: participar de um ciclo sandbox e treinar relatório passo a passo. Dias 6–7: candidatar-se a ciclos pagos de Brasil e América Latina.',
    },
  ],
  [
    normalizeKey('Aulas particulares, mentoria e consultoria prática'),
    {
      idealProfile: 'Profissionais, músicos, professores ou técnicos que dominam uma habilidade útil e sabem conduzir alguém do ponto A ao ponto B.',
      offerTiers: [
        'Entrada simples: sessão diagnóstica prática de 50 minutos com plano de ação objetivo.',
        'Recomendada de alto valor: pacote mensal de 4 encontros semanais com acompanhamento por mensagens e tarefas.',
        'Pacote completo/ancoragem: mentoria trimestral ou treinamento em grupo pequeno para empresas e equipes.',
      ],
      firstClientNoAds: 'Publicar 3 demonstrações curtas resolvendo uma dúvida real e convidar 10 ex-colegas ou contatos de nicho para uma primeira sessão com vaga limitada.',
      sevenDayValidation: 'Dias 1–2: definir exatamente quem você ajuda e qual resultado entrega em 4 semanas. Dias 3–4: estruturar agenda e link de pagamento. Dias 5–7: oferecer 3 sessões piloto pagas com preço de entrada.',
    },
  ],
  [
    normalizeKey('Curadoria de compras e afiliado de nicho'),
    {
      idealProfile: 'Pessoas organizadas que pesquisam custo-benefício antes de comprar e gostam de comparar produtos reais sem empurrar lixo.',
      offerTiers: [
        'Entrada simples: links comentados de produtos testados em grupos de interesse, listas de compras e stories.',
        'Recomendada de alto valor: páginas comparativas e vídeos curtos de revisão com foco em intenção de compra.',
        'Pacote completo/ancoragem: ecossistema de listas sazonais, newsletter de achados úteis e parcerias diretas com marcas.',
      ],
      firstClientNoAds: 'Escolher 10 produtos reais que você usa ou pesquisou a fundo, montar 1 comparativo honesto e compartilhar em comunidades onde a dúvida já existe.',
      sevenDayValidation: 'Dias 1–2: ativar contas de afiliado em Amazon, Mercado Livre e Shopee. Dias 3–5: publicar 3 comparativos objetivos com prós e contras reais. Dias 6–7: checar cliques e substituir itens sem procura.',
    },
  ],
  [
    normalizeKey('Publicação de e-books e livros na Amazon KDP'),
    {
      idealProfile: 'Quem consegue organizar conhecimento prático em guias claros, cadernos temáticos ou manuais de consulta sem depender de exposição diária.',
      offerTiers: [
        'Entrada simples: e-book Kindle curto (30 a 60 páginas) resolvendo um problema específico de bolso.',
        'Recomendada de alto valor: edição completa em e-book Kindle + livro físico capa comum 6x9 polegadas com planilhas.',
        'Pacote completo/ancoragem: série de livros no mesmo tema com versão bilíngue e página de apoio no portal próprio.',
      ],
      firstClientNoAds: 'Validar demanda pelas categorias e palavras-chave da própria Amazon, entregar uma capa legível em miniatura e divulgar para leitores de nicho.',
      sevenDayValidation: 'Dias 1–2: mapear 5 subcategorias da Amazon com livros ativos e notas reais de leitores. Dias 3–5: fechar o sumário detalhado e escrever o primeiro capítulo modelo. Dias 6–7: testar capa e sinopse com 5 leitores-teste.',
    },
  ],
  [
    normalizeKey('Serviços digitais especializados'),
    {
      idealProfile: 'Freelancers com base em design, texto, planilhas, tradução, áudio ou código que querem trocar bicos aleatórios por contratos previsíveis.',
      offerTiers: [
        'Entrada simples: entrega única de escopo fechado (ex.: auditoria, revisão ou ajuste pontual em 48 horas).',
        'Recomendada de alto valor: projeto completo com entrega principal, documentação e 1 rodada organizada de ajustes.',
        'Pacote completo/ancoragem: contrato mensal de manutenção ou produção contínua com prazo prioritário.',
      ],
      firstClientNoAds: 'Montar 2 amostras reais de antes e depois, publicar 1 serviço específico no Fiverr/Upwork e enviar 10 abordagens personalizadas para empresas locais.',
      sevenDayValidation: 'Dias 1–2: escolher 1 único serviço mensurável (nada genérico). Dias 3–4: produzir 2 peças de portfólio. Dias 5–7: enviar 15 propostas curtas focadas no problema do cliente.',
    },
  ],
  [
    normalizeKey('Loja de templates e produtos digitais'),
    {
      idealProfile: 'Criadores práticos que já usam planilhas, Notion, Canva ou roteiros prontos para organizar o próprio trabalho e querem empacotar isso.',
      offerTiers: [
        'Entrada simples: template único pronto para uso imediato (ex.: controle financeiro ou painel de conteúdo).',
        'Recomendada de alto valor: kit completo com template principal, guia em vídeo de 10 minutos e exemplos preenchidos.',
        'Pacote completo/ancoragem: licença comercial ou pacote empresarial com personalização inicial assistida.',
      ],
      firstClientNoAds: 'Mostrar o template funcionando em um vídeo de tela de 45 segundos no YouTube, Instagram ou LinkedIn com link direto para checkout.',
      sevenDayValidation: 'Dias 1–3: transformar uma ferramenta que você já usa em arquivo limpo e replicável. Dias 4–5: gravar 3 capturas e 1 demonstração rápida. Dias 6–7: vender as primeiras 5 unidades para contatos ou audiência orgânica.',
    },
  ],
  [
    normalizeKey('Edição de vídeos curtos e cortes com IA'),
    {
      idealProfile: 'Pessoas com bom ritmo visual que sabem identificar o gancho de 3 segundos em entrevistas, aulas ou podcasts.',
      offerTiers: [
        'Entrada simples: pacote teste de 5 cortes verticais legendados e ajustados para Reels, Shorts e TikTok.',
        'Recomendada de alto valor: plano mensal de 16 a 20 cortes com capa, legenda dinâmica e entrega semanal.',
        'Pacote completo/ancoragem: pacote de 30 cortes mensais + reaproveitamento em carrossel e acompanhamento de retenção.',
      ],
      firstClientNoAds: 'Pegar um vídeo público de 5 podcasts, médicos, advogados ou professores locais, editar 2 cortes prontos de presente e enviar no WhatsApp ou e-mail.',
      sevenDayValidation: 'Dias 1–2: configurar fluxo rápido (OpusClip + CapCut) com legenda legível. Dias 3–5: produzir 6 amostras reais para 3 criadores reais. Dias 6–7: enviar e propor o pacote mensal de entrada.',
    },
  ],
  [
    normalizeKey('Produção de conteúdo UGC'),
    {
      idealProfile: 'Quem se comunica com naturalidade diante da câmera do celular, sabe mostrar um produto em uso real e segue briefings com disciplina.',
      offerTiers: [
        'Entrada simples: 1 vídeo vertical de 20 a 35 segundos em formato demonstração orgânica sem direitos de anúncio.',
        'Recomendada de alto valor: combo de 3 variações de gancho + 5 fotos em luz natural com direitos de veiculação por 90 dias.',
        'Pacote completo/ancoragem: retainer mensal de 8 vídeos variados + entrega de material bruto para testes da marca.',
      ],
      firstClientNoAds: 'Gravar 3 vídeos demonstrativos de produtos que você já tem em casa, montar portfólio em 1 página e aplicar na Billo, JoinBrands e marcas de e-commerce.',
      sevenDayValidation: 'Dias 1–2: ajustar enquadramento em janela com luz natural e áudio limpo. Dias 3–5: gravar 3 peças (unboxing, problema-solução, review). Dias 6–7: enviar portfólio para 15 marcas e plataformas UGC.',
    },
  ],
  [
    normalizeKey('Automação e assistentes de IA para pequenos negócios'),
    {
      idealProfile: 'Perfis lógicos que entendem fluxos de atendimento, planilhas e APIs e gostam de eliminar tarefas manuais repetitivas.',
      offerTiers: [
        'Entrada simples: automação pontual (ex.: envio de orçamento do formulário para WhatsApp e planilha organizada).',
        'Recomendada de alto valor: triagem automática de atendimento com agendamento integrado e resumo diário para o dono.',
        'Pacote completo/ancoragem: implantação completa + hospedagem, monitoramento mensal e ajustes contínuos de fluxos.',
      ],
      firstClientNoAds: 'Criar 1 demonstração funcional simulando uma clínica, oficina ou imobiliária e mostrar funcionando ao vivo para 10 negócios do seu bairro.',
      sevenDayValidation: 'Dias 1–3: montar 1 fluxo replicável no Make ou n8n resolvendo perda de leads no WhatsApp. Dias 4–5: gravar vídeo de 2 minutos mostrando na prática. Dias 6–7: visitar ou ligar para 10 empresas locais.',
    },
  ],
  [
    normalizeKey('Canal temático e vídeos com IA (monetização + afiliados)'),
    {
      idealProfile: 'Pessoas pacientes e consistentes que preferem construir audiência sem aparecer na câmera, unindo pesquisa de tema e roteiro claro.',
      offerTiers: [
        'Entrada simples: canal enxuto com 2 vídeos semanais monetizando por links de afiliados desde o primeiro mês.',
        'Recomendada de alto valor: canal consolidado combinando AdSense, afiliados recorrentes e guia digital próprio na descrição.',
        'Pacote completo/ancoragem: rede de 2 canais complementares no mesmo nicho com patrocínios diretos e produto próprio.',
      ],
      firstClientNoAds: 'Pesquisar 10 perguntas frequentes no YouTube com busca constante, publicar vídeos diretos respondendo cada uma e ligar ao catálogo de afiliados.',
      sevenDayValidation: 'Dias 1–2: definir subtema único e validar 10 títulos buscáveis. Dias 3–5: roteirizar, narrar e editar os 2 primeiros vídeos completos. Dias 6–7: publicar com miniatura limpa e medir retenção nos primeiros 30 segundos.',
    },
  ],
  [
    normalizeKey('Gestão de tráfego pago para negócios locais'),
    {
      idealProfile: 'Quem gosta de números, sabe escrever anúncios diretos e consegue conversar com donos de comércio sobre custo por cliente.',
      offerTiers: [
        'Entrada simples: organização do Google Perfil da Empresa + campanha local simples de clique para WhatsApp.',
        'Recomendada de alto valor: gestão mensal de Google Ads + Meta Ads com relatório semanal simples de contatos gerados.',
        'Pacote completo/ancoragem: gestão de tráfego + página rápida de conversão + roteiro de atendimento para a equipe do cliente.',
      ],
      firstClientNoAds: 'Auditar gratuitamente o Google Perfil da Empresa de 10 comércios locais com avaliações baixas ou link quebrado e mostrar o erro em vídeo curto.',
      sevenDayValidation: 'Dias 1–2: escolher 1 nicho local (clínica odontológica, estética, oficina ou advocacia). Dias 3–5: enviar 10 vídeos de 90 segundos apontando melhorias práticas. Dias 6–7: fechar o primeiro teste mensal de baixo risco.',
    },
  ],
  [
    normalizeKey('Afiliados e aquisição de tráfego'),
    {
      idealProfile: 'Operadores analíticos acostumados a testar páginas, medir cliques, controlar orçamento diário e cortar campanhas sem apego.',
      offerTiers: [
        'Entrada simples: captação orgânica por busca + páginas curtas de comparação para softwares B2B recorrentes.',
        'Recomendada de alto valor: funil enxuto com anúncio de pesquisa para palavras de fundo de funil e página própria.',
        'Pacote completo/ancoragem: múltiplas páginas de nicho com lista de e-mails segmentada e acordos exclusivos com produtores.',
      ],
      firstClientNoAds: 'Publicar comparativos escritos e tutoriais de busca orgânica para ferramentas que pagam comissão recorrente antes de arriscar verba em anúncios.',
      sevenDayValidation: 'Dias 1–2: escolher 2 programas com comissão clara e regra transparente. Dias 3–5: publicar 1 página comparativa objetiva e 1 tutorial em vídeo. Dias 6–7: testar rastreamento de cliques e taxa de conversão inicial.',
    },
  ],
  [
    normalizeKey('Comunidade e produtos digitais'),
    {
      idealProfile: 'Comunicadores consistentes que gostam de reunir pessoas em torno de desafios práticos, troca de experiências e material contínuo.',
      offerTiers: [
        'Entrada simples: oficina ao vivo gravada ou guia inicial de ticket acessível para validar o tema.',
        'Recomendada de alto valor: assinatura mensal com biblioteca organizada, encontros quinzenais e espaço de dúvidas.',
        'Pacote completo/ancoragem: plano anual com revisão individual periódica e acesso a todas as trilhas e planilhas.',
      ],
      firstClientNoAds: 'Reunir um grupo gratuito de desafio de 7 dias no WhatsApp ou Telegram com 15 interessados reais e abrir vagas de fundadores ao final.',
      sevenDayValidation: 'Dias 1–2: definir o marco que o membro alcança nos primeiros 30 dias. Dias 3–5: convidar 15 pessoas para um teste guiado gratuito. Dias 6–7: ofertar a assinatura de fundador com preço especial para os primeiros 10.',
    },
  ],
  [
    normalizeKey('Print on Demand e marca própria sem estoque'),
    {
      idealProfile: 'Criadores com olhar para identidade visual e cultura de micro-nichos (profissões, hobbies, música, pets, esportes).',
      offerTiers: [
        'Entrada simples: coleção enxuta de 5 peças em camisetas ou canecas testadas sob demanda (Montink ou Printful).',
        'Recomendada de alto valor: loja nichada com 15 variações coerentes, fotos reais de amostra e guia de presentes.',
        'Pacote completo/ancoragem: linha recorrente sazonal + kits para pequenas comunidades, eventos e empresas parceiras.',
      ],
      firstClientNoAds: 'Validar as 5 primeiras estampas dentro de comunidades do próprio nicho e fechar uma encomenda inicial para um evento ou grupo antes de rodar anúncios.',
      sevenDayValidation: 'Dias 1–2: escolher 1 micro-nicho com linguagem própria. Dias 3–5: criar 5 estampas limpas em 300 DPI e subir na loja sem estoque. Dias 6–7: encomendar 1 peça física para foto real e validar interesse.',
    },
  ],
  [
    normalizeKey('Micro-SaaS e ferramentas digitais recorrentes'),
    {
      idealProfile: 'Desenvolvedores ou construtores técnicos que sabem identificar uma dor repetitiva de nicho e entregar uma ferramenta simples que resolve só isso.',
      offerTiers: [
        'Entrada simples: utilitário enxuto resolvendo 1 cálculo, conversão ou geração de documento com plano mensal acessível.',
        'Recomendada de alto valor: plano profissional com histórico salvo, exportação e automação para equipes pequenas.',
        'Pacote completo/ancoragem: plano empresa com múltiplos usuários, suporte prioritário e personalização de marca.',
      ],
      firstClientNoAds: 'Entrevistar 10 usuários do nicho em comunidades técnicas, montar protótipo clicável em 48 horas e cobrar assinatura piloto dos 3 primeiros antes de sofisticar o código.',
      sevenDayValidation: 'Dias 1–2: listar 3 dores caras que hoje são feitas em planilhas lentas. Dias 3–5: construir versão mínima funcional com autenticação e pagamento. Dias 6–7: colocar 5 usuários reais testando ao vivo.',
    },
  ],
  [
    normalizeKey('Revenda e arbitragem em marketplaces (Walmart / Amazon / ML)'),
    {
      idealProfile: 'Perfis comerciais disciplinados com capital de giro separado, controle rígido de margem, notas fiscais e logística.',
      offerTiers: [
        'Entrada simples: teste controlado com 2 a 3 SKUs de giro rápido e margem líquida validada após todas as taxas.',
        'Recomendada de alto valor: operação com reposição semanal usando fulfillment (WFS/FBA/Full) para escalar sem empacotar em casa.',
        'Pacote completo/ancoragem: compra direta de distribuidores autorizados com múltiplas marcas e giro previsível de estoque.',
      ],
      firstClientNoAds: 'Nos marketplaces, o cliente já está pesquisando dentro da plataforma; a conquista vem de preço competitivo, estoque disponível, cadastro técnico correto e boa entrega.',
      sevenDayValidation: 'Dias 1–2: montar planilha de custos incluindo comissão, frete, imposto e taxa de devolução. Dias 3–5: garimpar 5 produtos com histórico real de venda. Dias 6–7: fazer compra teste pequena apenas onde a margem líquida passar de 20%.',
    },
  ],
]);

function resolvePlaybook(profile: BookBusinessProfileRow): BusinessPlaybook {
  const exact = BUSINESS_PLAYBOOKS.get(normalizeKey(profile.name));
  if (exact) {
    return exact;
  }

  const capital = parseCapitalAmount(profile.minCapital);
  const capitalPhrase = capital === 0
    ? 'sem desembolso inicial obrigatório'
    : `com reserva inicial controlada de ${formatCapitalBrl(profile.minCapital)}`;

  return {
    idealProfile: `Pessoas com disponibilidade mínima de ${profile.minTimeHours} horas por semana e afinidade com nível técnico ${LEVEL_LABELS[profile.techLevel].toLowerCase()}, buscando iniciar ${capitalPhrase}.`,
    offerTiers: [
      'Entrada simples: entrega enxuta de teste ou serviço avulso com escopo fechado em até 7 dias.',
      'Recomendada de alto valor: pacote principal estruturado com entrega completa, acompanhamento claro e revisão.',
      'Pacote completo/ancoragem: contrato mensal recorrente ou versão completa com suporte prioritário.',
    ],
    firstClientNoAds: 'Apresentar uma amostra prática do resultado para 10 contatos diretos ou comunidades ligadas ao tema, sem investir em tráfego pago antes da primeira venda.',
    sevenDayValidation: 'Dias 1–2: definir escopo e preço de entrada. Dias 3–5: criar 2 amostras reais e abordar 10 interessados. Dias 6–7: ajustar a oferta com base nas objeções reais e registrar o ganho líquido.',
  };
}

function buildChapter10(profiles: readonly BookBusinessProfileRow[]): BookChapterPayload {
  const sorted = sortProfiles(profiles);

  const introHtml = `
    <p>Renda extra paga boletos imediatos, mas depender para sempre de tarefas avulsas mantém seu ganho preso às horas que você tem disponíveis na semana. O salto para um negócio próprio acontece quando você usa o caixa gerado pelas frentes gratuitas para financiar três pilares: reserva operacional, ferramentas que multiplicam sua velocidade e ofertas que clientes compram mais de uma vez.</p>
    <p>A regra de ouro da transição é simples: <strong>nunca queime reserva pessoal ou limite de cartão para testar uma hipótese que ainda não teve cliente pagante</strong>. Primeiro você valida demanda com investimento zero ou mínimo; depois, separa 20% a 30% do lucro líquido para evoluir de executor avulso para prestador recorrente ou dono de ativos digitais.</p>
    <div class="callout">
      <p><strong>Critério da Bússola de Negócios (Portal NKL):</strong> cada um dos ${sorted.length} modelos abaixo exige uma combinação diferente de capital inicial, horas semanais, domínio técnico e tolerância a risco. Em vez de copiar o modelo da moda, escolha aquele que cabe na sua rotina atual de segunda a sexta.</p>
    </div>
  `.trim();

  const modelsKindle = sorted
    .map((profile, index) => {
      const playbook = resolvePlaybook(profile);
      const numberLabel = String(index + 1).padStart(2, '0');
      const capitalLabel = formatCapitalBrl(profile.minCapital);
      const techLabel = LEVEL_LABELS[profile.techLevel];
      const riskLabel = LEVEL_LABELS[profile.riskLevel];

      return `
        <article class="entry">
          <h3>${numberLabel}. ${escapeHtml(profile.name)}</h3>
          <p class="meta"><strong>Capital inicial mínimo:</strong> ${escapeHtml(capitalLabel)}<br />
          <strong>Dedicação mínima semanal:</strong> ${escapeHtml(String(profile.minTimeHours))} horas/semana | <strong>Nível Técnico:</strong> ${escapeHtml(techLabel)} | <strong>Risco:</strong> ${escapeHtml(riskLabel)}</p>
          <p><strong>Perfil Ideal:</strong> ${escapeHtml(playbook.idealProfile)}</p>
          <p><strong>Estrutura Comercial em 3 Opções:</strong></p>
          <ol>
            <li><strong>Entrada simples:</strong> ${escapeHtml(playbook.offerTiers[0].replace(/^Entrada simples:\s*/iu, ''))}</li>
            <li><strong>Recomendada de alto valor:</strong> ${escapeHtml(playbook.offerTiers[1].replace(/^Recomendada de alto valor:\s*/iu, ''))}</li>
            <li><strong>Pacote completo/ancoragem:</strong> ${escapeHtml(playbook.offerTiers[2].replace(/^Pacote completo\/ancoragem:\s*/iu, ''))}</li>
          </ol>
          <p><strong>Como Fechar o 1º Cliente sem Anúncios Pagos:</strong> ${escapeHtml(playbook.firstClientNoAds)}</p>
          <p><strong>Plano de Validação de 7 Dias:</strong> ${escapeHtml(playbook.sevenDayValidation)}</p>
        </article>
      `.trim();
    })
    .join('\n');

  const modelsPrint = sorted
    .map((profile, index) => {
      const playbook = resolvePlaybook(profile);
      const numberLabel = String(index + 1).padStart(2, '0');
      const capitalLabel = formatCapitalBrl(profile.minCapital);
      const techLabel = LEVEL_LABELS[profile.techLevel];
      const riskLabel = LEVEL_LABELS[profile.riskLevel];

      return `
        <article class="entry">
          <h3>${numberLabel}. ${escapeHtml(profile.name)}</h3>
          <p class="meta"><strong>Capital inicial mínimo:</strong> ${escapeHtml(capitalLabel)} · <strong>Dedicação mínima semanal:</strong> ${escapeHtml(String(profile.minTimeHours))} horas/semana · <strong>Nível Técnico:</strong> ${escapeHtml(techLabel)} · <strong>Risco:</strong> ${escapeHtml(riskLabel)}</p>
          <p><strong>Perfil Ideal:</strong> ${escapeHtml(playbook.idealProfile)}</p>
          <p><strong>Estrutura Comercial em 3 Opções:</strong></p>
          <ol>
            <li><strong>Entrada simples:</strong> ${escapeHtml(playbook.offerTiers[0].replace(/^Entrada simples:\s*/iu, ''))}</li>
            <li><strong>Recomendada de alto valor:</strong> ${escapeHtml(playbook.offerTiers[1].replace(/^Recomendada de alto valor:\s*/iu, ''))}</li>
            <li><strong>Pacote completo/ancoragem:</strong> ${escapeHtml(playbook.offerTiers[2].replace(/^Pacote completo\/ancoragem:\s*/iu, ''))}</li>
          </ol>
          <p><strong>Como Fechar o 1º Cliente sem Anúncios Pagos:</strong> ${escapeHtml(playbook.firstClientNoAds)}</p>
          <p><strong>Plano de Validação de 7 Dias:</strong> ${escapeHtml(playbook.sevenDayValidation)}</p>
        </article>
      `.trim();
    })
    .join('\n');

  const transitionSection = `
    <h3>Regra da Escada de Caixa</h3>
    <p>Se hoje você dispõe de R$ 0 e poucas horas livres, comece pelos primeiros modelos da lista (avaliação de IA, usabilidade, QA, aulas ou curadoria). Assim que acumular seus primeiros R$ 500 de caixa líquido sem tocar no salário principal, decida com frieza: você quer escalar <strong>serviço recorrente</strong> (mais previsível em 30 dias) ou <strong>ativo digital</strong> (mais lento no início, mais livre depois)?</p>
  `.trim();

  return {
    id: 'cap-10',
    tocLabel: 'Capítulo 10 — Os 18 Modelos de Negócio da Bússola',
    title: 'Capítulo 10: Os 18 Modelos de Negócio da Bússola — Do Extra ao Negócio Próprio',
    subtitle: 'Como transformar fluxo de caixa de renda extra em serviço ou ativo recorrente sem queimar capital.',
    htmlKindle: `
      ${introHtml}
      <hr />
      ${modelsKindle}
      <hr />
      ${transitionSection}
    `.trim(),
    htmlPrint: `
      ${introHtml}
      <hr />
      ${modelsPrint}
      <hr />
      ${transitionSection}
    `.trim(),
  };
}

const PROMPT_GROUPS: readonly PromptGroup[] = [
  {
    title: 'Grupo 1 — Triagem, Perfil Global e Avaliação de IA (Outlier, Micro1, Prolific, LinkedIn)',
    summary: 'Comandos para montar perfis claros em inglês e português, revisar rubricas de avaliação de modelos e evitar reprovações por pressa ou resposta genérica.',
    prompts: [
      {
        code: 'Prompt 01',
        title: 'Headline e Resumo de Perfil Global no LinkedIn e Micro1',
        whenToUse: 'Ao criar ou atualizar perfis para plataformas internacionais de IA e entrevistas B2B.',
        body: 'Atue como recrutador técnico internacional. Reescreva minha apresentação profissional abaixo em duas versões: português direto e inglês natural de negócios (sem exageros). Destaque minhas habilidades reais em [SUA ÁREA], ferramentas que domino ([FERRAMENTAS]) e projetos práticos que já executei ([EXPERIÊNCIA]). Limite a headline a 120 caracteres e o resumo a 3 parágrafos curtos. Texto base: [COLE SEU RESUMO ATUAL].',
      },
      {
        code: 'Prompt 02',
        title: 'Leitura Crítica de Rubrica de Avaliação (Outlier / DataAnnotation)',
        whenToUse: 'Antes de iniciar um projeto novo de avaliação para garantir que nenhum critério de pontuação foi ignorado.',
        body: 'Vou trabalhar em uma tarefa de avaliação de respostas de IA. Leia as instruções e a rubrica abaixo e extraia: (1) os 5 erros eliminatórios que mais causam reprovação; (2) um checklist rápido de 6 perguntas para eu conferir antes de clicar em enviar; (3) exemplos práticos do que separa uma resposta nota média de uma resposta excelente. Rubrica: [COLE AS INSTRUÇÕES].',
      },
      {
        code: 'Prompt 03',
        title: 'Justificativa Técnica de Avaliação (Justification Builder)',
        whenToUse: 'Para redigir justificativas objetivas comparando duas respostas geradas por modelos de IA.',
        body: 'Compare as duas respostas abaixo (Resposta A e Resposta B) segundo os critérios: cumprimento de instruções, precisão factual, tom e clareza. Escreva uma justificativa objetiva em [PORTUGUÊS OU INGLÊS], com no máximo 120 palavras, citando trechos concretos de erro ou acerto sem usar frases vagas. Enunciado original: [PROMPT]. Resposta A: [TEXTO A]. Resposta B: [TEXTO B].',
      },
      {
        code: 'Prompt 04',
        title: 'Preparação de Screener para Pesquisas e Entrevistas B2B (Prolific / Respondent)',
        whenToUse: 'Para organizar fatos reais da sua rotina profissional antes de responder qualificadores com coerência.',
        body: 'Com base na minha experiência real descrita abaixo, organize uma ficha de referência rápida contendo: cargo exato, setor, tamanho aproximado da empresa onde atuo ou atuei, ferramentas que uso toda semana e principais desafios operacionais do meu dia a dia. Não invente dados; apenas estruture minha biografia verdadeira para manter consistência em estudos na Prolific e Respondent: [DESCREVA SUA EXPERIÊNCIA REAL].',
      },
      {
        code: 'Prompt 05',
        title: 'Simulador de Entrevista Técnica e Clareza em Voz Alta',
        whenToUse: 'Para treinar respostas faladas em triagens de plataformas como Micro1 ou testes UX moderados.',
        body: 'Simule uma entrevista de triagem de 5 perguntas objetivas para a vaga ou área de [ÁREA DE ATUAÇÃO] em [IDIOMA]. Faça uma pergunta por vez. Após cada resposta minha, aponte o que ficou vago, corrija erros que comprometam a compreensão e proponha uma versão 30% mais concisa para eu repetir em voz alta.',
      },
    ],
  },
  {
    title: 'Grupo 2 — Propostas Comerciais e Gigs (Upwork, Fiverr, Prospecção Local)',
    summary: 'Comandos para escrever ofertas sem enrolação, atacar o problema do cliente na primeira linha e aumentar a taxa de resposta sem baixar preço.',
    prompts: [
      {
        code: 'Prompt 06',
        title: 'Proposta Curta de 3 Blocos para Upwork',
        whenToUse: 'Quando uma vaga internacional acaba de abrir e você quer se destacar nos primeiros 15 minutos.',
        body: 'Escreva uma proposta para o trabalho abaixo seguindo exatamente 3 blocos: (1) primeira frase provando que li o problema específico do cliente e já resolvi caso semelhante; (2) plano curto de 3 passos mostrando como entrego o resultado em [PRAZO]; (3) pergunta final objetiva convidando para uma conversa rápida ou envio do material. Tom profissional, zero bajulação, máximo 160 palavras, em [IDIOMA]. Descrição da vaga: [COLE A VAGA].',
      },
      {
        code: 'Prompt 07',
        title: 'Página Completa de Gig Hiperespecífico no Fiverr',
        whenToUse: 'Para criar um serviço digital empacotado fácil de entender e comprar.',
        body: 'Crie a estrutura completa de um Gig no Fiverr para o serviço de [DESCREVA O SERVIÇO]. Gere: (1) 3 opções de título direto com até 80 caracteres; (2) descrição escaneável focada no problema resolvido, o que está incluído e o que preciso do cliente para começar; (3) tabela dos 3 pacotes (Basic, Standard e Premium) com entregáveis claros; (4) 5 perguntas frequentes que reduzem pedidos de cancelamento.',
      },
      {
        code: 'Prompt 08',
        title: 'Abordagem Direta sem Anúncios para Negócios Locais (WhatsApp / E-mail)',
        whenToUse: 'Para prospectar clínicas, oficinas, lojas ou prestadores locais com uma amostra pronta.',
        body: 'Escreva uma mensagem curta de primeiro contato (até 450 caracteres) para enviar a [TIPO DE NEGÓCIO LOCAL] oferecendo [SEU SERVIÇO]. A mensagem deve mencionar um ponto de melhoria visível no atendimento ou presença digital da empresa, entregar uma pequena amostra gratuita anexada e terminar sem pressão de venda agressiva. Evite jargões de marketing.',
      },
      {
        code: 'Prompt 09',
        title: 'Roteiro de Vídeo Loom de 90 Segundos para Fechar Contrato',
        whenToUse: 'Para gravar uma análise rápida de tela mostrando valor real antes da reunião comercial.',
        body: 'Monte um roteiro cronometrado de 90 segundos para eu gravar mostrando a tela para o cliente [NOME OU NICHO]. Divida em: 0–15s (problema encontrado), 15–55s (como o ajuste funciona na prática), 55–90s (próximo passo simples para testar em 7 dias). Linguagem natural de conversa, sem termos técnicos difíceis.',
      },
      {
        code: 'Prompt 10',
        title: 'Sequência de Follow-up Educada em 3 Toques',
        whenToUse: 'Quando o potencial cliente visualizou a proposta e não respondeu em 3 a 7 dias.',
        body: 'Crie 3 mensagens curtas de acompanhamento (Dia 3, Dia 7 e Dia 14) para um cliente de [NICHO] que recebeu minha proposta de [SERVIÇO] e ainda não respondeu. Cada mensagem deve trazer um detalhe útil novo ou facilitar uma resposta simples de sim ou não, sem soar desesperado.',
      },
    ],
  },
  {
    title: 'Grupo 3 — Conteúdo UGC, Roteiros e Cortes (Briefings, Ganchos de 3s, Revisão)',
    summary: 'Comandos para transformar briefings soltos em roteiros graváveis no celular, multiplicar variações de abertura e cortar vídeos sem perder retenção.',
    prompts: [
      {
        code: 'Prompt 11',
        title: 'Desdobramento de Briefing UGC em Roteiro Cena a Cena',
        whenToUse: 'Ao receber um briefing de marca na Billo, JoinBrands ou contratação direta.',
        body: 'Transforme o briefing abaixo em um roteiro de vídeo vertical de [DURAÇÃO] segundos. Separe em tabela simples de texto com: Tempo | Enquadramento/Ação visual | Fala natural | Texto na tela. Inclua indicação exata de onde mostrar o produto em uso real nos primeiros 5 segundos. Briefing da marca: [COLE O BRIEFING].',
      },
      {
        code: 'Prompt 12',
        title: 'Gerador de 10 Ganchos de 3 Segundos sem Sensacionalismo',
        whenToUse: 'Para gravar 3 aberturas diferentes para o mesmo vídeo UGC ou corte curto.',
        body: 'Crie 10 opções de gancho de até 10 palavras para abrir um vídeo curto sobre [PRODUTO OU TEMA]. Divida em: 4 ganchos de dor cotidiana real, 3 ganchos de demonstração visual imediata e 3 ganchos de comparação prática. Proibido usar promessas falsas ou frases gastas de internet.',
      },
      {
        code: 'Prompt 13',
        title: 'Seleção de Cortes de Alto Potencial a Partir de Transcrição',
        whenToUse: 'Quando você recebe uma palestra ou podcast longo para transformar em Reels/Shorts.',
        body: 'Leia a transcrição abaixo e selecione os 5 trechos com maior potencial de retenção para cortes verticais de 35 a 60 segundos. Para cada trecho, informe: frase exata de abertura, frase de fechamento, título sugerido na tela (máximo 5 palavras) e motivo pelo qual alguém assistiria até o fim. Transcrição: [COLE A TRANSCRIÇÃO].',
      },
      {
        code: 'Prompt 14',
        title: 'Roteiro Narrado para Canal Temático (Sem Aparecer)',
        whenToUse: 'Para produzir vídeos educativos ou tutoriais de ferramentas B2B no YouTube.',
        body: 'Escreva um roteiro completo de [MINUTOS] minutos para vídeo narrado sobre [TEMA]. Estruture com: gancho factual nos primeiros 20 segundos, explicação em 3 passos práticos com exemplos reais, indicação de imagens ou capturas de tela para cada bloco e chamada natural para recurso complementar sem interromper o conteúdo.',
      },
      {
        code: 'Prompt 15',
        title: 'Checklist de Revisão Técnica antes de Entregar Vídeo ao Cliente',
        whenToUse: 'Para revisar cor, legenda, áudio e margem segura antes de subir o arquivo final.',
        body: 'Crie um checklist de conferência final para revisão de vídeos verticais (Reels, TikTok, Shorts e UGC) considerando: margem segura para não cobrir legenda com botões do aplicativo, contraste de texto, volume de voz versus trilha e direitos de uso declarados. Adapte para o meu fluxo usando [FERRAMENTA DE EDIÇÃO].',
      },
    ],
  },
  {
    title: 'Grupo 4 — Precificação, Pacotes de 3 Opções e Negociação sem Desconto Tóxico',
    summary: 'Comandos para montar propostas em 3 degraus, defender valor/hora mínimo e responder pedidos de desconto reduzindo escopo em vez de trabalhar de graça.',
    prompts: [
      {
        code: 'Prompt 16',
        title: 'Engenharia de Oferta em 3 Opções (Entrada, Recomendada e Completa)',
        whenToUse: 'Ao transformar qualquer habilidade em proposta comercial clara.',
        body: 'Estruture o serviço de [DESCREVA O SERVIÇO] em 3 opções comerciais: (1) Entrada simples com escopo reduzido e baixo risco para o cliente testar; (2) Recomendada de alto valor com entrega principal e retorno claro; (3) Pacote completo/ancoragem com acompanhamento recorrente. Sugira faixas de preço coerentes com custo operacional de [SEU CUSTO/HORA MÍNIMA] e explique a lógica de ancoragem.',
      },
      {
        code: 'Prompt 17',
        title: 'Calculadora Textual de Preço Mínimo e Margem Líquida',
        whenToUse: 'Antes de fechar qualquer projeto ou produto para garantir lucro real após taxas.',
        body: 'Calcule o preço mínimo viável para este projeto considerando: [HORAS ESTIMADAS] horas de execução + [HORAS DE REVISÃO E REUNIÃO] horas de gestão, taxa de plataforma ou gateway de [PERCENTUAL]%, impostos de [PERCENTUAL]% e margem de segurança de 20%. Mostre quanto sobra por hora líquida trabalhada em 3 cenários de preço: [VALORES TESTE].',
      },
      {
        code: 'Prompt 18',
        title: 'Resposta Firme para Pedido de Desconto (Troca por Escopo)',
        whenToUse: 'Quando o cliente diz "está caro, faz pela metade" e você quer preservar seu valor/hora.',
        body: 'O cliente respondeu à minha proposta de [VALOR] dizendo: "[COLE A OBJEÇÃO DO CLIENTE]". Escreva 2 opções de resposta educadas e firmes que NÃO baixam o valor da minha hora de trabalho, mas oferecem uma alternativa de entrada reduzindo entregáveis ou dividindo a entrega em duas fases.',
      },
      {
        code: 'Prompt 19',
        title: 'Cláusulas Simples de Escopo e Revisões para Contrato Enxuto',
        whenToUse: 'Para evitar pedidos infinitos de alteração que destroem a rentabilidade do projeto.',
        body: 'Redija em português simples e direto 5 cláusulas práticas para incluir em proposta ou contrato de [SERVIÇO]: definição exata do que está incluso, limite de rodadas de revisão, prazo máximo para o cliente enviar materiais, condição de pagamento e regra para pedidos extras fora do combinado.',
      },
      {
        code: 'Prompt 20',
        title: 'Proposta de Migração de Trabalho Avulso para Recorrência Mensal',
        whenToUse: 'Logo após entregar um primeiro serviço pontual com bom resultado.',
        body: 'Acabei de entregar com sucesso [PROJETO PONTUAL] para o cliente [NICHO]. Escreva uma mensagem de apresentação oferecendo a passagem para um plano mensal contínuo de [VALOR MENSAL], mostrando o que o cliente ganha mantendo consistência e quanto economiza em tempo evitando recomeçar do zero todo mês.',
      },
    ],
  },
  {
    title: 'Grupo 5 — Produtividade, Padronização e Auditoria de Tempo Líquido',
    summary: 'Comandos para transformar tarefas repetidas em procedimentos padrão, auditar horas reais e cortar o que paga pouco.',
    prompts: [
      {
        code: 'Prompt 21',
        title: 'Auditoria de 14 Dias de Ganho Líquido por Hora',
        whenToUse: 'No fim da segunda semana para decidir quais plataformas manter e quais cortar.',
        body: 'Analise meus registros abaixo de 14 dias contendo plataforma, horas reais gastas (incluindo espera e qualificadores), ganho bruto, taxas e custos. Calcule o ganho líquido real por hora de cada frente, ordene da mais rentável para a pior e recomende objetivamente o que devo cortar na próxima semana. Dados: [COLE SUA TABELA].',
      },
      {
        code: 'Prompt 22',
        title: 'Criação de Procedimento Padrão (SOP) em 1 Página',
        whenToUse: 'Quando você executa a mesma entrega mais de 3 vezes e quer ganhar velocidade.',
        body: 'Transforme as etapas soltas abaixo em um procedimento operacional enxuto de 1 página para eu seguir toda vez que executar [TAREFA]. Organize em: Pré-requisitos | Passo a passo numerado | Pontos de conferência rápida | Tempo alvo por etapa. Etapas atuais: [DESCREVA COMO FAZ HOJE].',
      },
      {
        code: 'Prompt 23',
        title: 'Planejamento Semanal Baseado em Blocos de Energia',
        whenToUse: 'Aos domingos para encaixar projetos extras sem destruir descanso ou emprego principal.',
        body: 'Tenho [HORAS DISPONÍVEIS] horas livres nesta semana nos seguintes horários: [LISTE SEUS HORÁRIOS]. Preciso dividir esse tempo entre [FRENTE PRINCIPAL] e [FRENTE SECUNDÁRIA]. Monte um cronograma realista separando blocos de foco profundo (produção e testes) de blocos leves (prospecção e organização administrativa).',
      },
      {
        code: 'Prompt 24',
        title: 'Banco de Respostas Rápidas para Atendimento ao Cliente',
        whenToUse: 'Para responder dúvidas frequentes de clientes com agilidade sem perder clareza.',
        body: 'Com base nas minhas 8 dúvidas mais recebidas abaixo, crie um banco de respostas curtas e humanas para WhatsApp e e-mail. Cada resposta deve ter no máximo 3 frases e encaminhar claramente para a próxima ação. Dúvidas: [LISTE AS DÚVIDAS].',
      },
      {
        code: 'Prompt 25',
        title: 'Revisão Mensal de Meta e Reserva de Evolução',
        whenToUse: 'No último dia do mês junto com a Planilha Impressa 3 deste livro.',
        body: 'Aqui está meu fechamento do mês: faturamento bruto [VALOR], taxas e câmbio [VALOR], custos operacionais [VALOR], horas totais trabalhadas [HORAS]. Avalie meu resultado com realismo, calcule quanto destinar para a Reserva de Evolução (entre 20% e 30% do líquido) e defina 3 prioridades concretas para os próximos 30 dias.',
      },
    ],
  },
];

function renderPromptsHtml(isPrint: boolean): string {
  return PROMPT_GROUPS.map((group) => {
    const cards = group.prompts
      .map((item) => {
        if (isPrint) {
          return `
            <div class="entry">
              <h4>${escapeHtml(item.code)} — ${escapeHtml(item.title)}</h4>
              <p class="meta"><strong>Quando usar:</strong> ${escapeHtml(item.whenToUse)}</p>
              <p><strong>Texto copiável:</strong> &ldquo;${escapeHtml(item.body)}&rdquo;</p>
            </div>
          `.trim();
        }
        return `
          <div class="entry">
            <h4>${escapeHtml(item.code)} — ${escapeHtml(item.title)}</h4>
            <p class="meta"><strong>Quando usar:</strong> ${escapeHtml(item.whenToUse)}</p>
            <p><em>Texto para copiar:</em></p>
            <p>${escapeHtml(item.body)}</p>
          </div>
        `.trim();
      })
      .join('\n');

    return `
      <section>
        <h3>${escapeHtml(group.title)}</h3>
        <p>${escapeHtml(group.summary)}</p>
        ${cards}
      </section>
    `.trim();
  }).join('\n<hr />\n');
}

function buildChapter11(): BookChapterPayload {
  const intro = `
    <p>Inteligência artificial não substitui critério humano, mas corta pela metade o tempo gasto em tarefas mecânicas: estruturar propostas, revisar clareza em outro idioma, organizar briefings e auditar horas trabalhadas. Quem usa IA como assistente disciplinado entrega mais rápido sem perder autenticidade.</p>
    <p>Os <strong>25 prompts copiáveis</strong> abaixo foram testados para situações reais de trabalho. Troque apenas os trechos entre colchetes pelos seus dados reais e nunca cole dados bancários, senhas ou documentos sigilosos de terceiros em ferramentas públicas.</p>
  `.trim();

  const languageGuide = `
    <section>
      <h3>Guia Prático de Idiomas para Multiplicar Ganhos em Dólar e Euro</h3>
      <p>Esperar fluência perfeita para trabalhar em plataformas internacionais custa caro: o mesmo serviço que paga em reais no mercado local costuma pagar de 3 a 5 vezes mais quando contratado em dólar ou euro. Na prática diária, você não precisa falar como um nativo; precisa de <strong>inglês funcional</strong> para entender instruções técnicas, confirmar prazos e relatar entregas com clareza.</p>
      <h4>1. O Método Cor-a-Cor na Prática</h4>
      <p>Em vez de decorar listas soltas de palavras ou travar tentando traduzir palavra por palavra mentalmente, o <strong>método cor-a-cor</strong> do Portal NKL associa blocos inteiros de sentido entre a frase em inglês e sua equivalente direta em português. Quando você lê blocos completos ligados por função (sujeito, ação, objeto, prazo), seu cérebro passa a reconhecer estruturas reais de e-mail, rubrica e briefing em poucos dias.</p>
      <div class="callout">
        <p><strong>Exemplos práticos de trabalho (estrutura direta):</strong></p>
        <ul>
          <li><strong>I received the briefing and will send the first draft tomorrow.</strong><br />Eu recebi o briefing e vou enviar o primeiro rascunho amanhã.</li>
          <li><strong>Could you confirm the deadline and the expected format?</strong><br />Você poderia confirmar o prazo final e o formato esperado?</li>
          <li><strong>The file is ready. Please let me know if you need any adjustments.</strong><br />O arquivo está pronto. Por favor, me avise se precisar de algum ajuste.</li>
          <li><strong>I checked the guidelines and fixed the two issues we discussed.</strong><br />Eu conferi as diretrizes e corrigi os dois pontos que conversamos.</li>
        </ul>
      </div>
      <h4>2. Rotina de Tradução Assistida sem Soar Robótico</h4>
      <ol>
        <li><strong>Leia primeiro no idioma original:</strong> tente captar o pedido principal (o que entregar, em qual formato e até quando) antes de traduzir tudo.</li>
        <li><strong>Escreva sua resposta em português direto:</strong> frases curtas, uma ideia por linha, sem gírias regionais.</li>
        <li><strong>Use tradução assistida e valide de volta:</strong> passe para o inglês, traduza o resultado de volta para o português e confira se o sentido continuou exato.</li>
        <li><strong>Salve 10 frases-modelo de trabalho:</strong> confirmação de recebimento, pedido de prazo, envio de entrega e confirmação de pagamento.</li>
      </ol>
      <h4>3. Onde Praticar Gratuitamente no Portal NKL</h4>
      <ul>
        <li><strong>Central de Idiomas (visão geral e guias):</strong> https://nkloficial.com.br/idiomas</li>
        <li><strong>Guia de Inglês com método cor-a-cor e plano de 90 dias:</strong> https://nkloficial.com.br/blog/aprender/ingles</li>
        <li><strong>Trilhas abertas adicionais:</strong> /blog/aprender/espanhol, /blog/aprender/frances, /blog/aprender/italiano, /blog/aprender/alemao e /blog/aprender/chines</li>
      </ul>
    </section>
  `.trim();

  return {
    id: 'cap-11',
    tocLabel: 'Capítulo 11 — Acelerador com IA e Idiomas Estratégicos',
    title: 'Capítulo 11: Acelerador com Inteligência Artificial e Idiomas Estratégicos',
    subtitle: '25 prompts copiáveis em 5 blocos operacionais e o guia funcional de idiomas para faturar em moeda forte.',
    htmlKindle: `
      ${intro}
      <hr />
      ${renderPromptsHtml(false)}
      <hr />
      ${languageGuide}
    `.trim(),
    htmlPrint: `
      ${intro}
      <hr />
      ${renderPromptsHtml(true)}
      <hr />
      ${languageGuide}
    `.trim(),
  };
}

function buildFieldDiaryRowsPrint(): string {
  return Array.from({ length: 14 }, (_, index) => {
    const day = String(index + 1).padStart(2, '0');
    return `
      <tr>
        <td>Dia ${day}</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td>[ ] Manter &nbsp; [ ] Ajustar &nbsp; [ ] Cortar</td>
      </tr>
    `.trim();
  }).join('\n');
}

function buildConsistencyGridPrint(): string {
  const rows: string[] = [];
  for (let start = 1; start <= 30; start += 6) {
    const cells: string[] = [];
    for (let day = start; day < start + 6; day += 1) {
      const label = String(day).padStart(2, '0');
      cells.push(`<td><strong>Dia ${label}</strong><br />[ ] Feito &nbsp; ___ min</td>`);
    }
    rows.push(`<tr>${cells.join('')}</tr>`);
  }
  return rows.join('\n');
}

function buildRuledLinesPrint(count: number): string {
  return Array.from({ length: count }, () => '<div class="ruled-line">&nbsp;</div>').join('\n');
}

function buildChapter12(): BookChapterPayload {
  const timelineHtml = `
    <p>Informação sem ritmo vira acúmulo. Este plano divide seus próximos 90 dias em três blocos de 4 semanas para que você saia da fase de testes dispersos e chegue ao fim do trimestre com rotina estável, caixa controlado e pelo menos uma frente principal validada.</p>
    <section>
      <h3>Semanas 1–4: Base e Primeiros Recebimentos</h3>
      <ul>
        <li><strong>Semana 1 (Infraestrutura enxuta):</strong> escolha 1 frente de investimento zero (ou no máximo 2 complementares), configure conta Wise/Payoneer, organize seu currículo ou portfólio mínimo e leia todas as regras de uso antes de executar.</li>
        <li><strong>Semana 2 (Primeiras entregas e Diário de Campo):</strong> realize as primeiras triagens e tarefas pagas. Preencha o Diário de Campo de 14 Dias todos os dias anotando minutos reais gastos, incluindo espera e cadastro.</li>
        <li><strong>Semana 3 (Corte rápido):</strong> faça a primeira auditoria de ganho líquido por hora. Qualquer plataforma que consumiu tempo alto com aprovação baixa ou pagamento travado vai para a lista de corte.</li>
        <li><strong>Semana 4 (Primeiro fechamento):</strong> conclua seu primeiro saque real, registre taxas de conversão e confirme quanto sobrou líquido por hora trabalhada.</li>
      </ul>
    </section>
    <section>
      <h3>Semanas 5–8: Padronização e Aumento do Valor/Hora</h3>
      <ul>
        <li><strong>Semana 5 (Checklists e modelos):</strong> transforme o que deu resultado no mês 1 em roteiros repetíveis usando os prompts do Capítulo 11 para ganhar velocidade sem perder qualidade.</li>
        <li><strong>Semana 6 (Empacotamento em 3 opções):</strong> se você presta serviços, edita vídeos, ensina ou produz UGC, organize sua oferta nos 3 degraus descritos no Capítulo 10.</li>
        <li><strong>Semana 7 (Prospecção direta sem anúncios):</strong> reserve 3 blocos semanais para abordar clientes reais ou enviar propostas no Upwork/Fiverr com amostra personalizada.</li>
        <li><strong>Semana 8 (Revisão de tarifa):</strong> após acumular provas e avaliações reais, reajuste sua opção de entrada para novos clientes em 20% a 30% e separe a Reserva de Evolução.</li>
      </ul>
    </section>
    <section>
      <h3>Semanas 9–12: Transição para Ativos ou Negócio Próprio</h3>
      <ul>
        <li><strong>Semana 9 (Alocação consciente da reserva):</strong> invista parte da Reserva de Evolução em um ativo que reduza dependência de horas (domínio próprio, ferramenta de automação, microfone melhor ou publicação estruturada).</li>
        <li><strong>Semana 10 (Recorrência ou catálogo):</strong> converta clientes pontuais em contratos mensais ou publique a segunda e terceira peça do seu catálogo digital (KDP, templates, guias ou vídeos).</li>
        <li><strong>Semana 11 (Delegação de atrito ou automação):</strong> automatize respostas iniciais, agendamentos e controles financeiros simples para liberar horas de produção nobre.</li>
        <li><strong>Semana 12 (Auditoria do ciclo de 90 dias):</strong> compare seu ganho por hora do Dia 1 com o Dia 90, defina a meta dos próximos 3 meses e consolide apenas o que provou retorno consistente.</li>
      </ul>
    </section>
  `.trim();

  const kindleWorkbook = `
    <hr />
    <section>
      <h3>Caderno Digital de Execução (Versão Kindle)</h3>
      <p>Para preencher no aplicativo Kindle (destaque ou nota), em um caderno comum ou em planilha própria:</p>
      <h4>Registro 1 — Diário de Campo de 14 Dias</h4>
      <p>Crie 14 linhas numeradas de Dia 01 a Dia 14 com estes 4 campos por linha:</p>
      <table>
        <thead>
          <tr>
            <th>Campo</th>
            <th>O que anotar no mesmo dia</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Plataforma / Frente</strong></td>
            <td>Nome exato da plataforma, cliente ou projeto trabalhado.</td>
          </tr>
          <tr>
            <td><strong>2. Horas Reais</strong></td>
            <td>Tempo total do início ao fim, incluindo testes e ajustes.</td>
          </tr>
          <tr>
            <td><strong>3. Ganho Líquido</strong></td>
            <td>Valor convertido já descontando taxas de saque e despesas.</td>
          </tr>
          <tr>
            <td><strong>4. Decisão</strong></td>
            <td>Manter, ajustar processo ou cortar na próxima semana.</td>
          </tr>
        </tbody>
      </table>

      <h4>Registro 2 — Rastreador de Consistência de 30 Dias</h4>
      <p>Defina um bloco fixo mínimo (ex.: 45 minutos por dia, 5 dias por semana). Marque ao fim de cada semana:</p>
      <ul>
        <li><strong>Semana 1 (Dias 01–07):</strong> ___ blocos concluídos | Principal aprendizado: ________________</li>
        <li><strong>Semana 2 (Dias 08–14):</strong> ___ blocos concluídos | O que cortar agora: _________________</li>
        <li><strong>Semana 3 (Dias 15–21):</strong> ___ blocos concluídos | Melhor frente da semana: _____________</li>
        <li><strong>Semana 4 (Dias 22–30):</strong> ___ blocos concluídos | Meta atingida (Sim/Não): ___________</li>
      </ul>

      <h4>Registro 3 — Fechamento Financeiro Mensal e Reserva de Evolução</h4>
      <table>
        <thead>
          <tr>
            <th>Linha de Controle</th>
            <th>Fórmula ou Regra</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Faturamento Bruto</strong></td>
            <td>Soma de tudo o que entrou no mês antes de descontos.</td>
          </tr>
          <tr>
            <td><strong>Taxas de Plataforma e Câmbio</strong></td>
            <td>Comissões retidas + custo de conversão/spread Wise ou Payoneer.</td>
          </tr>
          <tr>
            <td><strong>Custo Operacional Direto</strong></td>
            <td>Assinaturas de ferramentas, internet proporcional, materiais ou envios.</td>
          </tr>
          <tr>
            <td><strong>Lucro Líquido Real</strong></td>
            <td>Bruto menos taxas e custos operacionais.</td>
          </tr>
          <tr>
            <td><strong>Reserva de Evolução (20%–30%)</strong></td>
            <td>Parte separada exclusivamente para equipamentos, domínio ou capital de giro.</td>
          </tr>
        </tbody>
      </table>

      <h4>Perguntas de Reflexão do Ciclo (Caderno Digital)</h4>
      <ol>
        <li>Qual frente entregou o maior ganho líquido por hora real neste mês?</li>
        <li>Qual atividade consumiu energia emocional ou horas extras sem retorno proporcional?</li>
        <li>Qual única melhoria técnica ou comercial aumenta meu valor/hora nos próximos 30 dias?</li>
        <li>Se eu só pudesse manter duas frentes no próximo trimestre, quais permaneceriam?</li>
      </ol>
    </section>
  `.trim();

  const printWorkbook = `
    <hr />
    <div class="worksheet">
      <h3>Planilha Impressa 1: Diário de Campo de 14 Dias</h3>
      <p>Preencha à caneta logo após encerrar o bloco diário. Não arredonde horas para baixo: honestidade nos dados acelera suas decisões.</p>
      <table class="worksheet-table">
        <thead>
          <tr>
            <th>Dia</th>
            <th>Plataforma / Frente</th>
            <th>Horas Reais</th>
            <th>Ganho Líquido</th>
            <th>Decisão</th>
          </tr>
        </thead>
        <tbody>
          ${buildFieldDiaryRowsPrint()}
        </tbody>
      </table>
      <p><strong>Resumo dos 14 Dias:</strong> Total de horas: _______ h | Ganho líquido acumulado: R$ __________ | Ganho líquido por hora: R$ __________/h</p>
    </div>

    <div class="worksheet">
      <h3>Planilha Impressa 2: Rastreador de Consistência de 30 Dias</h3>
      <p>Defina sua meta diária em minutos antes de começar (ex.: 45 min/dia): <strong>Meta diária: _____ min</strong>. Marque cada quadrinho somente após concluir o bloco completo.</p>
      <table class="worksheet-table">
        <tbody>
          ${buildConsistencyGridPrint()}
        </tbody>
      </table>
      <p><strong>Dias concluídos no mês:</strong> _____ / 30 | <strong>Maior obstáculo encontrado:</strong> ________________________________________________</p>
    </div>

    <div class="worksheet">
      <h3>Planilha Impressa 3: Fechamento Financeiro Mensal e Reserva de Evolução</h3>
      <p>Use esta folha no último dia de cada mês antes de gastar o saldo gerado pela renda extra.</p>
      <table class="worksheet-table">
        <thead>
          <tr>
            <th>Item Financeiro</th>
            <th>Mês 1 (R$)</th>
            <th>Mês 2 (R$)</th>
            <th>Mês 3 (R$)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Faturamento Bruto Total</strong></td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
          <tr>
            <td><strong>2. Taxas de Plataforma e Câmbio</strong></td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
          <tr>
            <td><strong>3. Custo Operacional (ferramentas / insumos)</strong></td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
          <tr>
            <td><strong>4. Ganho Líquido Real (1 - 2 - 3)</strong></td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
          <tr>
            <td><strong>5. Reserva de Evolução / Reinvestimento (20% a 30%)</strong></td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
          <tr>
            <td><strong>6. Saldo Livre para Uso Pessoal (4 - 5)</strong></td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
        </tbody>
      </table>
      <p><strong>Destino escolhido para a Reserva de Evolução no próximo mês:</strong> ____________________________________________________________</p>
    </div>

    <div class="worksheet">
      <h3>Páginas de Anotações Pautadas — Metas, Clientes e Aprendizados</h3>
      <p><strong>Minhas 3 metas concretas para os próximos 90 dias (prazo e valor claro):</strong></p>
      ${buildRuledLinesPrint(6)}
      <p><strong>Lista de clientes-alvo, plataformas prioritárias e ajustes que funcionaram:</strong></p>
      ${buildRuledLinesPrint(10)}
      <p><strong>Lições do trimestre (o que cortar definitivamente e o que dobrar de foco):</strong></p>
      ${buildRuledLinesPrint(10)}
    </div>
  `.trim();

  return {
    id: 'cap-12',
    tocLabel: 'Capítulo 12 — Plano Mestre de 30, 60 e 90 Dias + Caderno',
    title: 'Capítulo 12: Plano Mestre de 30, 60 e 90 Dias + Caderno de Execução',
    subtitle: 'Cronograma progressivo em 12 semanas e planilhas físicas de registro para acompanhar horas reais e evolução.',
    htmlKindle: `
      ${timelineHtml}
      ${kindleWorkbook}
    `.trim(),
    htmlPrint: `
      ${timelineHtml}
      ${printWorkbook}
    `.trim(),
  };
}

const GLOSSARY_ENTRIES: readonly GlossaryEntry[] = [
  {
    term: 'CPA',
    expanded: 'Cost Per Action (Custo por Ação Qualificada)',
    meaning: 'Modelo de comissão em que você recebe um valor fixo quando o usuário indicado completa uma ação específica exigida pelo anunciante (como abrir conta e validar documentos).',
    inPractice: 'Exige atenção redobrada às regras da campanha: cliques sem conclusão da ação qualificada não geram pagamento.',
  },
  {
    term: 'UGC',
    expanded: 'User-Generated Content (Conteúdo Gerado pelo Usuário)',
    meaning: 'Vídeos curtos ou fotos gravados com estética autêntica de consumidor real para que marcas publiquem em redes sociais ou anúncios.',
    inPractice: 'Você não precisa ter milhares de seguidores; o contratante paga pela qualidade do roteiro, áudio limpo, luz natural e demonstração crível.',
  },
  {
    term: 'QA',
    expanded: 'Quality Assurance (Garantia e Testes de Qualidade)',
    meaning: 'Atividade de testar sites, sistemas ou aplicativos antes ou depois do lançamento para encontrar falhas visuais, erros de cálculo ou travamentos.',
    inPractice: 'Em plataformas como uTest e Testlio, ganha mais quem reproduz o erro passo a passo e envia evidência limpa (vídeo e log).',
  },
  {
    term: 'SERP',
    expanded: 'Search Engine Results Page (Página de Resultados de Busca)',
    meaning: 'A lista de resultados exibida por buscadores como Google ou Bing quando alguém digita uma pesquisa.',
    inPractice: 'Avaliadores de busca analisam se os primeiros resultados da SERP realmente respondem à intenção de quem pesquisou.',
  },
  {
    term: 'Payout',
    expanded: 'Pagamento / Liberação de Saque',
    meaning: 'Momento ou regra em que o saldo aprovado na plataforma é transferido para sua conta bancária ou carteira digital.',
    inPractice: 'Sempre confira o valor mínimo de payout, a periodicidade (semanal, quinzenal ou mensal) e quais moedas estão disponíveis antes de começar.',
  },
  {
    term: 'Spread',
    expanded: 'Margem Cambial na Conversão de Moeda',
    meaning: 'Diferença entre a cotação comercial da moeda (dólar ou euro) e a taxa final aplicada pelo banco ou carteira ao converter para reais.',
    inPractice: 'Bancos tradicionais costumam cobrar spread elevado; contas internacionais como Wise e Payoneer preservam parte relevante do seu ganho líquido.',
  },
  {
    term: 'Royalties KDP',
    expanded: 'Percentual de Direitos Autorais no Kindle Direct Publishing',
    meaning: 'Parcela que a Amazon paga ao autor por cada venda de e-book (geralmente 35% ou 70% conforme faixa de preço e país) ou de livro impresso (60% menos o custo gráfico).',
    inPractice: 'Defina preços dentro da faixa elegível a 70% em e-books e confira sempre o custo de impressão antes de fechar a diagramação do livro físico.',
  },
  {
    term: 'SLA',
    expanded: 'Service Level Agreement (Acordo de Prazo e Entrega)',
    meaning: 'Compromisso claro sobre o tempo máximo de resposta, prazo de entrega e padrão mínimo esperado em um serviço contratado.',
    inPractice: 'Combinar SLA por escrito (ex.: retorno em até 4 horas úteis e entrega em 5 dias) evita desgaste e transmite profissionalismo imediato.',
  },
  {
    term: 'Retenção',
    expanded: 'Permanência de Atenção ou Permanência de Cliente',
    meaning: 'Em vídeos, mede quantos segundos as pessoas assistem antes de sair; em negócios recorrentes, mede quantos meses um cliente continua pagando.',
    inPractice: 'Subir 15% na retenção dos primeiros 3 segundos de um vídeo ou manter um cliente mensal por 6 meses vale mais do que correr atrás de contatos novos todo dia.',
  },
];

function buildAppendixReader(): BookChapterPayload {
  const glossaryHtml = GLOSSARY_ENTRIES.map(
    (entry) => `
      <div class="entry">
        <h4>${escapeHtml(entry.term)} — ${escapeHtml(entry.expanded)}</h4>
        <p><strong>O que significa na prática:</strong> ${escapeHtml(entry.meaning)}</p>
        <p><strong>Como afeta o seu caixa:</strong> ${escapeHtml(entry.inPractice)}</p>
      </div>
    `.trim(),
  ).join('\n');

  const liveCatalogsHtml = `
    <section>
      <h3>Como Usar os Catálogos Vivos do Portal NKL</h3>
      <p>Plataformas digitais mudam requisitos de país, valores mínimos de saque e critérios de admissão ao longo do ano. Enquanto este livro entrega a base metodológica, os prompts, as planilhas e o raciocínio comercial que não envelhecem, o Portal NKL mantém três endereços vivos atualizados continuamente:</p>
      <div class="entry">
        <h4>1. Catálogo Vivo de Programas e Plataformas</h4>
        <p><strong>Endereço:</strong> https://nkloficial.com.br/programas</p>
        <p><strong>Como usar:</strong> filtre por exigência de investimento zero ou inicial, confira prós, contras, meios de recebimento aceitos no Brasil e data da última verificação editorial antes de abrir conta em qualquer plataforma nova.</p>
      </div>
      <div class="entry">
        <h4>2. Trilhas de Idiomas Estratégicos (Método Cor-a-Cor)</h4>
        <p><strong>Endereço:</strong> https://nkloficial.com.br/idiomas</p>
        <p><strong>Como usar:</strong> acesse os guias gratuitos de inglês, espanhol, francês, italiano, alemão e chinês para destravar leitura de briefings, entrevistas e comunicação profissional em moeda forte.</p>
      </div>
      <div class="entry">
        <h4>3. Bússola de Negócios Interativa</h4>
        <p><strong>Endereço:</strong> https://nkloficial.com.br/ofertas/bussola-negocios</p>
        <p><strong>Como usar:</strong> responda às perguntas sobre capital disponível, horas livres na semana, perfil técnico, tolerância a risco e conforto com câmera ou clientes para ranquear automaticamente os 3 modelos mais compatíveis com o seu momento atual entre os 18 listados no Capítulo 10.</p>
      </div>
      <div class="callout">
        <p><strong>Nota final de atualização:</strong> sempre que encontrar uma mudança de regra ou novo link útil durante sua execução, confira primeiro o catálogo em <strong>https://nkloficial.com.br/programas</strong> antes de investir tempo em testes desatualizados.</p>
      </div>
    </section>
  `.trim();

  const body = `
    <section>
      <h3>Glossário Prático sem Jargão Confuso</h3>
      <p>Termos em inglês e siglas técnicas costumam afastar quem está começando. Abaixo estão os nove termos mais comuns deste mercado traduzidos para o impacto real no seu trabalho e no seu dinheiro:</p>
      ${glossaryHtml}
    </section>
    <hr />
    ${liveCatalogsHtml}
  `.trim();

  return {
    id: 'appendix-reader',
    tocLabel: 'Apêndice — Glossário Prático e Acesso Complementar do Leitor',
    title: 'Apêndice e Acesso Complementar do Leitor',
    subtitle: 'Termos técnicos traduzidos para o dia a dia e rotas vivas do Portal NKL para checar atualizações.',
    htmlKindle: body,
    htmlPrint: body,
  };
}

/** Builds Chapters 10–12 and the reader appendix from the 18 business profiles. */
export function buildScaleChapters(profiles: readonly BookBusinessProfileRow[]): BookChapterPayload[] {
  return [
    buildChapter10(profiles),
    buildChapter11(),
    buildChapter12(),
    buildAppendixReader(),
  ];
}
