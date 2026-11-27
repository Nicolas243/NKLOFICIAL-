import {
  APP_ICONS,
  type ProductSlug,
  type TrackId,
} from '@/config/app-brand';

export type { ProductSlug } from '@/config/app-brand';

export type ProductBadgeLabel = 'Acesso Especial' | 'Guia Completo';

export type PaidProduct = {
  slug: ProductSlug;
  trackId: TrackId;
  title: string;
  shortName: string;
  badgeLabel: ProductBadgeLabel;
  headline: string;
  aspirationalLead: string;
  offerRoute: `/ofertas/${ProductSlug}`;
  toolRoute: `/app/${ProductSlug}`;
  checkoutRoute: `/ofertas/${ProductSlug}/checkout`;
  hasStandalonePwa: boolean;
  pwaBrandName?: string;
  pwaShortName?: string;
  pwaDescription?: string;
  pwaThemeColor?: string;
  pwaIcon192?: string;
  pwaIcon512?: string;
  priceLabel: string;
  billingNote: string;
  hidePriceOnOfferPage?: boolean;
  deliverables: readonly string[];
  bonuses: readonly string[];
  ctaLabel: string;
  stripeCheckoutKind: 'ai' | 'guide';
  legacyOfferVariant: string;
};

export const PAID_PRODUCTS: readonly PaidProduct[] = [
  {
    slug: 'bussola-negocios',
    trackId: 'musica',
    title: 'Bússola de Negócios',
    shortName: 'Bússola de Negócios',
    badgeLabel: 'Acesso Especial',
    headline: 'Descubra o negócio dos seus sonhos — alinhado ao seu perfil, talento e rotina real.',
    aspirationalLead:
      'Responda 50 critérios sobre vocação, liberdade geográfica, capital inicial, tecnologia e estilo de trabalho para revelar os 3 modelos de negócio mais promissores para construir com gosto e método.',
    offerRoute: '/ofertas/bussola-negocios',
    toolRoute: '/app/bussola-negocios',
    checkoutRoute: '/ofertas/bussola-negocios/checkout',
    hasStandalonePwa: true,
    pwaBrandName: 'Bússola de Negócios',
    pwaShortName: 'Bússola',
    pwaDescription:
      'Ferramenta prática para comparar caminhos de renda e negócios segundo o seu momento.',
    pwaThemeColor: '#0f1a2c',
    pwaIcon192: APP_ICONS.bussola[192],
    pwaIcon512: APP_ICONS.bussola[512],
    priceLabel: 'R$ 39 em pagamento único',
    billingNote: 'Liberação individual e imediata desta ferramenta após confirmação.',
    hidePriceOnOfferPage: true,
    deliverables: [
      'Acesso completo à ferramenta interativa Bússola de Negócios (50 critérios reais)',
      'Comparação personalizada de modelos por tempo, capital e rotina',
      'Instalação como app dedicado no celular para consultar quando precisar',
    ],
    bonuses: [
      'Plano de ação prático para os primeiros 7 dias',
      'Checklist anti-reprovação para evitar erros comuns no início',
      'Tracker semanal de execução e validação de ideias',
    ],
    ctaLabel: 'Quero desbloquear minha Bússola de Negócios',
    stripeCheckoutKind: 'guide',
    legacyOfferVariant: 'sales-page',
  },
  {
    slug: 'ferramenta-ia',
    trackId: 'ia-completa',
    title: 'Estúdio IA na Prática',
    shortName: 'Estúdio IA',
    badgeLabel: 'Acesso Especial',
    headline: 'Transforme inteligência artificial em ferramenta diária de clareza e produção.',
    aspirationalLead:
      'Tenha playbooks prontos, prompts estruturados e listas de conferência em um app rápido no celular para estudar, escrever e trabalhar com segurança.',
    offerRoute: '/ofertas/ferramenta-ia',
    toolRoute: '/app/ferramenta-ia',
    checkoutRoute: '/ofertas/ferramenta-ia/checkout',
    hasStandalonePwa: true,
    pwaBrandName: 'Estúdio IA',
    pwaShortName: 'Estúdio IA',
    pwaDescription:
      'Playbooks prontos, prompts organizados e listas de revisão para usar IA no dia a dia.',
    pwaThemeColor: '#13254a',
    pwaIcon192: APP_ICONS.ferramentaIa[192],
    pwaIcon512: APP_ICONS.ferramentaIa[512],
    priceLabel: 'R$ 99 acesso completo ou R$ 39/mês',
    billingNote: 'Acesso individual ao Estúdio IA e aplicativo dedicado no celular.',
    deliverables: [
      'Playbooks editáveis em português para trabalho, estudo e criação',
      'Biblioteca organizada de prompts por objetivo e contexto',
      'Checklists práticos de conferência de fontes e privacidade',
    ],
    bonuses: [
      'Instalação como aplicativo dedicado no celular e desktop',
      'Rotina guiada para revisar textos e decisões sem respostas genéricas',
      'Biblioteca pronta de cenários para adaptar em segundos',
    ],
    ctaLabel: 'Quero usar essa ferramenta agora',
    stripeCheckoutKind: 'ai',
    legacyOfferVariant: 'ai-one-time',
  },
  {
    slug: 'pacote-idiomas-ia',
    trackId: 'idiomas-ia',
    title: 'Pacote Idiomas com IA',
    shortName: 'Idiomas com IA',
    badgeLabel: 'Guia Completo',
    headline: 'Use qualquer inteligência artificial como tutora diária para destravar idiomas.',
    aspirationalLead:
      'Combine leitura prática em inglês com um método simples de conversa, pronúncia e vocabulário real em 15 minutos por dia.',
    offerRoute: '/ofertas/pacote-idiomas-ia',
    toolRoute: '/app/pacote-idiomas-ia',
    checkoutRoute: '/ofertas/pacote-idiomas-ia/checkout',
    hasStandalonePwa: false,
    priceLabel: 'R$ 47 em pagamento único',
    billingNote: 'Pacote digital entregue na sua área do membro com acesso vitalício aos arquivos.',
    deliverables: [
      'E-book completo de Inglês na Prática (100 lições e 500 exemplos coloridos para celular)',
      'Guia prático de como usar qualquer IA para aprender idiomas no dia a dia',
      'Acompanhamento estruturado da coleção de idiomas do portal',
    ],
    bonuses: [
      'Biblioteca de prompts de simulação e conversação por voz',
      'Rotina prática de 15 minutos por dia sem sobrecarga',
      'Kit de sobrevivência para entrevistas e trabalho remoto',
    ],
    ctaLabel: 'Quero começar minha trilha de idiomas',
    stripeCheckoutKind: 'guide',
    legacyOfferVariant: 'english-ebook-sales-page',
  },
  {
    slug: 'pacote-renda-extra',
    trackId: 'renda-extra',
    title: 'Pacote Guia Renda Extra',
    shortName: 'Guia Renda Extra',
    badgeLabel: 'Guia Completo',
    headline: 'Organize sua busca por renda pela internet com critérios claros e sem atalhos ilusórios.',
    aspirationalLead:
      'Saia do excesso de abas abertas com cadernos diretos, ferramentas de acompanhamento e modelos prontos para se apresentar com profissionalismo.',
    offerRoute: '/ofertas/pacote-renda-extra',
    toolRoute: '/app/pacote-renda-extra',
    checkoutRoute: '/ofertas/pacote-renda-extra/checkout',
    hasStandalonePwa: false,
    priceLabel: 'R$ 39 em pagamento único',
    billingNote: 'Conjunto completo de guias e planilhas liberado na sua área do membro.',
    deliverables: [
      'Guia Essencial Renda Extra 2027 e cadernos práticos complementares',
      'Comparativos claros de requisitos para plataformas e trabalho remoto',
      'Planilhas digitais Raio-X Financeiro (versões computador e celular)',
    ],
    bonuses: [
      'Planilha e tracker de candidaturas para acompanhar cada envio',
      'Checklist anti-reprovação antes de enviar seu perfil às plataformas',
      'Templates prontos de apresentação em português e inglês',
    ],
    ctaLabel: 'Quero organizar minha renda extra agora',
    stripeCheckoutKind: 'guide',
    legacyOfferVariant: 'sales-page',
  },
  {
    slug: 'ebook-ingles',
    trackId: 'idiomas-ia',
    title: 'E-book de Inglês na Prática',
    shortName: 'E-book de Inglês',
    badgeLabel: 'Guia Completo',
    headline: 'Destrave leitura, conversação básica e confiança no inglês mesmo sem tempo sobrando.',
    aspirationalLead:
      'Um livro digital direto em formato A5 pensado para estudar no ônibus, no intervalo ou em casa, com exemplos práticos do cotidiano.',
    offerRoute: '/ofertas/ebook-ingles',
    toolRoute: '/app/ebook-ingles',
    checkoutRoute: '/ofertas/ebook-ingles/checkout',
    hasStandalonePwa: false,
    priceLabel: 'R$ 47 em pagamento único',
    billingNote: 'Liberação individual do E-book Inglês na sua conta após confirmação.',
    deliverables: [
      '100 lições curtas e 500 exemplos coloridos para leitura confortável no celular',
      'Plano de 90 dias para criar constância sem decorar gramática pesada',
      'Orientações para montar portfólio simples sem inventar experiência',
    ],
    bonuses: [
      'Guia rápido para usar qualquer IA como parceira de conversa',
      'Roteiro leve de 15 minutos por dia no celular',
      'Frases essenciais para vagas remotas e e-mails curtos',
    ],
    ctaLabel: 'Quero acessar o E-book de Inglês',
    stripeCheckoutKind: 'guide',
    legacyOfferVariant: 'english-ebook-sales-page',
  },
  {
    slug: 'curso-ia-pratica',
    trackId: 'ia-completa',
    title: 'Curso IA na Prática',
    shortName: 'Curso IA na Prática',
    badgeLabel: 'Guia Completo',
    headline: 'Domine instruções claras, verificação de fontes e rotina produtiva com IA no seu ritmo.',
    aspirationalLead:
      'Sete módulos curtos em português para aplicar o que você aprende no mesmo dia em estudos, casa, textos e trabalho.',
    offerRoute: '/ofertas/curso-ia-pratica',
    toolRoute: '/app/curso-ia-pratica',
    checkoutRoute: '/ofertas/curso-ia-pratica/checkout',
    hasStandalonePwa: false,
    priceLabel: 'R$ 99 acesso avulso ou R$ 39/mês',
    billingNote: 'Acesso aos 7 módulos e acompanhamento do seu progresso na conta.',
    deliverables: [
      '7 módulos passo a passo em português sem termos complicados',
      'Exercícios práticos ao fim de cada lição para aplicar no mesmo dia',
      'Registro de progresso por lição salvo na sua área de membro',
    ],
    bonuses: [
      'Biblioteca de prompts editáveis para adaptar ao seu contexto',
      'Método simples para conferir fatos e evitar respostas inventadas',
      'Guia prático de privacidade e limites ao usar qualquer ferramenta',
    ],
    ctaLabel: 'Quero fazer o Curso IA na Prática',
    stripeCheckoutKind: 'ai',
    legacyOfferVariant: 'ai-subscription',
  },
] as const;

export const PAID_PRODUCT_SLUGS: readonly ProductSlug[] = PAID_PRODUCTS.map(
  (product) => product.slug,
);

export function isValidProductSlug(value: unknown): value is ProductSlug {
  return (
    typeof value === 'string' &&
    PAID_PRODUCTS.some((product) => product.slug === value)
  );
}

export function getProductBySlug(
  slug: string | null | undefined,
): PaidProduct | null {
  if (!slug) return null;
  const normalized = slug.trim();
  return PAID_PRODUCTS.find((product) => product.slug === normalized) ?? null;
}

export function getStandalonePwaProducts(): readonly PaidProduct[] {
  return PAID_PRODUCTS.filter((product) => product.hasStandalonePwa);
}
