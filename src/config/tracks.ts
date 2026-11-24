import type { ProductSlug, TrackId } from '@/config/app-brand';

export type { TrackId } from '@/config/app-brand';

export type TrackAccent = 'income' | 'music' | 'languages' | 'learning';

export type TrackStep = {
  stepNumber: 1 | 2 | 3;
  tag: string;
  title: string;
  description: string;
  href: string;
};

export type PortalTrack = {
  id: TrackId;
  title: string;
  shortLabel: string;
  summary: string;
  accent: TrackAccent;
  freePortalHref: string;
  recommendedProductSlug: ProductSlug;
  steps: readonly [TrackStep, TrackStep, TrackStep];
};

export const PORTAL_TRACKS: readonly PortalTrack[] = [
  {
    id: 'renda-extra',
    title: 'Ganhar Renda Extra',
    shortLabel: 'Renda Extra',
    summary:
      'Escolha plataformas reais que combinam com seu tempo livre, organize candidaturas e evite armadilhas comuns.',
    accent: 'income',
    freePortalHref: '/programas',
    recommendedProductSlug: 'pacote-renda-extra',
    steps: [
      {
        stepNumber: 1,
        tag: 'Passo 1 · Base gratuita',
        title: 'Explorar plataformas abertas no portal',
        description:
          'Compare sites, critérios de entrada e rotinas reais pelo seu tempo disponível.',
        href: '/programas',
      },
      {
        stepNumber: 2,
        tag: 'Passo 2 · Prática guiada',
        title: 'Filtrar caminhos para quem está começando',
        description:
          'Veja opções sem custo inicial e entenda o que cada plataforma exige antes de se cadastrar.',
        href: '/programas/iniciantes',
      },
      {
        stepNumber: 3,
        tag: 'Passo 3 · Acelerador prático',
        title: 'Guias completos, tracker e checklist anti-reprovação',
        description:
          'Leve a planilha de candidaturas e os modelos de apresentação para agir com ordem.',
        href: '/ofertas/pacote-renda-extra',
      },
    ],
  },
  {
    id: 'musica',
    title: 'Evoluir na Música',
    shortLabel: 'Música',
    summary:
      'Cuide melhor do seu instrumento de cordas, compare encordoamentos com clareza e encontre luthiers e professores.',
    accent: 'music',
    freePortalHref: '/musica/naipe_cordas',
    recommendedProductSlug: 'bussola-negocios',
    steps: [
      {
        stepNumber: 1,
        tag: 'Passo 1 · Base gratuita',
        title: 'Entrar no espaço NKL Cordas',
        description:
          'Acesse guias práticos sobre timbre, regulagem de instrumento e estudo contínuo.',
        href: '/musica/naipe_cordas',
      },
      {
        stepNumber: 2,
        tag: 'Passo 2 · Prática guiada',
        title: 'Comparar cordas, luthiers e professores',
        description:
          'Use o catálogo comparativo para escolher encordoamentos e profissionais de confiança.',
        href: '/catalogo',
      },
      {
        stepNumber: 3,
        tag: 'Passo 3 · Acelerador de carreira',
        title: 'Bússola de Negócios para músicos e projetos',
        description:
          'Transforme sua habilidade em aulas, serviços ou projetos independentes com plano claro.',
        href: '/ofertas/bussola-negocios',
      },
    ],
  },
  {
    id: 'idiomas-ia',
    title: 'Aprender Idiomas com IA',
    shortLabel: 'Idiomas com IA',
    summary:
      'Estude inglês no dia a dia com apoio prático de inteligência artificial e acompanhe os próximos cinco idiomas.',
    accent: 'languages',
    freePortalHref: '/blog/aprender/ingles',
    recommendedProductSlug: 'pacote-idiomas-ia',
    steps: [
      {
        stepNumber: 1,
        tag: 'Passo 1 · Base gratuita',
        title: 'Começar pelas lições práticas de inglês',
        description:
          'Treine leitura, compreensão e rotina leve sem precisar decorar regras intermináveis.',
        href: '/blog/aprender/ingles',
      },
      {
        stepNumber: 2,
        tag: 'Passo 2 · Prática guiada',
        title: 'Ler amostra das primeiras 5 lições',
        description:
          'Experimente os exemplos coloridos pensados para ler e revisar direto no celular.',
        href: '/guias/ingles/ebook',
      },
      {
        stepNumber: 3,
        tag: 'Passo 3 · Pacote completo com IA',
        title: 'E-books + guia de qualquer IA + rotina de 15 min/dia',
        description:
          'Inclui prompts de simulação por voz, roteiro diário e kit para entrevistas remotas.',
        href: '/ofertas/pacote-idiomas-ia',
      },
    ],
  },
  {
    id: 'ia-completa',
    title: 'Aprender Tudo sobre IA',
    shortLabel: 'Domínio em IA',
    summary:
      'Pare de receber respostas genéricas e domine um jeito direto de pesquisar, revisar e produzir com IA todo dia.',
    accent: 'learning',
    freePortalHref: '/ia',
    recommendedProductSlug: 'ferramenta-ia',
    steps: [
      {
        stepNumber: 1,
        tag: 'Passo 1 · Base gratuita',
        title: 'Explorar IA na Prática sem complicação',
        description:
          'Descubra por onde começar de acordo com seu momento e veja exemplos reais em português.',
        href: '/ia',
      },
      {
        stepNumber: 2,
        tag: 'Passo 2 · Prática guiada',
        title: 'Testar ferramentas e prompts organizados',
        description:
          'Compare aplicações para estudos, textos, trabalho e revisão sem depender de chutes.',
        href: '/ia/ferramentas',
      },
      {
        stepNumber: 3,
        tag: 'Passo 3 · App dedicado e playbooks',
        title: 'Estúdio IA na Prática direto no celular',
        description:
          'Desbloqueie roteiros editáveis, biblioteca guiada e acesso rápido em app próprio.',
        href: '/ofertas/ferramenta-ia',
      },
    ],
  },
] as const;

export function isValidTrackId(value: unknown): value is TrackId {
  return (
    typeof value === 'string' &&
    PORTAL_TRACKS.some((track) => track.id === value)
  );
}

export function getTrackById(value: string | null | undefined): PortalTrack | null {
  if (!value) return null;
  return PORTAL_TRACKS.find((track) => track.id === value.trim()) ?? null;
}
