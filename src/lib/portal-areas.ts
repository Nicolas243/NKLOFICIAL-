export type PortalAreaCategory =
  | 'music'
  | 'income'
  | 'languages'
  | 'learning'
  | 'partners';

export type PortalAreaStatus = 'active' | 'coming-soon';

export type PortalAreaCard = {
  id: string;
  title: string;
  description: string;
  href: string;
  category: PortalAreaCategory;
  status: PortalAreaStatus;
  featured?: boolean;
  label?: string;
  /** Metadado curto exibido somente quando houver valor real (ex.: "6 idiomas"). */
  meta?: string;
};

export const PORTAL_AREA_CATEGORIES: readonly PortalAreaCategory[] = [
  'music',
  'income',
  'languages',
  'learning',
  'partners',
];

const PORTAL_AREA_STATUSES: readonly PortalAreaStatus[] = ['active', 'coming-soon'];

export const PORTAL_AREA_CARDS: readonly PortalAreaCard[] = [
  {
    id: 'nkl-cordas',
    title: 'NKL Cordas — Naipe de Cordas',
    description:
      'Catálogo de cordas, luthiers, professores e instrumentos reunidos para quem toca e para quem constrói.',
    href: '/musica/naipe_cordas',
    category: 'music',
    status: 'active',
    featured: true,
    label: 'Explorar',
  },
  {
    id: 'renda-extra',
    title: 'Renda Extra',
    description: 'Mapa editorial de oportunidades para trabalhar com internet, com critérios claros.',
    href: '/programas',
    category: 'income',
    status: 'active',
    featured: true,
    label: 'Explorar',
  },
  {
    id: 'idiomas',
    title: 'Idiomas',
    description: 'Estude inglês agora e acompanhe outros cinco idiomas em preparação.',
    href: '/blog/aprender/ingles',
    category: 'languages',
    status: 'active',
    featured: true,
    label: 'Começar',
    meta: '6 idiomas',
  },
  {
    id: 'ia-na-pratica',
    title: 'IA na Prática',
    description: 'Use inteligência artificial com método e contexto no trabalho e no estudo.',
    href: '/ia',
    category: 'learning',
    status: 'active',
    featured: true,
    label: 'Descobrir',
  },
  {
    id: 'guia-renda-extra',
    title: 'Guia Renda Extra',
    description: 'Um caminho organizado para decidir seus próximos passos com mais clareza.',
    href: '/guias/renda-extra',
    category: 'income',
    status: 'active',
    label: 'Ver guia',
  },
  {
    id: 'quiz-negocios',
    title: 'Diagnóstico de Negócios',
    description: 'Responda algumas perguntas e entenda por onde começar a estruturar uma ideia.',
    href: '/quiz-negocios',
    category: 'income',
    status: 'active',
    label: 'Fazer diagnóstico',
  },
  {
    id: 'curso-ia',
    title: 'IA na Prática — Programa',
    description: 'Aulas práticas para usar IA no trabalho e no estudo, com módulos individuais.',
    href: '/ia/oferta',
    category: 'learning',
    status: 'active',
    label: 'Ver programa',
  },
  {
    id: 'ingles',
    title: 'Inglês',
    description: 'E-book com lições práticas para ganhar confiança no idioma.',
    href: '/guias/ingles',
    category: 'languages',
    status: 'active',
    label: 'Ver e-book',
  },
  {
    id: 'italiano',
    title: 'Italiano',
    description: 'E-book em produção editorial, com situações reais e rotina progressiva.',
    href: '/guias/italiano',
    category: 'languages',
    status: 'coming-soon',
  },
  {
    id: 'frances',
    title: 'Francês',
    description: 'E-book em produção editorial, com exercícios e contextos úteis.',
    href: '/guias/frances',
    category: 'languages',
    status: 'coming-soon',
  },
  {
    id: 'alemao',
    title: 'Alemão',
    description: 'E-book em produção editorial, com vocabulário por temas do cotidiano.',
    href: '/guias/alemao',
    category: 'languages',
    status: 'coming-soon',
  },
  {
    id: 'espanhol',
    title: 'Espanhol',
    description: 'E-book em produção editorial, com compreensão, fala e situações práticas.',
    href: '/guias/espanhol',
    category: 'languages',
    status: 'coming-soon',
  },
  {
    id: 'mandarim',
    title: 'Chinês',
    description: 'E-book em produção editorial, começando por sons, símbolos e frases essenciais.',
    href: '/guias/chines',
    category: 'languages',
    status: 'coming-soon',
  },
  {
    id: 'mural-parceiros',
    title: 'Mural de Parceiros',
    description: 'Conheça marcas e projetos que apoiam o portal.',
    href: '/mural-de-parceiros',
    category: 'partners',
    status: 'active',
    label: 'Ver mural',
  },
  {
    id: 'anuncie',
    title: 'Anuncie no Portal',
    description: 'Conheça os formatos e a disponibilidade de espaços para divulgar sua marca.',
    href: '/programas/anuncie',
    category: 'partners',
    status: 'active',
    label: 'Anunciar',
  },
] as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Aceita rotas internas (`/x`) ou URLs externas https. Rejeita `//host`, `javascript:` e vazios. */
export function isValidPortalHref(href: unknown): href is string {
  if (!isNonEmptyString(href)) return false;
  const value = href.trim();
  if (/\s/.test(value)) return false;
  if (value.startsWith('/')) return !value.startsWith('//');
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function isExternalPortalHref(href: string): boolean {
  return !href.startsWith('/');
}

export function isValidPortalAreaCard(card: unknown): card is PortalAreaCard {
  if (typeof card !== 'object' || card === null) return false;
  const candidate = card as Partial<Record<keyof PortalAreaCard, unknown>>;
  return (
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.title) &&
    isNonEmptyString(candidate.description) &&
    isValidPortalHref(candidate.href) &&
    PORTAL_AREA_CATEGORIES.includes(candidate.category as PortalAreaCategory) &&
    PORTAL_AREA_STATUSES.includes(candidate.status as PortalAreaStatus)
  );
}

/**
 * Filtra o registro mantendo somente cards completos e com `id` unico.
 * Entradas invalidas, vazias ou duplicadas sao ignoradas sem lancar erro.
 */
export function getValidPortalAreaCards(
  cards: readonly unknown[] | null | undefined = PORTAL_AREA_CARDS,
): PortalAreaCard[] {
  if (!Array.isArray(cards)) return [];
  const seen = new Set<string>();
  const valid: PortalAreaCard[] = [];
  for (const card of cards) {
    if (!isValidPortalAreaCard(card)) continue;
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    valid.push(card);
  }
  return valid;
}
