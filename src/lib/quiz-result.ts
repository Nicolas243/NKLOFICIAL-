import type { CalculatedQuizProfile } from '@/db/schema';
import type { BusinessProfile } from './quiz-engine';

export type QuizBusinessResult = {
  name: string;
  whyItFits?: string;
  actionPlan3Steps: [string, string, string];
};

export type QuizResult = {
  archetype: string;
  diagnosticTitle?: string;
  diagnosticHeadline?: string;
  diagnosticSource?: '9router' | 'openai' | 'fallback';
  analysis: string;
  strengths?: string[];
  watchouts?: string[];
  firstWeekFocus?: string;
  profile: CalculatedQuizProfile;
  top3Businesses: QuizBusinessResult[];
};

const PROFILE_PLAYBOOKS: Readonly<Record<string, [string, string, string]>> = {
  'Avaliação de IA e dados': [
    'Crie conta nas plataformas verificadas sem investimento (Outlier, Micro1, DataAnnotation ou Claru) com perfil sincero de idiomas e habilidades.',
    'Reserve 4 a 6 horas na primeira semana para passar nas avaliações iniciais seguindo os critérios exatos em inglês/português.',
    'Registre ganhos por hora efetiva durante 14 dias antes de concentrar seu tempo em uma plataforma só.',
  ],
  'Testes de usabilidade': [
    'Cadastre-se na uTest, Testlio ou UserTesting configurando microfone limpo e dispositivos disponíveis (celular + desktop).',
    'Complete os testes de prática (Sandbox) para liberar os primeiros convites pagos de erro visual e fluxo.',
    'Crie um bloco recorrente de 30 minutos para responder convites rápido, pois vagas abrem por ordem de resposta.',
  ],
  'Produção de conteúdo UGC': [
    'Grave 3 vídeos curtos de demonstração (15 a 30s) usando produtos que você já tem em casa com boa luz natural.',
    'Cadastre esse mini-portfólio na Billo, JoinBrands, UGC Roster ou abordagens diretas para lojas locais.',
    'Organize roteiro padrão (gancho em 3s, problema real, uso prático) para manter entregas previsíveis.',
  ],
  'Afiliados e aquisição de tráfego': [
    'Ative cadastros gratuitos em Amazon Associados, Mercado Livre e Shopee para testar recomendações reais antes de investir em mídia.',
    'Escolha um nicho específico (ex.: acessórios musicais, setup de trabalho, organização financeira) em vez de postar links aleatórios.',
    'Acompanhe taxa de cliques por link e só impulsione com verba depois de validar demanda orgânica.',
  ],
  'Serviços digitais especializados': [
    'Defina uma entrega clara e fechada (ex.: revisão de textos, configuração de planilhas, edição ou suporte técnico) com prazo definido.',
    'Prepare 2 amostras reais curtas e apresente sua oferta no Upwork, Fiverr ou para contatos diretos sem texto genérico.',
    'Documente seu processo em um checklist para entregar rápido e ganhar avaliações 5 estrelas nos primeiros trabalhos.',
  ],
  'Comunidade e produtos digitais': [
    'Valide uma dor específica respondendo dúvidas reais em comunidades antes de gravar ou diagramar um material longo.',
    'Lance uma primeira versão enxuta (guia prático ou pack de templates) no Gumroad ou página própria sem gasto pesado.',
    'Use feedback dos primeiros 10 compradores para melhorar o produto e criar versões complementares.',
  ],
  'Publicação de e-books e livros na Amazon KDP': [
    'Escolha um tema prático e bem delimitado onde um guia claro economiza horas do leitor (sem depender de promessas irreais).',
    'Gere e revise ambos os formatos — Kindle reflowable e impresso 6x9" — cuidando da capa, margem e amostra gratuita.',
    'Publique no Amazon KDP com palavras-chave precisas e use os primeiros leitores para ajustar descrição e sumário.',
  ],
  'Edição de vídeos curtos e cortes com IA': [
    'Selecione um podcast ou aula longa pública e crie 3 cortes verticais demonstrativos com legenda dinâmica (OpusClip/CapCut).',
    'Envie esses 3 exemplos prontos para criadores médios ou professores locais oferecendo pacote mensal de 15 a 20 cortes.',
    'Padronize o fluxo (corte -> revisão humana de legenda -> envio em pasta compartilhada) para manter tempo de entrega baixo.',
  ],
  'Automação e assistentes de IA para pequenos negócios': [
    'Mapeie 1 processo repetitivo comum em negócios locais (agendamento no WhatsApp, triagem de orçamento ou resposta de FAQ).',
    'Monte um protótipo funcional usando Make ou n8n conectado a uma planilha e teste com dados fictícios seguros.',
    'Apresente a demonstração de 3 minutos para 5 empresas da sua cidade cobrando implantação + acompanhamento mensal.',
  ],
  'Loja de templates e produtos digitais': [
    'Identifique uma planilha, planner ou dashboard no Notion que resolve um problema real que você mesmo já testou.',
    'Crie capturas reais e um vídeo curto mostrando o template funcionando na prática antes de abrir a loja no Gumroad/Etsy.',
    'Aplique feedback das primeiras vendas para lançar pacotes temáticos de maior valor agregado.',
  ],
  'Gestão de tráfego pago para negócios locais': [
    'Estruture primeiro um teste controlado pequeno (R$ 150–300) ou caso modelo para dominar conversão local e Google Meu Negócio.',
    'Escolha 1 tipo de negócio físico (clínicas, oficinas, escolas) com ticket suficiente para pagar o investimento de mídia.',
    'Entregue relatório semanal simples mostrando ligações/mensagens geradas em vez de métricas de vaidade.',
  ],
  'Print on Demand e marca própria sem estoque': [
    'Pesquise um nicho específico de identidade (músicos, profissões, hobbies) e crie 5 estampas limpas em 300 DPI.',
    'Conecte Printful ou Printify a uma vitrine enxuta calculando frete, câmbio e taxa antes de definir o preço.',
    'Peça uma amostra física ou valide interesse orgânico em redes curtas antes de escalar anúncios pagos.',
  ],
  'Revenda e arbitragem em marketplaces (Walmart / Amazon / ML)': [
    'Analise margem líquida descontando comissão do marketplace, frete, devolução média e impostos antes de comprar qualquer lote.',
    'Regularize documentação fiscal/comercial exigida pela plataforma escolhida e comece com giro de teste pequeno.',
    'Acompanhe estoque parado semanalmente para nunca imobilizar todo o capital em um único SKU.',
  ],
  'Canal temático e vídeos com IA (monetização + afiliados)': [
    'Defina 1 tema educacional ou de curiosidades com alta busca recorrente e monte roteiros claros revisados por humanos.',
    'Use áudio e visuais com IA sem violar direitos autorais e combine monetização de plataforma com links úteis/afiliados na descrição.',
    'Mantenha consistência mínima semanal por 12 semanas para ler retenção e replicar só o que o público termina de assistir.',
  ],
  'Aulas particulares, mentoria e consultoria prática': [
    'Empacote sua habilidade em sessões de 50 minutos com objetivo claro para a primeira aula (ex.: destravar iniciantes).',
    'Configure agenda simples, página de apresentação e material rápido de apoio para enviar após a primeira conversa.',
    'Colete depoimentos honestos dos primeiros alunos para gerar indicações orgânicas.',
  ],
  'Micro-SaaS e ferramentas digitais recorrentes': [
    'Valide uma dor específica conversando com 10 profissionais do setor antes de escrever semanas de código complexo.',
    'Construa um MVP enxuto com uma única funcionalidade que resolve o gargalo principal com cobrança recorrente simples.',
    'Use os primeiros usuários pagantes para priorizar apenas melhorias que reduzem cancelamento.',
  ],
  'Curadoria de compras e afiliado de nicho': [
    'Escolha uma categoria que você conhece na prática (instrumentos, áudio, informática, livros) e compare modelos com honestidade.',
    'Crie comparativos objetivos respondendo dúvidas reais de compra usando links de Amazon Associados, Mercado Livre e Shopee.',
    'Atualize preços e estoque dos links periodicamente para não mandar visitantes para anúncios esgotados.',
  ],
  'Testes de qualidade (QA) e localização multilíngue': [
    'Ative cadastros na OneForma, uTest, Testlio e Appen filtrando projetos compatíveis com português e inglês.',
    'Capriche no preenchimento detalhado de aparelhos, sistemas operacionais e certificações linguísticas no perfil.',
    'Documente bugs com passos reproduzíveis, captura clara e ambiente técnico para subir de nível nos convites.',
  ],
};

