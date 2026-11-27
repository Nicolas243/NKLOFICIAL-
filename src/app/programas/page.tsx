import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import Link from 'next/link';
import { getPartnerPrograms } from '@/actions/partner-programs';
import { PartnerProgramsBrowser } from '@/components/partner-programs-browser';
import { CatalogStatsBox } from '@/components/seo/catalog-stats-box';
import { JsonLd } from '@/components/seo/json-ld';
import { ProgramCompare } from '@/components/program-compare';
import { IncomeWizard } from '@/components/income/income-wizard';
import { EditorialSupportOffers } from '@/components/income/editorial-support-offers';
import { INCOME_PORTAL_ROUTES } from '@/lib/income-portal';
import { PROGRAM_COMPARISONS } from '@/lib/seo/program-comparisons';
import {
  buildProgramsDatasetNode,
  SCHEMA_IDS,
  SITE_CONTENT_LAST_MODIFIED,
} from '@/lib/seo/schema-graph';
import { absoluteSiteUrl } from '@/lib/site';
import { PROGRAM_HUBS } from '@/lib/program-hubs';
import { getActiveAdSlots, getAdPricing, type ActiveAdSlot } from '@/lib/ad-inventory';
import { getMicro1Opportunities } from '@/lib/micro1-opportunities';

const RENDA_EXTRA_FAQS = [
  {
    question: 'Qual é a melhor forma de fazer renda extra em 2026?',
    answer: 'Não existe uma única opção ideal para todo mundo. Quem busca retorno sem capital inicial costuma começar com treinamento de IA, testes de usabilidade, pesquisas acadêmicas (Prolific/Dscout) ou criação de conteúdo UGC; quem já domina serviços digitais, automação ou afiliados consegue escalar ganhos maiores.',
  },
  {
    question: 'Como fazer renda extra pelo celular sem investir nada?',
    answer: 'Você pode atuar com microtarefas e projetos no celular (Clickworker, OneForma, AppHub, Billo), indicações de aplicativos financeiros e programas de afiliados da Shopee, Mercado Livre e Amazon usando apenas redes sociais ou links diretos.',
  },
  {
    question: 'Quais plataformas realmente pagam em dólar para brasileiros?',
    answer: 'Plataformas globais como Outlier AI, Micro1, DataAnnotation, Prolific, Dscout, uTest, Testlio, Fiverr e Upwork remuneram em USD via PayPal, Wise ou Payoneer conforme aprovação em testes, perfil e disponibilidade de tarefas.',
  },
  {
    question: 'Dá para fazer renda extra usando Inteligência Artificial?',
    answer: 'Sim. Há duas frentes reais: avaliar e treinar respostas de modelos de IA em plataformas especializadas, ou oferecer serviços produtivos com apoio de IA (cortes virais, automação com Make, roteiros, criação de e-books para Amazon KDP e gestão de negócios locais).',
  },
  {
    question: 'Quanto tempo leva para receber o primeiro saque?',
    answer: 'O prazo varia por plataforma: tarefas rápidas e afiliados locais costumam liberar em 7 a 30 dias após confirmação; projetos globais em dólar normalmente pagam semanalmente ou quinzenalmente após atingir o valor mínimo de saque.',
  },
  {
    question: 'Como saber se uma plataforma de renda extra é confiável e evitar golpes?',
    answer: 'Plataformas legítimas nunca cobram taxa para liberar cadastro, tarefa ou saque. Confira métodos de pagamento transparentes, regras claras de elegibilidade, suporte real e histórico editorial antes de enviar documentos ou investir tempo.',
  },
  {
    question: 'Preciso abrir MEI ou CNPJ para declarar renda extra online no Brasil?',
    answer: 'Para ganhos esporádicos no início, os recebimentos podem ser declarados como Pessoa Física via Carnê-Leão quando aplicável, inclusive para valores vindos do exterior. Quando a atividade se torna recorrente ou exige nota fiscal para clientes e plataformas, a formalização via MEI ou outro regime de CNPJ costuma organizar os tributos e o recolhimento mensal. Como faixas de isenção, alíquotas e atividades permitidas no MEI mudam periodicamente, confirme os limites vigentes com um contador.',
  },
  {
    question: 'Qual a diferença prática entre freelance, afiliados, UGC e treinamento de IA?',
    answer: 'No freelance você vende uma entrega sob demanda para um cliente específico (design, texto, código ou automação). Em afiliados, recebe comissão por vendas geradas pelos seus links sem prestar serviço direto. No UGC, grava vídeos curtos ou fotos para marcas usarem em campanhas sem precisar de audiência própria. Já no treinamento de IA, avalia respostas, grava áudios ou revisa tarefas técnicas por hora ou por tarefa aprovada.',
  },
  {
    question: 'Como verificar em 3 minutos se uma plataforma de renda extra é confiável?',
    answer: 'Faça três checagens rápidas antes de criar conta: primeiro, confira se o domínio oficial bate com a marca e tem termos de uso públicos e canal de suporte; segundo, confirme a regra de depósito zero — nunca pague taxa adiantada para liberar tarefas ou desbloquear saque; terceiro, verifique o valor mínimo de saque e os métodos aceitos no Brasil (Pix, PayPal, Wise ou Payoneer).',
  },
] as const;

