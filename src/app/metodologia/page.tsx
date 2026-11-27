import type { Metadata } from 'next';
import Link from 'next/link';
import { getPartnerPrograms } from '@/actions/partner-programs';
import {
  CatalogStatsBox,
  computeProgramCatalogStats,
} from '@/components/seo/catalog-stats-box';
import { JsonLd } from '@/components/seo/json-ld';
import {
  SCHEMA_IDS,
  SITE_CONTENT_LAST_MODIFIED,
} from '@/lib/seo/schema-graph';
import { getAllStringsCatalog } from '@/lib/seo/string-catalog-all';
import { absoluteSiteUrl } from '@/lib/site';

export const revalidate = 3600;

const PAGE_URL = absoluteSiteUrl('/metodologia');

export const metadata: Metadata = {
  title: 'Metodologia de Verificação e Curadoria',
  description:
    'Critérios públicos do Portal NKL para checagem de plataformas de renda extra, regras antifraude, independência de afiliados e análise técnica de cordas para violino.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Portal NKL',
    title: 'Metodologia de Verificação e Curadoria | Portal NKL',
    description:
      'Como o Portal NKL verifica plataformas de renda extra e avalia encordoamentos de violino considerando acústica, durabilidade e clima do Brasil.',
    url: PAGE_URL,
  },
};

const INCOME_GATES = [
  {
    step: '01',
    title: 'Portão 1: Cobrança zero na entrada',
    detail:
      'Nenhuma plataforma listada pode exigir depósito prévio, taxa de ativação, compra de pacote ou pagamento para liberar saques.',
  },
  {
    step: '02',
    title: 'Portão 2: Elegibilidade real no Brasil',
    detail:
      'Verificamos se residentes no Brasil conseguem concluir cadastro, passar na checagem de identidade e quais idiomas são obrigatórios.',
  },
  {
    step: '03',
    title: 'Portão 3: Trilhos de saque e taxas',
    detail:
      'Conferimos moeda de pagamento (BRL ou USD), meios suportados (Pix, PayPal, Wise, Payoneer), mínimo de saque e prazos praticados.',
  },
  {
    step: '04',
    title: 'Portão 4: Expectativa de ganho sem exagero',
    detail:
      'Documentamos faixas realistas de retorno, necessidade de testes qualificatórios, variação de demanda e tempo de curva inicial.',
  },
  {
    step: '05',
    title: 'Portão 5: Nota híbrida e revisão contínua',
    detail:
      'A nota final combina avaliação editorial e relatos verificados da comunidade, com proteção contra avaliações duplicadas ou automatizadas.',
  },
] as const;

const STRING_CRITERIA = [
  {
    title: 'Materiais do núcleo',
    detail:
      'Classificamos cordas de núcleo sintético multifilamento, aço sólido ou trançado e tripa natural ou revestida, observando estabilidade de tensão e tempo de assentamento.',
  },
  {
    title: 'Acústica e resposta',
    detail:
      'Avaliamos equilíbrio entre brilho e calor (cor sonora), projeção em sala aberta ou captação próxima e velocidade de resposta do arco em passagens articuladas.',
  },
  {
    title: 'Umidade e clima do Brasil',
    detail:
      'Consideramos o desgaste em regiões litorâneas quentes e úmidas, maresia, suor ácido e variações bruscas de umidade entre regiões secas e úmidas sobre afinação e oxidação.',
  },
  {
    title: 'Faixa de preço e avaliações',
    detail:
      'Monitoramos preços reais praticados no mercado brasileiro em reais (BRL), custo por vida útil e pontuação média registrada por violinistas e luthiers na escala de 0 a 10.',
  },
] as const;