function buildStrengths(profile: CalculatedQuizProfile): string[] {
  const strengths: string[] = [];
  if (profile.capital <= 2) {
    strengths.push('Disciplina financeira: você evita comprometer o orçamento fixo antes de validar demanda real.');
  } else {
    strengths.push('Capacidade de aporte controlado: consegue usar ferramentas ou testes pagos para encurtar o caminho.');
  }
  if (profile.tech >= 3.5) {
    strengths.push('Autonomia digital acima da média para configurar ferramentas, prompts e fluxos técnicos.');
  } else {
    strengths.push('Foco em simplicidade operacional: maior facilidade para manter modelos enxutos e diretos.');
  }
  if (profile.social >= 3.5) {
    strengths.push('Desenvoltura para se comunicar, apresentar soluções e criar confiança com clientes ou audiência.');
  } else {
    strengths.push('Perfil focado em execução nos bastidores, ideal para entregas técnicas ou operação silenciosa.');
  }
  return strengths;
}

function buildWatchouts(profile: CalculatedQuizProfile): string[] {
  const watchouts: string[] = [];
  if (profile.time < 2.5) {
    watchouts.push('Agenda apertada: escolha no máximo 1 frente por 30 dias para não dispersar suas horas livres.');
  } else {
    watchouts.push('Excesso de ideias simultâneas: mantenha métricas semanais para não trocar de modelo na segunda semana.');
  }
  if (profile.risk <= 2) {
    watchouts.push('Baixa tolerância a oscilações iniciais: prefira validação de baixo risco e metas de curto ciclo (7 dias).');
  } else {
    watchouts.push('Tolerância maior a risco: defina teto máximo de perda e prazo de corte antes de investir em escala.');
  }
  return watchouts;
}