const getCachedPartnerPrograms = unstable_cache(
  async () => getPartnerPrograms(),
  ['programas-page-catalog'],
  { revalidate: 300 },
);

const getCachedActiveAdSlots = unstable_cache(
  async () => getActiveAdSlots(),
  ['programas-page-ad-slots'],
  { revalidate: 120 },
);

const getCachedMicro1Opportunities = unstable_cache(
  async () => getMicro1Opportunities(),
  ['programas-page-micro1'],
  { revalidate: 300 },
);

export const metadata: Metadata = {
  title: 'Renda Extra 2026: 55+ Formas Reais e Plataformas Verificadas',
  description: 'Descubra mais de 55 formas reais de fazer renda extra online, pelo celular, em dólar, sem investimento inicial ou com IA. Comparativo atualizado sem promessas fáceis.',
  keywords: [
    'renda extra',
    'como ganhar renda extra',
    'renda extra online',
    'renda extra pelo celular',
    'renda extra sem investimento',
    'plataformas que pagam em dólar',
    'renda extra com ia',
    'programas de afiliados',
  ],
  alternates: {
    canonical: absoluteSiteUrl(INCOME_PORTAL_ROUTES.catalog),
  },
  openGraph: {
    type: 'website',
    title: 'Renda Extra 2026: 55+ Formas Reais | Portal NKL',
    description: 'Mais de 55 caminhos reais de renda extra online, em dólar, pelo celular, sem investimento ou com IA — com requisitos, ferramentas e comparador.',
    url: absoluteSiteUrl(INCOME_PORTAL_ROUTES.catalog),
    images: [
      {
        url: absoluteSiteUrl('/images/areas/renda-extra.jpg'),
        width: 960,
        height: 540,
        alt: 'Catálogo de 55+ formas reais de renda extra no Portal NKL',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Renda Extra 2026: 55+ Formas Reais | Portal NKL',
    description: 'Compare 55+ plataformas e estratégias reais de renda extra online, em dólar, pelo celular ou com IA.',
    images: [absoluteSiteUrl('/images/areas/renda-extra.jpg')],
  },
};

export const revalidate = 300;

export default async function PartnerProgramsPage() {
  const [programs, adSlots, micro1Result] = await Promise.all([
    getCachedPartnerPrograms(),
    getCachedActiveAdSlots().catch((error: unknown) => {
      console.error('[PROGRAMS_PAGE] Falha ao carregar inventário publicitário:', error);
      return [] as ActiveAdSlot[];
    }),
    getCachedMicro1Opportunities().then((opportunities) => ({ opportunities, error: null as string | null })).catch((error: unknown) => {
      console.error('[PROGRAMS_PAGE] Falha ao carregar oportunidades da Micro1:', error);
      return {
        opportunities: [],
        error: error instanceof Error ? error.message : 'Não foi possível consultar a fonte pública.',
      };
    }),
  ]);
  const adPricing = getAdPricing();
  const wizardPrograms = programs.map((program) => ({
    slug: program.slug,
    name: program.name,
    category: program.category,
    difficulty: program.difficulty,
    shortDescription: program.shortDescription,
    tags: program.tags,
    requirements: program.requirements,
    averageEarning: program.averageEarning,
    finalRating: program.finalRating,
    languages: program.languages,
    zeroInvestmentRequired: program.zeroInvestmentRequired,
  }));
  const comparePrograms = programs.map((program) => ({
    slug: program.slug,
    name: program.name,
    averageEarning: program.averageEarning,
    languages: program.languages,
    difficulty: program.difficulty,
    finalRating: program.finalRating,
    requirements: program.requirements,
  }));
  const categoryCount = new Set(programs.map((program) => program.category)).size;
  const catalogUrl = absoluteSiteUrl(INCOME_PORTAL_ROUTES.catalog);
  const latestVerifiedIso = programs.reduce<string>((latest, program) => {
    if (!program.lastVerifiedAt) return latest;
    return program.lastVerifiedAt > latest ? program.lastVerifiedAt : latest;
  }, SITE_CONTENT_LAST_MODIFIED);
  const topComparisons = PROGRAM_COMPARISONS.slice(0, 6);

  return (
    <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-0 md:pb-20">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CollectionPage',
            '@id': `${catalogUrl}#webpage`,
            name: 'Renda Extra 2026: 55+ Formas Reais e Plataformas Verificadas',
            description: 'Catálogo editorial com mais de 55 formas reais de gerar renda extra online, pelo celular, em dólar, como afiliado ou usando Inteligência Artificial.',
            url: catalogUrl,
            inLanguage: 'pt-BR',
            dateModified: latestVerifiedIso,
            isPartOf: { '@id': SCHEMA_IDS.website },
            publisher: { '@id': SCHEMA_IDS.organization },
            mainEntity: { '@id': SCHEMA_IDS.programsDataset },
          },
          buildProgramsDatasetNode(programs.length, latestVerifiedIso),
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Portal NKL', item: absoluteSiteUrl('/') },
              { '@type': 'ListItem', position: 2, name: 'Renda Extra', item: catalogUrl },
            ],
          },
          {
            '@type': 'ItemList',
            name: 'Oportunidades de renda extra do Portal NKL',
            numberOfItems: programs.length,
            itemListElement: programs.map((program, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: program.name,
              url: absoluteSiteUrl(`/programas/${program.slug}`),
            })),
          },
          {
            '@type': 'FAQPage',
            mainEntity: RENDA_EXTRA_FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          },
        ],
      }} />
      <header className="relative mb-6 overflow-hidden rounded-[1.5rem] border border-border bg-income-surface/90 px-5 py-8 shadow-[0_20px_60px_rgba(70,55,35,0.12)] md:mb-8 md:rounded-[2rem] md:px-12 md:py-12">
        <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-neon/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:gap-10 lg:items-end">
          <div className="relative z-10 mb-1 flex justify-end lg:absolute lg:right-0 lg:top-0 lg:mb-0">
            <IncomeWizard programs={wizardPrograms} />
          </div>
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-neon md:mb-5 md:tracking-[0.28em]">Renda Extra NKL · {programs.length} formas reais catalogadas</p>
            <h1 className="font-playfair text-4xl font-bold leading-[1.05] md:text-7xl">
              Renda extra sem cair em promessa fácil.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed opacity-75 md:mt-6 md:text-lg">
              Um catálogo completo com {programs.length} formas reais de gerar renda extra — sem investimento inicial ou com capital enxuto — mostrando ferramentas práticas e critérios claros antes de você começar.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 md:mt-8">
              <a href="#catalogo" className="rounded-md bg-neon px-5 py-3 text-sm font-bold text-black transition-transform hover:-translate-y-0.5">
                Explorar oportunidades
              </a>
              <a href="#como-funciona" className="rounded-md border border-border px-5 py-3 text-sm font-bold transition-colors hover:border-neon hover:text-neon">
                Como escolher
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:max-w-xs lg:justify-self-end">
            <div className="rounded-2xl border border-border bg-income-card/80 p-4">
              <p className="text-3xl font-bold text-neon">{programs.length}</p>
              <p className="mt-1 text-xs leading-relaxed opacity-65">formas reais de renda extra catalogadas</p>
            </div>
            <div className="rounded-2xl border border-border bg-income-card/80 p-4">
              <p className="text-3xl font-bold text-neon">{categoryCount}</p>
              <p className="mt-1 text-xs leading-relaxed opacity-65">categorias e frentes de ganho</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-neon/30 bg-income-card/80 p-4">
              <p className="text-sm font-bold">A ideia é simples</p>
              <p className="mt-1 text-sm leading-relaxed opacity-70">menos hype, mais contexto para você decidir.</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mb-5 md:mb-8">
        <CatalogStatsBox programs={programs} />
      </div>

      <section className="mb-5 grid gap-4 rounded-2xl border border-orange/30 bg-orange/5 p-5 md:mb-8 md:grid-cols-[1fr_auto] md:items-center md:p-6" aria-labelledby="guide-cta-title">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Quer decidir com menos ruído?</p>
          <h2 id="guide-cta-title" className="mt-2 font-playfair text-2xl font-bold md:text-3xl">Receba o mapa prático de renda extra</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed opacity-75">Cinco arquivos para comparar oportunidades, organizar critérios e escolher seu próximo passo sem promessa fácil.</p>
        </div>
        <Link href="/guias/renda-extra?cta_variant=2" className="inline-flex min-h-11 items-center justify-center rounded-md bg-orange px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-orange-dark">
          Ver o pacote
        </Link>
      </section>

      <section className="mb-5 grid gap-4 rounded-2xl border border-neon/30 bg-income-surface/85 p-5 md:mb-8 md:grid-cols-[1fr_auto] md:items-center md:p-6" aria-labelledby="business-quiz-cta-title">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Não sabe por onde começar?</p>
          <h2 id="business-quiz-cta-title" className="mt-2 font-playfair text-2xl font-bold md:text-3xl">Use a Bússola de Negócios</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed opacity-75">
            Avalie seu tempo disponível, capital inicial, afinidade com tecnologia e tolerância a risco para receber seus 3 melhores caminhos reais de negócio ou renda extra.
          </p>
        </div>
        <Link href="/quiz-negocios" className="inline-flex min-h-11 items-center justify-center rounded-md border border-neon bg-neon/10 px-5 py-3 text-center text-sm font-bold text-neon transition hover:bg-neon hover:text-black">
          Abrir Bússola de Negócios
        </Link>
      </section>

      <details id="como-funciona" className="mb-5 md:mb-8">
        <summary className="cursor-pointer rounded-xl border border-border bg-income-surface/70 px-4 py-3 text-sm font-bold transition-colors hover:border-neon">
          Como escolher uma oportunidade
        </summary>
        <div className="mt-3 grid gap-3 md:grid-cols-3 md:gap-4">
          {[
            ['01', 'Escolha seu ponto de partida', 'Você quer gravar, pesquisar, vender serviços, indicar ou usar o tempo ocioso?'],
            ['02', 'Leia antes de se cadastrar', 'Veja dificuldade, tags, contexto editorial e as condições que podem variar.'],
            ['03', 'Teste com expectativa realista', 'Comece pequeno, proteja seus dados e nunca pague para liberar uma promessa.'],
          ].map(([number, title, description]) => (
            <article key={number} className="rounded-2xl border border-border bg-income-surface/70 p-5">
              <p className="text-xs font-bold tracking-[0.2em] text-neon">{number}</p>
              <h2 className="mt-3 font-playfair text-2xl font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed opacity-65">{description}</p>
            </article>
          ))}
        </div>
      </details>

      <details id="guias-intencao" className="mb-5 md:mb-8">
        <summary className="cursor-pointer rounded-xl border border-border bg-income-surface/70 px-4 py-3 transition-colors hover:border-neon">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Guias de escolha</span>
          <span className="mt-1 block font-playfair text-2xl font-bold">Comece pela sua situação</span>
          <span className="mt-1 block text-sm leading-relaxed opacity-70">Abra para comparar caminhos por objetivo, tempo e contexto.</span>
        </summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {Object.values(PROGRAM_HUBS).map((hub) => (
            <Link key={hub.slug} href={`/programas/${hub.slug}`} className="rounded-xl border border-border bg-income-surface/70 p-4 transition-colors hover:border-neon hover:bg-income-surface">
              <h3 className="font-bold">{hub.title}</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-65">{hub.description}</p>
              <span className="mt-3 inline-flex text-sm font-bold text-neon">Ver guia →</span>
            </Link>
          ))}
          <Link href="/programas/iniciantes" className="rounded-xl border border-border bg-income-surface/70 p-4 transition-colors hover:border-neon hover:bg-income-surface">
            <h3 className="font-bold">Renda extra para iniciantes</h3>
            <p className="mt-2 text-sm leading-relaxed opacity-65">Caminhos com entrada simples ou curva moderada para dar os primeiros passos sem se perder.</p>
            <span className="mt-3 inline-flex text-sm font-bold text-neon">Ver guia →</span>
          </Link>
          <Link href="/programas/dolar" className="rounded-xl border border-border bg-income-surface/70 p-4 transition-colors hover:border-neon hover:bg-income-surface">
            <h3 className="font-bold">Oportunidades pagas em dólar</h3>
            <p className="mt-2 text-sm leading-relaxed opacity-65">Plataformas com referência de pagamento em USD, métodos de saque e exigências de idioma.</p>
            <span className="mt-3 inline-flex text-sm font-bold text-neon">Ver guia →</span>
          </Link>
        </div>
      </details>

      <div id="catalogo">
        <PartnerProgramsBrowser
          programs={programs}
          micro1Opportunities={micro1Result.opportunities}
          micro1Error={micro1Result.error}
          adSlots={adSlots}
          adPriceCents={adPricing.monthlyPriceCents}
          adPromotionActive={adPricing.isPromotionActive}
        />
      </div>
      <div className="mt-8 md:mt-12">
        <ProgramCompare programs={comparePrograms} />
      </div>
      <section className="mt-8 rounded-2xl border border-border bg-income-surface/85 p-5 md:mt-10 md:p-6" aria-labelledby="comparativos-diretos-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Comparação editorial</p>
            <h2 id="comparativos-diretos-title" className="mt-1 font-playfair text-2xl font-bold">
              Comparativos diretos mais buscados
            </h2>
          </div>
          <Link href="/metodologia" className="text-sm font-bold text-neon hover:underline">
            Ver critérios de verificação →
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topComparisons.map((pair) => (
            <Link
              key={pair.slug}
              href={`/programas/comparar/${pair.slug}`}
              className="rounded-xl border border-border bg-income-card/80 p-4 transition-colors hover:border-neon"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-neon">{pair.focusKeyword}</p>
              <p className="mt-1 font-bold">{pair.title}</p>
            </Link>
          ))}
        </div>
      </section>
      <EditorialSupportOffers />

      <section id="perguntas-frequentes" className="mt-10 rounded-2xl border border-border bg-income-surface/90 p-5 md:mt-14 md:p-8" aria-labelledby="faq-renda-extra-title">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Perguntas frequentes</p>
        <h2 id="faq-renda-extra-title" className="mt-2 font-playfair text-2xl font-bold md:text-3xl">
          Dúvidas comuns sobre renda extra online
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {RENDA_EXTRA_FAQS.map((faq) => (
            <article key={faq.question} className="rounded-xl border border-border bg-income-card/80 p-4 md:p-5">
              <h3 className="font-bold text-base">{faq.question}</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-75">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <details className="mt-10 rounded-2xl border border-border bg-income-surface/90 p-4 md:mt-16 md:p-6">
        <summary className="cursor-pointer text-sm font-bold transition-colors hover:text-neon">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Transparência editorial</span>
          <span className="ml-2">Sobre links de parceria</span>
        </summary>
        <div className="mt-3 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <p className="max-w-3xl text-sm leading-relaxed opacity-70">
            O Portal NKL pode receber comissão por alguns links de parceria. Isso não aumenta seu custo e não compra uma avaliação positiva. Confirme regras, disponibilidade e pagamento diretamente na plataforma antes de começar.
          </p>
          <a href="#catalogo" className="text-sm font-bold text-neon hover:underline">Voltar ao catálogo</a>
        </div>
      </details>
    </div>
  );
}