function resolveLastModified(
  programLastVerifiedIso: string,
  stringDates: Array<Date | string | null | undefined>,
): string {
  let maxMs = Date.parse(programLastVerifiedIso);
  if (!Number.isFinite(maxMs)) {
    maxMs = Date.parse(SITE_CONTENT_LAST_MODIFIED);
  }

  for (const rawDate of stringDates) {
    if (!rawDate) continue;
    const ms =
      rawDate instanceof Date ? rawDate.getTime() : Date.parse(rawDate);
    if (Number.isFinite(ms) && ms > maxMs) {
      maxMs = ms;
    }
  }

  return new Date(maxMs).toISOString();
}

export default async function MetodologiaPage() {
  const [programs, strings] = await Promise.all([
    getPartnerPrograms().catch(() => []),
    getAllStringsCatalog().catch(() => []),
  ]);

  const programStats = computeProgramCatalogStats(programs);
  const dateModified = resolveLastModified(
    programStats.lastVerifiedIso,
    strings.map((entry) => entry.updatedAt),
  );
  const formattedUpdated = new Date(dateModified).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl px-4 pt-8 pb-16">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebPage',
              '@id': `${PAGE_URL}#webpage`,
              url: PAGE_URL,
              name: 'Metodologia de Verificação e Curadoria do Portal NKL',
              description:
                'Critérios públicos do Portal NKL para verificação de plataformas de renda extra, independência de afiliados e classificação técnica de cordas para violino.',
              inLanguage: 'pt-BR',
              dateModified,
              author: { '@id': SCHEMA_IDS.author },
              publisher: { '@id': SCHEMA_IDS.organization },
              isPartOf: { '@id': SCHEMA_IDS.website },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Portal NKL',
                  item: absoluteSiteUrl('/'),
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Metodologia',
                  item: PAGE_URL,
                },
              ],
            },
          ],
        }}
      />

      <header className="rounded-3xl border border-border bg-income-surface/90 p-6 md:p-10">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
          <span className="text-neon">Transparência editorial</span>
          <span className="opacity-40">/</span>
          <span className="rounded-full border border-border bg-income-card/80 px-3 py-1 text-[11px] tracking-normal normal-case text-foreground">
            {strings.length} encordoamentos catalogados
          </span>
          <span className="rounded-full border border-border bg-income-card/80 px-3 py-1 text-[11px] tracking-normal normal-case text-foreground">
            Atualizado em {formattedUpdated}
          </span>
        </div>

        <h1 className="mt-4 font-playfair text-3xl font-bold leading-tight text-foreground md:text-5xl">
          Metodologia de Verificação e Curadoria
        </h1>

        <p className="mt-4 rounded-2xl border border-neon/30 bg-income-card/80 p-4 text-sm leading-relaxed text-foreground md:p-5 md:text-base">
          <strong>Resumo direto:</strong> o Portal NKL só publica plataformas de
          renda extra que passam por 5 portões de verificação com política
          estrita de cobrança zero na entrada, e classifica cordas para violino
          por núcleo, resposta acústica, adaptação ao clima brasileiro e nota da
          comunidade. Nenhuma empresa compra posição no catálogo.
        </p>
      </header>

      <div className="mt-8">
        <CatalogStatsBox programs={programs} />
      </div>

      <section className="mt-10 space-y-5" aria-labelledby="renda-extra-gates">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">
            Frente 1 · Economia digital e trabalho remoto
          </p>
          <h2
            id="renda-extra-gates"
            className="mt-1 font-playfair text-2xl font-bold text-foreground md:text-3xl"
          >
            Os 5 portões de verificação para Renda Extra
          </h2>
          <p className="mt-2 text-sm leading-relaxed opacity-80">
            Cada oportunidade listada em{' '}
            <Link href="/programas" className="font-bold text-neon hover:underline">
              /programas
            </Link>{' '}
            passa por checagem manual antes da publicação e entra em revisão
            sempre que regras de saque ou disponibilidade no Brasil mudam.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {INCOME_GATES.map((gate) => (
            <article
              key={gate.step}
              className="rounded-2xl border border-border bg-income-surface/80 p-5"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon">
                Etapa {gate.step}
              </p>
              <h3 className="mt-1 font-playfair text-lg font-bold text-foreground">
                {gate.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed opacity-80">
                {gate.detail}
              </p>
            </article>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-income-card/80 p-5">
            <h3 className="font-playfair text-xl font-bold text-foreground">
              Regras antifraude e exclusão imediata
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed opacity-80">
              <li>
                Bloqueamos plataformas que exigem Pix, compra de níveis ou
                depósito de garantia para liberar tarefas.
              </li>
              <li>
                Rejeitamos promessas de ganho diário fixo ou lucro automático sem
                prestação de serviço ou entrega real.
              </li>
              <li>
                Removemos ou rebaixamos serviços com relatos recorrentes de
                retenção indevida de saldo ou suporte inativo.
              </li>
            </ul>
          </article>

          <article className="rounded-2xl border border-border bg-income-card/80 p-5">
            <h3 className="font-playfair text-xl font-bold text-foreground">
              Independência editorial e links de afiliados
            </h3>
            <p className="mt-3 text-sm leading-relaxed opacity-80">
              Parte dos botões de acesso pode conter links de indicação ou
              parceria comercial. Quando você se cadastra por esses links, o
              Portal NKL pode receber uma comissão da plataforma parceira sem
              nenhum custo extra para você.
            </p>
            <p className="mt-2 text-sm leading-relaxed opacity-80">
              Essa receita ajuda a manter o portal gratuito, mas não compra
              aprovação nos 5 portões, não altera prós e contras e não modifica a
              nota editorial nem a ordenação padrão por mérito.
            </p>
          </article>
        </div>
      </section>

      <section className="mt-10 space-y-5" aria-labelledby="cordas-criterios">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">
            Frente 2 · NKL Cordas e Acústica
          </p>
          <h2
            id="cordas-criterios"
            className="mt-1 font-playfair text-2xl font-bold text-foreground md:text-3xl"
          >
            Como avaliamos cordas de violino ({strings.length} encordoamentos catalogados)
          </h2>
          <p className="mt-2 text-sm leading-relaxed opacity-80">
            No acervo de{' '}
            <Link href="/catalogo" className="font-bold text-neon hover:underline">
              /catalogo
            </Link>{' '}
            e no comparador de{' '}
            <Link href="/comparar" className="font-bold text-neon hover:underline">
              /comparar
            </Link>
            , cruzamos especificações de fabricante com comportamento real em
            instrumentos de estudo e concerto sob condições climáticas do Brasil.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {STRING_CRITERIA.map((criterion) => (
            <article
              key={criterion.title}
              className="rounded-2xl border border-border bg-income-surface/80 p-5"
            >
              <h3 className="font-playfair text-lg font-bold text-foreground">
                {criterion.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed opacity-80">
                {criterion.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="mt-10 rounded-2xl border border-border bg-income-surface/85 p-6"
        aria-labelledby="cadencia-correcoes"
      >
        <h2
          id="cadencia-correcoes"
          className="font-playfair text-2xl font-bold text-foreground"
        >
          Cadência de atualização e canal de correções
        </h2>
        <p className="mt-3 text-sm leading-relaxed opacity-85">
          Os dados do catálogo de renda extra e da base de encordoamentos são
          revisados continuamente conforme alterações de políticas de pagamento,
          variação cambial, descontinuação de modelos e novos relatos da
          comunidade.
        </p>
        <p className="mt-2 text-sm leading-relaxed opacity-85">
          Encontrou uma informação desatualizada, mudança em taxa de saque ou
          divergência técnica em algum encordoamento? Envie a referência para{' '}
          <a
            href="mailto:contato@nkloficial.com.br"
            className="font-bold text-neon hover:underline"
          >
            contato@nkloficial.com.br
          </a>{' '}
          ou acesse a página de{' '}
          <Link href="/contatos" className="font-bold text-neon hover:underline">
            contatos oficiais
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
