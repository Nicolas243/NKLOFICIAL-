export type PortalAreaCategory =
  | 'music'
  | 'income'
  | 'languages'
  | 'learning'
  | 'partners';

export type PortalAreaCard = {
  id: string;
  title: string;
  description: string;
  href: string;
  category: PortalAreaCategory;
  status: 'active' | 'coming-soon';
  featured?: boolean;
  label?: string;
};

export const PORTAL_AREA_CARDS: readonly PortalAreaCard[] = [
  {
    id: 'nkl-cordas',
    title: 'NKL Cordas',
    description: 'Cordas, luthiers e instrumentos em um só lugar.',
    href: '/catalogo',
    category: 'music',
    status: 'active',
    featured: true,
    label: 'Explore',
  },
  {
    id: 'renda-extra',
    title: 'Renda Extra',
    description: 'Oportunidades editoriais para trabalhar com internet.',
    href: '/programas',
    category: 'income',
    status: 'active',
    featured: true,
    label: 'Explorar',
  },
  {
    id: 'idiomas',
    title: 'Idiomas',
    description: 'Pratique inglês, francês e mais cinco opções.',
    href: '/blog/aprender/ingles',
    category: 'languages',
    status: 'active',
    featured: true,
    label: 'Começar',
  },
  {
    id: 'ia-na-pratica',
    title: 'IA na Prática',
    description: 'Use inteligência artificial com método e contexto.',
    href: '/ia',
    category: 'learning',
    status: 'active',
    featured: true,
    label: 'Descobrir',
  },
  {
    id: 'guia-renda-extra',
    title: 'Guia Renda Extra',
    description: 'Um caminho organizado para seus próximos passos.',
    href: '/guias/renda-extra',
    category: 'income',
    status: 'active',
    label: 'Ver guia',
  },
  {
    id: 'curso-ia',
    title: 'IA na Prática — Programa',
    description: 'Aulas práticas para usar IA no trabalho e no estudo.',
    href: '/ia/oferta',
    category: 'learning',
    status: 'active',
    label: 'Ver programa',
  },
  {
    id: 'ingles',
    title: 'Inglês',
    description: 'Conteúdo prático para ganhar confiança no idioma.',
    href: '/guias/ingles',
    category: 'languages',
    status: 'active',
  },
  {
    id: 'italiano',
    title: 'Italiano',
    description: 'Aprenda com situações reais e rotina progressiva.',
    href: '/guias/italiano',
    category: 'languages',
    status: 'active',
  },
  {
    id: 'frances',
    title: 'Francês',
    description: 'Estude com exercícios e contextos úteis.',
    href: '/guias/frances',
    category: 'languages',
    status: 'active',
  },
  {
    id: 'alemao',
    title: 'Alemão',
    description: 'Construa vocabulário por temas do cotidiano.',
    href: '/guias/alemao',
    category: 'languages',
    status: 'active',
  },
  {
    id: 'espanhol',
    title: 'Espanhol',
    description: 'Treine compreensão, fala e situações práticas.',
    href: '/guias/espanhol',
    category: 'languages',
    status: 'active',
  },
  {
    id: 'mandarim',
    title: 'Chinês',
    description: 'Comece pelos sons, símbolos e frases essenciais.',
    href: '/guias/chines',
    category: 'languages',
    status: 'active',
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
] as const;
