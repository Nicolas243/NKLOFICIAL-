import type { Metadata } from 'next';
import Link from 'next/link';
import { getPartnerPrograms } from '@/actions/partner-programs';
import { PartnerProgramsBrowser } from '@/components/partner-programs-browser';
import { JsonLd } from '@/components/seo/json-ld';
import { ProgramCompare } from '@/components/program-compare';
import { IncomeWizard } from '@/components/income/income-wizard';
import { INCOME_PORTAL_ROUTES } from '@/lib/income-portal';
import { absoluteSiteUrl } from '@/lib/site';
import { PROGRAM_HUBS } from '@/lib/program-hubs';

export const metadata: Metadata = {
  title: 'Programas de Parceria e Renda Extra',
  description: 'Um mapa editorial para encontrar oportunidades de renda extra, freelancing, pesquisas, conteúdo e trabalho remoto.',
  alternates: {
    canonical: absoluteSiteUrl(INCOME_PORTAL_ROUTES.catalog),
  },
  openGraph: {
    type: 'website',
    title: 'Programas de Parceria e Renda Extra | Portal NKL',
    description: 'Um mapa editorial para encontrar oportunidades de renda extra, freelancing, pesquisas, conteúdo e trabalho remoto.',
    url: absoluteSiteUrl(INCOME_PORTAL_ROUTES.catalog),
  },
};

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PartnerProgramsPage({ searchParams }: { searchParams?: SearchParams }) {
  const programs = await getPartnerPrograms();
  const params = searchParams ? await searchParams : {};
  const getParam = (key: string): string | undefined => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const categoryCount = new Set(programs.map((program) => program.category)).size;

  return (
    <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-0 md:pb-20">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Oportunidades de renda extra do Portal NKL',
        itemListElement: programs.map((program, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: program.name,
          url: absoluteSiteUrl(`/programas/${program.slug}`),
        })),
      }} />
      <header className="relative mb-6 overflow-hidden rounded-[1.5rem] border border-border bg-income-surface/90 px-5 py-8 shadow-[0_20px_60px_rgba(70,55,35,0.12)] md:mb-8 md:rounded-[2rem] md:px-12 md:py-12">
        <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-neon/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:gap-10 lg:items-end">
          <div className="relative z-10 mb-1 flex justify-end lg:absolute lg:right-0 lg:top-0 lg:mb-0">
            <IncomeWizard programs={programs} />
          </div>
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-neon md:mb-5 md:tracking-[0.28em]">Renda Extra NKL · mapa de oportunidades</p>
            <h1 className="font-playfair text-4xl font-bold leading-[1.05] md:text-7xl">
              Renda extra sem cair em promessa fácil.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed opacity-75 md:mt-6 md:text-lg">
              Um catálogo para descobrir caminhos possíveis, entender como cada plataforma funciona e escolher o próximo passo com mais clareza.
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
              <p className="mt-1 text-xs leading-relaxed opacity-65">oportunidades catalogadas</p>
            </div>
            <div className="rounded-2xl border border-border bg-income-card/80 p-4">
            <p className="text-3xl font-bold text-neon">{categoryCount}</p>
            <p className="mt-1 text-xs leading-relaxed opacity-65">formas de começar</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-neon/30 bg-income-card/80 p-4">
              <p className="text-sm font-bold">A ideia é simples</p>
              <p className="mt-1 text-sm leading-relaxed opacity-70">menos hype, mais contexto para você decidir.</p>
            </div>
          </div>
        </div>
      </header>

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
        </div>
      </details>

      <div id="catalogo">
        <PartnerProgramsBrowser
          programs={programs}
          initialObjective={getParam('objetivo')}
          initialCurrency={getParam('moeda')}
          initialEnglish={getParam('ingles')}
        />
      </div>
      <div className="mt-8 md:mt-12">
        <ProgramCompare programs={programs} />
      </div>

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