export function buildDeterministicResult(
  profile: CalculatedQuizProfile,
  businesses: BusinessProfile[],
): QuizResult {
  const archetype = profile.capital <= 2 && profile.risk <= 2
    ? 'Construtor prudente'
    : profile.tech >= 4
      ? 'Operador digital'
      : profile.social >= 4
        ? 'Comunicador de oportunidades'
        : 'Explorador estratégico';

  const primary = businesses[0]?.name ?? 'modelo principal';
  const topNames = businesses.map((item) => item.name).join(', ');
  const analysis = `Seu perfil combina disponibilidade de investimento ${profile.capital.toFixed(1)}/5, tempo ${profile.time.toFixed(1)}/5, domínio técnico ${profile.tech.toFixed(1)}/5, tolerância a risco ${profile.risk.toFixed(1)}/5 e conforto social ${profile.social.toFixed(1)}/5. Os 3 caminhos com maior encaixe real agora são: ${topNames}. Comece pelo primeiro modelo e valide com um ciclo curto de 7 dias antes de aumentar seu compromisso.`;

  return {
    archetype,
    diagnosticTitle: 'Diagnóstico Personalizado · Bússola de Negócios IA',
    diagnosticHeadline: `${archetype}: direção prática focada em ${primary}`,
    diagnosticSource: 'fallback',
    analysis,
    strengths: buildStrengths(profile),
    watchouts: buildWatchouts(profile),
    firstWeekFocus: `Dedique os próximos 7 dias apenas a testar "${primary}" com meta clara de horas e registro dos primeiros resultados reais.`,
    profile,
    top3Businesses: businesses.map((business, index) => ({
      name: business.name,
      whyItFits:
        index === 0
          ? 'Maior compatibilidade geral com seu tempo disponível, investimento inicial e estilo de execução.'
          : 'Alternativa complementar alinhada aos mesmos eixos caso queira testar uma segunda frente.',
      actionPlan3Steps: PROFILE_PLAYBOOKS[business.name] ?? [
        `Leia as regras oficiais e confirme os requisitos atuais para ${business.name}.`,
        'Reserve um teste curto de 7 dias com teto de horas e gasto zero/controlado.',
        'Registre retorno por hora e dificuldades reais antes de decidir continuar.',
      ],
    })),
  };
}
