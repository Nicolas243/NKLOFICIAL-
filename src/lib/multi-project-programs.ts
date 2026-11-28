import { enforceMaxSevenWords } from './micro1-opportunities';

export type CompactProjectItem = {
  id: string;
  summaryPtBr: string;
  payLabel: string;
  href: string;
  trackingId: string;
  shareUrl?: string;
};

export type MultiProjectGroup = {
  heading: string;
  cardHint: string;
  items: readonly CompactProjectItem[];
};

const ALIGNERR_CODING_URL =
  'https://app.alignerr.com/signin?referral-code=5b904321-66d0-4369-bf89-5b230408747a&program=b7f918c0-4ef7-11f1-9dec-3d76718b1a77&referralJobId=f4b9a0e2-e6c2-4388-b01d-b7655b313d9b';
const ALIGNERR_BASE_URL =
  'https://app.alignerr.com/signin?referral-code=5b904321-66d0-4369-bf89-5b230408747a';

const RAW_MULTI_PROJECT_GROUPS: Record<string, MultiProjectGroup> = {
  aligner: {
    heading: 'Projetos e frentes disponíveis na Alligner',
    cardHint: 'Vários projetos e especialidades disponíveis',
    items: [
      {
        id: 'aligner-coding',
        summaryPtBr: 'Programar e revisar agentes de inteligência artificial',
        payLabel: 'US$ 30–80/hora',
        href: ALIGNERR_CODING_URL,
        trackingId: 'aligner-agentic-coding',
        shareUrl: ALIGNERR_CODING_URL,
      },
      {
        id: 'aligner-pt',
        summaryPtBr: 'Avaliar textos e respostas em português',
        payLabel: 'US$ 15–40/hora',
        href: ALIGNERR_BASE_URL,
        trackingId: 'aligner-portugues',
        shareUrl: ALIGNERR_BASE_URL,
      },
      {
        id: 'aligner-audio',
        summaryPtBr: 'Gravar áudios e validar pronúncia natural',
        payLabel: 'US$ 15–35/hora',
        href: ALIGNERR_BASE_URL,
        trackingId: 'aligner-audio',
        shareUrl: ALIGNERR_BASE_URL,
      },
      {
        id: 'aligner-finance',
        summaryPtBr: 'Revisar finanças, lógica e cálculos técnicos',
        payLabel: 'US$ 25–60/hora',
        href: ALIGNERR_BASE_URL,
        trackingId: 'aligner-financas',
        shareUrl: ALIGNERR_BASE_URL,
      },
    ],
  },
  'marketplaces-afiliados': {
    heading: '10 marketplaces para divulgar como afiliado',
    cardHint: '10 programas de afiliados reunidos aqui',
    items: [
      {
        id: 'mkt-ml',
        summaryPtBr: 'Indicar produtos com comissão no Mercado Livre',
        payLabel: 'Até 16% por venda',
        href: 'https://www.mercadolivre.com.br/l/afiliados-home',
        trackingId: 'marketplace-mercado-livre',
      },
      {
        id: 'mkt-shopee',
        summaryPtBr: 'Compartilhar ofertas diárias pela Shopee Afiliados',
        payLabel: 'Até 14% por pedido',
        href: 'https://affiliate.shopee.com.br/',
        trackingId: 'marketplace-shopee',
      },
      {
        id: 'mkt-amazon',
        summaryPtBr: 'Recomendar livros e produtos na Amazon Associados',
        payLabel: 'Até 15% por venda',
        href: 'https://associados.amazon.com.br/',
        trackingId: 'marketplace-amazon-associados',
      },
      {
        id: 'mkt-magalu',
        summaryPtBr: 'Montar vitrine própria no Influenciador Magalu',
        payLabel: 'Até 12% por venda',
        href: 'https://www.magazinevoce.com.br/',
        trackingId: 'marketplace-influenciador-magalu',
      },
      {
        id: 'mkt-aliexpress',
        summaryPtBr: 'Indicar importados e eletrônicos pelo AliExpress',
        payLabel: 'Até 9% por venda',
        href: 'https://portals.aliexpress.com/',
        trackingId: 'marketplace-aliexpress-portals',
      },
      {
        id: 'mkt-shein',
        summaryPtBr: 'Divulgar moda e achados pela Shein Afiliados',
        payLabel: '10% a 20% por pedido',
        href: 'https://affiliate.shein.com/',
        trackingId: 'marketplace-shein',
      },
      {
        id: 'mkt-ebay',
        summaryPtBr: 'Indicar itens globais pelo eBay Partner Network',
        payLabel: 'Comissão em USD',
        href: 'https://partnernetwork.ebay.com/',
        trackingId: 'marketplace-ebay-partner-network',
      },
      {
        id: 'mkt-temu',
        summaryPtBr: 'Divulgar ofertas internacionais como afiliado Temu',
        payLabel: 'Até 20% + bônus',
        href: 'https://www.temu.com/affiliate_recruit.html',
        trackingId: 'marketplace-temu',
      },
      {
        id: 'mkt-etsy',
        summaryPtBr: 'Indicar templates e artesanato na Etsy Affiliates',
        payLabel: '4% em dólar',
        href: 'https://www.etsy.com/affiliates',
        trackingId: 'marketplace-etsy-affiliates',
      },
      {
        id: 'mkt-walmart',
        summaryPtBr: 'Promover ofertas norte-americanas pelo Walmart Affiliates',
        payLabel: 'Até 4% em USD',
        href: 'https://affiliates.walmart.com/',
        trackingId: 'marketplace-walmart-affiliates',
      },
    ],
  },
  'serp-raters-welocalize-telus': {
    heading: 'Frentes disponíveis de avaliação de busca',
    cardHint: '2 plataformas globais reunidas neste guia',
    items: [
      {
        id: 'serp-welocalize',
        summaryPtBr: 'Avaliar resultados de busca na Welocalize',
        payLabel: 'US$ 12–18/hora',
        href: 'https://jobs-lever-co.translate.goog/weloglobal?department=Welocalize&_x_tr_sl=en&_x_tr_tl=pt&_x_tr_hl=pt-BR',
        trackingId: 'serp-welocalize',
      },
      {
        id: 'serp-telus',
        summaryPtBr: 'Classificar anúncios e mapas na TELUS Digital',
        payLabel: 'US$ 12–16/hora',
        href: 'https://www.telusdigital.com/careers',
        trackingId: 'serp-telus',
      },
    ],
  },
  'entrevistas-b2b-respondent-user-interviews': {
    heading: 'Projetos e indicações na Respondent e User Interviews',
    cardHint: '3 frentes de entrevistas B2B com bônus em dólar',
    items: [
      {
        id: 'b2b-respondent-cadastro',
        summaryPtBr: 'Criar conta Respondent e ganhar em entrevistas',
        payLabel: 'US$ 50–250/sessão (+US$ 20 ind.)',
        href: 'https://app.respondent.io/r/nicolasdacostasantos-2c913982c86d',
        trackingId: 'b2b-respondent-referral',
        shareUrl: 'https://app.respondent.io/r/nicolasdacostasantos-2c913982c86d',
      },
      {
        id: 'b2b-respondent-projetos',
        summaryPtBr: 'Ver projetos abertos com indicação na Respondent',
        payLabel: 'Bônus US$ 50/projeto',
        href: 'https://app.respondent.io/next/participants/projects/',
        trackingId: 'b2b-respondent-projects',
        shareUrl: 'https://app.respondent.io/next/participants/projects/',
      },
      {
        id: 'b2b-user-interviews',
        summaryPtBr: 'Responder pesquisas de produto na User Interviews',
        payLabel: 'US$ 40–150/estudo',
        href: 'https://www.userinterviews.com/studies',
        trackingId: 'b2b-user-interviews',
      },
    ],
  },
  'producao-videos-ia': {
    heading: 'Plataformas para produzir vídeos com IA',
    cardHint: '4 ferramentas líderes de vídeo com IA',
    items: [
      {
        id: 'video-ia-higgsfield',
        summaryPtBr: 'Gerar vídeos cinematográficos com IA na Higgsfield',
        payLabel: 'R$ 400–3.000+/mês',
        href: 'https://higgsfield.ai?fpr=nicolas-02403d',
        trackingId: 'video-ia-higgsfield',
        shareUrl: 'https://higgsfield.ai?fpr=nicolas-02403d',
      },
      {
        id: 'video-ia-heygen',
        summaryPtBr: 'Criar avatares e vídeos comerciais na HeyGen',
        payLabel: 'R$ 500–3.000+/mês',
        href: 'https://www.heygen.com/',
        trackingId: 'video-ia-heygen',
      },
      {
        id: 'video-ia-elevenlabs',
        summaryPtBr: 'Produzir narrações realistas em PT-BR na ElevenLabs',
        payLabel: 'Áudio profissional IA',
        href: 'https://elevenlabs.io/',
        trackingId: 'video-ia-elevenlabs',
      },
      {
        id: 'video-ia-runway',
        summaryPtBr: 'Animar cenas e comerciais curtos na Runway',
        payLabel: 'R$ 400–2.500+/mês',
        href: 'https://runwayml.com/',
        trackingId: 'video-ia-runway',
      },
    ],
  },
  'micro-saas-vibe-coding': {
    heading: 'Ferramentas para criar sites e Micro-SaaS',
    cardHint: '3 plataformas de criação com IA',
    items: [
      {
        id: 'vibe-lovable',
        summaryPtBr: 'Criar sites e apps completos na Lovable',
        payLabel: 'R$ 800–5.000+/mês',
        href: 'https://lovable.dev/',
        trackingId: 'vibe-lovable',
      },
      {
        id: 'vibe-replit',
        summaryPtBr: 'Desenvolver e publicar micro-apps no Replit',
        payLabel: 'R$ 800–4.000+/mês',
        href: 'https://replit.com/',
        trackingId: 'vibe-replit',
      },
      {
        id: 'vibe-emergent',
        summaryPtBr: 'Prototipar soluções sob medida com Claude Code',
        payLabel: 'Projetos sob demanda',
        href: 'https://claude.ai/',
        trackingId: 'vibe-claude',
      },
    ],
  },
  'afiliados-b2b-tubebuddy-make': {
    heading: 'Programas B2B com comissão recorrente',
    cardHint: '2 programas B2B em dólar reunidos',
    items: [
      {
        id: 'b2b-tubebuddy',
        summaryPtBr: 'Indicar ferramenta para criadores no TubeBuddy',
        payLabel: 'Até 30% recorrente',
        href: 'https://www.tubebuddy.com/pricing?a=NICOLASSANTOSNKL',
        trackingId: 'b2b-tubebuddy',
        shareUrl: 'https://www.tubebuddy.com/pricing?a=NICOLASSANTOSNKL',
      },
      {
        id: 'b2b-make',
        summaryPtBr: 'Receber comissão recorrente indicando automações Make',
        payLabel: '35% por 12 meses',
        href: 'https://www.make.com/en/partners-affiliates',
        trackingId: 'b2b-make',
      },
    ],
  },
  'monetizacao-atencao-web': {
    heading: 'Canais de apoio e atenção web',
    cardHint: '2 plataformas de monetização reunidas',
    items: [
      {
        id: 'web-brave',
        summaryPtBr: 'Receber contribuições de leitores no Brave Creators',
        payLabel: 'Tokens BAT/USD',
        href: 'https://creators.brave.com/',
        trackingId: 'web-brave-creators',
      },
      {
        id: 'web-bmac',
        summaryPtBr: 'Receber apoios e cafés no Buy Me a Coffee',
        payLabel: 'US$ 5–50+ por apoio',
        href: 'https://www.buymeacoffee.com/invite/ni2co3san9c',
        trackingId: 'web-buy-me-a-coffee',
      },
    ],
  },
  'comunidades-pagas-skool-systeme': {
    heading: 'Plataformas para comunidades e funis',
    cardHint: '2 plataformas de assinatura reunidas',
    items: [
      {
        id: 'comm-skool',
        summaryPtBr: 'Criar comunidade recorrente e indicar na Skool',
        payLabel: '40% recorrente USD',
        href: 'https://www.skool.com/signup?ref=6cfc923b63144db09dd50c1e39b69853',
        trackingId: 'comm-skool',
        shareUrl: 'https://www.skool.com/signup?ref=6cfc923b63144db09dd50c1e39b69853',
      },
      {
        id: 'comm-systeme',
        summaryPtBr: 'Montar funis e afiliados na Systeme.io',
        payLabel: '60% recorrente USD',
        href: 'https://systeme.io/',
        trackingId: 'comm-systeme',
      },
    ],
  },
  'printful-print-on-demand': {
    heading: 'Fornecedores globais sem estoque',
    cardHint: '2 plataformas de impressão sob demanda',
    items: [
      {
        id: 'pod-printful',
        summaryPtBr: 'Vender camisetas e itens autorais na Printful',
        payLabel: 'US$ 100–1.200/mês',
        href: 'https://www.printful.com/give-5-get-5/YAW807',
        trackingId: 'pod-printful',
        shareUrl: 'https://www.printful.com/give-5-get-5/YAW807',
      },
      {
        id: 'pod-printify',
        summaryPtBr: 'Escolher gráficas globais integradas na Printify',
        payLabel: 'US$ 100–1.200/mês',
        href: 'https://printify.com/',
        trackingId: 'pod-printify',
      },
    ],
  },
  'loja-templates-etsy-gumroad': {
    heading: 'Vitrines para templates e arquivos digitais',
    cardHint: '2 lojas globais para produtos digitais',
    items: [
      {
        id: 'tpl-gumroad',
        summaryPtBr: 'Vender planilhas, guias e Notion no Gumroad',
        payLabel: 'R$ 200–2.000+/mês',
        href: 'https://gumroad.com/',
        trackingId: 'tpl-gumroad',
      },
      {
        id: 'tpl-etsy',
        summaryPtBr: 'Publicar planners e templates digitais na Etsy',
        payLabel: 'US$ 50–800+/mês',
        href: 'https://www.etsy.com/',
        trackingId: 'tpl-etsy',
      },
    ],
  },
  'ia-remunerada-curadoria-dados': {
    heading: 'Redes de dados e curadoria para IA',
    cardHint: '2 serviços gratuitos de dados para IA',
    items: [
      {
        id: 'data-grass',
        summaryPtBr: 'Compartilhar banda ociosa dedicada na rede Grass',
        payLabel: 'US$ 10–45/mês',
        href: 'https://app.grass.io/register?referralCode=KVCAhtCL6RitKBH',
        trackingId: 'data-grass',
        shareUrl: 'https://app.grass.io/register?referralCode=KVCAhtCL6RitKBH',
      },
      {
        id: 'data-toloka',
        summaryPtBr: 'Executar microtarefas de verificação na Toloka',
        payLabel: 'US$ 5–30/semana',
        href: 'https://toloka.ai/',
        trackingId: 'data-toloka',
      },
    ],
  },
  'learn-to-earn-bolsas-digitais': {
    heading: 'Desafios abertos de estudo remunerado',
    cardHint: '2 plataformas de desafios e prêmios',
    items: [
      {
        id: 'l2e-kaggle',
        summaryPtBr: 'Disputar desafios práticos de dados no Kaggle',
        payLabel: 'Prêmios em USD',
        href: 'https://www.kaggle.com/competitions',
        trackingId: 'l2e-kaggle',
      },
      {
        id: 'l2e-hackerone',
        summaryPtBr: 'Reportar falhas de segurança na HackerOne',
        payLabel: 'US$ 25–1.000+',
        href: 'https://www.hackerone.com/',
        trackingId: 'l2e-hackerone',
      },
    ],
  },
};

export function getMultiProjectGroup(slug: string): MultiProjectGroup | null {
  const group = RAW_MULTI_PROJECT_GROUPS[slug];
  if (!group) return null;
  return {
    ...group,
    items: group.items.map((item) => ({
      ...item,
      summaryPtBr: enforceMaxSevenWords(item.summaryPtBr),
    })),
  };
}

export function getMultiProjectCardHint(slug: string, micro1Count = 0): string | null {
  if (slug === 'micro1') {
    return micro1Count > 0
      ? `${micro1Count} serviços e projetos em várias áreas`
      : 'Vários serviços e projetos em várias áreas';
  }
  return RAW_MULTI_PROJECT_GROUPS[slug]?.cardHint ?? null;
}
