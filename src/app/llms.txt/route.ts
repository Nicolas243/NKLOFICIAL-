import { getPartnerPrograms } from '@/actions/partner-programs';
import { PAID_PRODUCT_SLUGS, getProductBySlug } from '@/config/products';
import { INCOME_PORTAL_ROUTES } from '@/lib/income-portal';
import { PROGRAM_HUBS } from '@/lib/program-hubs';
import { PROGRAM_COMPARISONS } from '@/lib/seo/program-comparisons';
import { getAllStringsCatalog } from '@/lib/seo/string-catalog-all';
import { STRING_COMPARISONS } from '@/lib/seo/string-comparisons';
import { absoluteSiteUrl } from '@/lib/site';

export const revalidate = 3600;

type LanguageGuideItem = {
  slug: string;
  name: string;
  note: string;
};

const LANGUAGE_GUIDES: readonly LanguageGuideItem[] = [
  { slug: 'ingles', name: 'Inglês', note: '100 lições com tradução por cores e plano de 90 dias' },
  { slug: 'espanhol', name: 'Espanhol', note: 'Diálogos práticos, falsos amigos e plano de 90 dias' },
  { slug: 'italiano', name: 'Italiano', note: 'Estruturas essenciais, ritmo de fala e plano de 90 dias' },
  { slug: 'frances', name: 'Francês', note: 'Pronúncia, vogais nasais e plano de 90 dias' },
  { slug: 'alemao', name: 'Alemão', note: 'Ordem das frases, artigos e plano de 90 dias' },
  { slug: 'chines', name: 'Mandarim', note: 'Tons, pinyin com áudio e plano de 90 dias' },
];

export async function GET(): Promise<Response> {
  const [programs, strings] = await Promise.all([
    getPartnerPrograms().catch(() => []),
    getAllStringsCatalog().catch(() => []),
  ]);

  const topPrograms = [...programs]
    .sort((a, b) => b.finalRating - a.finalRating || b.editorialRating - a.editorialRating)
    .slice(0, 12);

  const lines: string[] = [
    '# Portal NKL',
    '',
    '> Portal brasileiro com catálogos verificados de renda extra e trabalho remoto, catálogo técnico de cordas de violino, guias gratuitos de 6 idiomas e ferramentas práticas com IA em português.',
    '',
    '## Renda Extra',
    '',
    `- [Catálogo de Renda Extra](${absoluteSiteUrl(INCOME_PORTAL_ROUTES.catalog)}): ${programs.length} oportunidades revisadas com requisitos, meios de pagamento, idiomas e nota editorial.`,
    `- [Metodologia Editorial](${absoluteSiteUrl('/metodologia')}): Critérios de avaliação, pontuação, verificação periódica e regras de divulgação.`,
    `- [Renda Extra para Iniciantes](${absoluteSiteUrl(INCOME_PORTAL_ROUTES.beginnerPrograms)}): Caminhos selecionados para quem está começando do zero.`,
    `- [Renda Extra em Dólar](${absoluteSiteUrl(INCOME_PORTAL_ROUTES.dollarPrograms)}): Plataformas internacionais com recebimento em moeda estrangeira.`,
    ...Object.values(PROGRAM_HUBS).map(
      (hub) => `- [${hub.title}](${absoluteSiteUrl(`/programas/${hub.slug}`)}): ${hub.description}`,
    ),
    ...PROGRAM_COMPARISONS.map(
      (item) => `- [${item.title}](${absoluteSiteUrl(`/programas/comparar/${item.slug}`)})`,
    ),
    ...topPrograms.map(
      (program) =>
        `- [${program.name}](${absoluteSiteUrl(`/programas/${program.slug}`)}): ${program.category} | Média ${program.averageEarning} | Nota ${program.finalRating.toFixed(1)}/10`,
    ),
    '',
    '## Cordas de Violino',
    '',
    `- [Naipe de Cordas — Música](${absoluteSiteUrl('/musica/naipe_cordas')}): Hub principal para violinistas, professores e luthiers no Brasil.`,
    `- [Catálogo Técnico de Cordas](${absoluteSiteUrl('/catalogo')}): ${strings.length} modelos de cordas com núcleo, projeção, timbre, durabilidade, clima e preço real.`,
    `- [Comparador Interativo de Cordas](${absoluteSiteUrl('/comparar')}): Compare especificações lado a lado antes de comprar.`,
    ...STRING_COMPARISONS.map(
      (item) => `- [${item.title}](${absoluteSiteUrl(`/comparar/${item.slug}`)})`,
    ),
    `- [Diretório de Luthiers](${absoluteSiteUrl('/luthiers')}): Oficinas e profissionais de ajuste e manutenção no Brasil.`,
    `- [Lojas Recomendadas](${absoluteSiteUrl('/lojas')}): Lojas e fornecedores para cordas e acessórios.`,
    `- [Professores de Violino](${absoluteSiteUrl('/professores')}): Diretório de professores por cidade e modalidade.`,
    `- [Física do Som](${absoluteSiteUrl('/fisica-do-som')}): Fundamentos acústicos de tensão, núcleo, projeção e resposta do arco.`,
    '',
    '## Guias de Idiomas',
    '',
    `- [Hub de Idiomas com IA](${absoluteSiteUrl('/idiomas')}): Visão geral das 6 trilhas de estudo com áudio e prática diária.`,
    ...LANGUAGE_GUIDES.flatMap((lang) => [
      `- [Guia de ${lang.name} (90 dias)](${absoluteSiteUrl(`/guias/${lang.slug}`)}): ${lang.note}.`,
      `- [Artigo Prático de ${lang.name}](${absoluteSiteUrl(`/blog/aprender/${lang.slug}`)}): Roteiro de estudo aplicado para trabalho remoto e viagens.`,
    ]),
    '',
    '## Ferramentas e Produtos',
    '',
    `- [Bússola de Negócios](${absoluteSiteUrl('/quiz-negocios')}): Ferramenta interativa com 50 critérios para identificar modelos de negócio compatíveis com rotina e capital.`,
    `- [IA na Prática](${absoluteSiteUrl('/ia')}): Trilha em português para aplicar inteligência artificial em textos, estudos e trabalho.`,
    ...PAID_PRODUCT_SLUGS.map((slug) => {
      const product = getProductBySlug(slug);
      if (!product) {
        return `- [${slug}](${absoluteSiteUrl(`/ofertas/${slug}`)})`;
      }
      return `- [${product.title}](${absoluteSiteUrl(product.offerRoute)}): ${product.headline} (${product.priceLabel})`;
    }),
    '',
    '## Versão Completa',
    '',
    `- [llms-full.txt](${absoluteSiteUrl('/llms-full.txt')}): Catálogo completo de programas de renda extra, todas as ${strings.length} cordas de violino, guias de idiomas e respostas de referência em PT-BR.`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
