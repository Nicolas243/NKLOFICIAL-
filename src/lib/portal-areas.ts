export type PortalAreaCategory =
  | 'music'
  | 'income'
  | 'languages'
  | 'learning'
  | 'partners';

export type PortalAreaStatus = 'active' | 'coming-soon';

export type PortalAreaMedia = {
  src: string;
  alt: string;
  objectPosition?: string;
};

export type PortalAreaCard = {
  id: string;
  title: string;
  description: string;
  href: string;
  category: PortalAreaCategory;
  status: PortalAreaStatus;
  featured?: boolean;
  label?: string;
  /** Selo discreto do tipo de material/acesso (ex.: "Acesso Especial", "Guia Completo"). */
  accessBadge?: string;
  /** Metadado curto exibido somente quando houver valor real (ex.: "6 idiomas"). */
  meta?: string;
  media?: PortalAreaMedia;
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
    title: 'NKL Cordas — Violino (outros em breve)',
    description:
      'Compare cordas, encontre luthiers e professores e tire dúvidas sobre violino — viola, violoncelo e contrabaixo em breve.',
    href: '/musica/naipe_cordas',
    category: 'music',
    status: 'active',
    featured: true,
    label: 'Entrar na área musical',
    media: {
      src: '/images/areas/nkl-cordas.jpg',
      alt: 'Violino artesanal e arco em oficina de luthieria NKL Cordas',
      objectPosition: 'center center',
    },
  },
  {
    id: 'renda-extra',
    title: 'Renda Extra',
    description:
      'Veja plataformas e caminhos reais para trabalhar pela internet, filtrados por perfil e tempo disponível.',
    href: '/programas',
    category: 'income',
    status: 'active',
    featured: true,
    label: 'Ver oportunidades',
    media: {
      src: '/images/areas/renda-extra.jpg',
      alt: 'Painel com oportunidades reais de trabalho pela internet',
    },
  },
  {
    id: 'idiomas',
    title: 'Idiomas',
    description:
      'Comece a estudar inglês hoje com lições práticas e acompanhe outros cinco idiomas que estão chegando.',
    href: '/blog/aprender/ingles',
    category: 'languages',
    status: 'active',
    featured: true,
    label: 'Estudar inglês',
    meta: '6 idiomas',
    media: {
      src: '/images/areas/idiomas.jpg',
      alt: 'Trilha com inglês ativo e cinco outros idiomas no Portal NKL',
    },
  },
  {
    id: 'ia-na-pratica',
    title: 'IA na Prática',
    description:
      'Aprenda a usar inteligência artificial no trabalho e nos estudos para economizar tempo no dia a dia.',
    href: '/ia',
    category: 'learning',
    status: 'active',
    featured: true,
    label: 'Abrir IA na Prática',
    media: {
      src: '/images/areas/ia-na-pratica.jpg',
      alt: 'Fluxo de trabalho com inteligência artificial no dia a dia',
    },
  },
  {
    id: 'guia-renda-extra',
    title: 'Guia Renda Extra',
    description:
      'Passo a passo direto para organizar sua rotina e escolher boas opções de renda extra sem se perder.',
    href: '/ofertas/pacote-renda-extra',
    category: 'income',
    status: 'active',
    accessBadge: 'Guia Completo',
    label: 'Conhecer pacote',
    media: {
      src: '/images/areas/guia-renda-extra.jpg',
      alt: 'Capa do pacote Guia Renda Extra do Portal NKL',
    },
  },
  {
    id: 'quiz-negocios',
    title: 'Bússola de Negócios',
    description:
      'Responda perguntas práticas e descubra o negócio dos seus sonhos com ideias reais para construir no seu ritmo.',
    href: '/ofertas/bussola-negocios',
    category: 'income',
    status: 'active',
    accessBadge: 'Acesso Especial',
    label: 'Conhecer a Bússola',
    media: {
      src: '/images/areas/quiz-negocios.jpg',
      alt: 'Bússola de Negócios do Portal NKL',
    },
  },
  {
    id: 'ferramenta-ia',
    title: 'Estúdio IA na Prática',
    description:
      'Playbooks prontos, prompts estruturados e listas práticas para usar IA no celular ou no PC.',
    href: '/ofertas/ferramenta-ia',
    category: 'learning',
    status: 'active',
    accessBadge: 'Acesso Especial',
    label: 'Conhecer ferramenta',
    media: {
      src: '/images/areas/ferramenta-ia.jpg',
      alt: 'Estúdio IA na Prática com playbooks e prompts prontos',
    },
  },
  {
    id: 'curso-ia',
    title: 'Curso IA na Prática',
    description:
      'Aulas diretas ao ponto para dominar ferramentas de IA no trabalho, com módulos que você faz no seu tempo.',
    href: '/ofertas/curso-ia-pratica',
    category: 'learning',
    status: 'active',
    accessBadge: 'Guia Completo',
    label: 'Conhecer curso',
    media: {
      src: '/images/areas/curso-ia.jpg',
      alt: 'Módulos e aulas em vídeo do Curso IA na Prática',
    },
  },
  {
    id: 'ingles',
    title: 'E-book de Inglês',
    description:
      'Lições curtas e exemplos reais para destravar leitura, conversa e rotina no inglês.',
    href: '/ofertas/ebook-ingles',
    category: 'languages',
    status: 'active',
    accessBadge: 'Guia Completo',
    label: 'Conhecer e-book',
    media: {
      src: '/images/areas/ingles-ebook.jpg',
      alt: 'Capa e páginas internas do E-book de Inglês',
    },
  },
  {
    id: 'italiano',
    title: 'Italiano',
    description: 'E-book com frases do dia a dia, guia de IA por idade e planner de 90 dias.',
    href: '/guias/italiano',
    category: 'languages',
    status: 'active',
    accessBadge: 'Guia Completo',
    label: 'Conhecer e-book',
    media: {
      src: '/images/areas/idioma-italiano.jpg',
      alt: 'Capa e guia completo de Italiano do Portal NKL',
    },
  },
  {
    id: 'frances',
    title: 'Francês',
    description: 'E-book prático com exercícios, expressões úteis, guia de IA e planner visual.',
    href: '/guias/frances',
    category: 'languages',
    status: 'active',
    accessBadge: 'Guia Completo',
    label: 'Conhecer e-book',
    media: {
      src: '/images/areas/idioma-frances.jpg',
      alt: 'Capa e guia completo de Francês do Portal NKL',
    },
  },
  {
    id: 'alemao',
    title: 'Alemão',
    description: 'E-book direto com vocabulário por situações reais, prompts de IA e planner.',
    href: '/guias/alemao',
    category: 'languages',
    status: 'active',
    accessBadge: 'Guia Completo',
    label: 'Conhecer e-book',
    media: {
      src: '/images/areas/idioma-alemao.jpg',
      alt: 'Capa e guia completo de Alemão do Portal NKL',
    },
  },
  {
    id: 'espanhol',
    title: 'Espanhol',
    description: 'E-book focado em leitura, fala, conversas cotidianas e prática com IA.',
    href: '/guias/espanhol',
    category: 'languages',
    status: 'active',
    accessBadge: 'Guia Completo',
    label: 'Conhecer e-book',
    media: {
      src: '/images/areas/idioma-espanhol.jpg',
      alt: 'Capa e guia completo de Espanhol do Portal NKL',
    },
  },
  {
    id: 'mandarim',
    title: 'Chinês',
    description: 'E-book começando pelos tons, pinyin, frases essenciais e prática guiada com IA.',
    href: '/guias/chines',
    category: 'languages',
    status: 'active',
    accessBadge: 'Guia Completo',
    label: 'Conhecer e-book',
    media: {
      src: '/images/areas/idioma-chines.jpg',
      alt: 'Capa e guia completo de Chinês do Portal NKL',
    },
  },
  {
    id: 'mural-parceiros',
    title: 'Mural de Parceiros',
    description: 'Veja marcas, lojas e projetos recomendados que apoiam o Portal NKL.',
    href: '/mural-de-parceiros',
    category: 'partners',
    status: 'active',
    label: 'Ver parceiros',
    media: {
      src: '/images/areas/mural-parceiros.jpg',
      alt: 'Mural com marcas e projetos parceiros do Portal NKL',
    },
  },
  {
    id: 'anuncie',
    title: 'Anuncie no Portal',
    description: 'Divulgue sua marca ou serviço nos espaços disponíveis do portal.',
    href: '/programas/anuncie',
    category: 'partners',
    status: 'active',
    label: 'Anunciar',
    media: {
      src: '/images/areas/anuncie-portal.jpg',
      alt: 'Espaços de divulgação para parceiros e anunciantes no Portal NKL',
    },
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
