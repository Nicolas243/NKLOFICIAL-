export type ProgramRecommendedCourse = {
  label: string;
  courseTitle: string;
  href: string;
  trackingId: string;
  sponsored: true;
};

/**
 * Cursos recomendados exibidos ao lado do botão "Ver vídeo" no catálogo e na página do programa.
 * Adicione aqui novos links de afiliado Hotmart (`https://go.hotmart.com/...`) conforme se afiliar
 * em https://app.hotmart.com/market/search.
 */
export const PROGRAM_RECOMMENDED_COURSES: Record<string, ProgramRecommendedCourse> = {
  'trafego-pago-negocios-locais': {
    label: 'Melhor curso disto',
    courseTitle: 'Formação em Gestão de Tráfego Pago',
    href: 'https://go.hotmart.com/R108704338H',
    trackingId: 'hotmart-course-trafego-pago-negocios-locais',
    sponsored: true,
  },
};

/**
 * Slugs de oportunidades práticas elegíveis para receber um link de curso recomendado da Hotmart.
 */
export const COURSE_ELIGIBLE_PROGRAM_SLUGS = [
  'trafego-pago-negocios-locais',
  'automacao-ia-negocios-locais',
  'producao-videos-ia',
  'edicao-cortes-virais-ia',
  'canal-dark-youtube-notebooklm',
  'micro-saas-vibe-coding',
  'otimizacao-google-meu-negocio',
  'amazon-kdp-ebooks',
  'printful-print-on-demand',
  'loja-templates-etsy-gumroad',
  'comunidades-pagas-skool-systeme',
  'marketplaces-afiliados',
  'sourcing-importacao-revenda',
  'milhas-cashback-pontos',
  'fiverr',
  'upwork',
] as const;

export function getRecommendedCourseForProgram(slug: string): ProgramRecommendedCourse | null {
  return PROGRAM_RECOMMENDED_COURSES[slug] ?? null;
}
