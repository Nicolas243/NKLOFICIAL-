import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStringDetails } from '@/actions/strings';
import { getReviewsByStringId, submitReview } from '@/actions/reviews';
import { isStringFavorite, toggleFavoriteString } from '@/actions/favorites';
import { FavoriteButton } from '@/components/favorite-button';
import { AffiliateLinks } from '@/components/affiliate-links';
import { BlufSummary } from '@/components/seo/bluf-summary';
import { JsonLd } from '@/components/seo/json-ld';
import { createClient } from '@/lib/supabase/server';
import {
  buildStringProductNode,
  SCHEMA_IDS,
  SITE_CONTENT_LAST_MODIFIED,
} from '@/lib/seo/schema-graph';
import { getStringComparisonsForName } from '@/lib/seo/string-comparisons';
import { absoluteSiteUrl } from '@/lib/site';

type Params = Promise<{ id: string }>;

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const { id } = await props.params;
  const stringData = await getStringDetails(id).catch(() => null);
  if (!stringData) {
    return { title: 'Corda não encontrada' };
  }
  const title = `${stringData.name} — Corda para Violino`;
  const description = `Especificações técnicas, projeção, cor do som, durabilidade e avaliações da corda ${stringData.name}.`;
  return {
    title,
    description,
    alternates: { canonical: absoluteSiteUrl(`/catalogo/${id}`) },
  };
}

function formatPrice(value: string | null): string {
  if (!value) return 'Consulte as ofertas';
  return `R$ ${value}`;
}

function formatAveragePrice(
  realPrice: string | null,
  priceMin: string | null,
  priceMax: string | null
): string {
  if (realPrice) return formatPrice(realPrice);

  const minimum = priceMin ? Number(priceMin) : null;
  const maximum = priceMax ? Number(priceMax) : null;
  if (minimum !== null && maximum !== null && Number.isFinite(minimum) && Number.isFinite(maximum)) {
    return formatPrice(((minimum + maximum) / 2).toFixed(2));
  }
  if (minimum !== null && Number.isFinite(minimum)) return formatPrice(minimum.toFixed(2));
  if (maximum !== null && Number.isFinite(maximum)) return formatPrice(maximum.toFixed(2));
  return 'Consulte as ofertas';
}

export default async function StringDetailsPage(props: { params: Params }) {
  const { id } = await props.params;
  const stringData = await getStringDetails(id);

  if (!stringData) {
    notFound();
  }

  // Sessão via SSR: o formulário só existe para usuários autenticados.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const reviews = await getReviewsByStringId(id);
  const isFavorite = user?.id ? await isStringFavorite(user.id, id) : false;

  const canonicalUrl = absoluteSiteUrl(`/catalogo/${id}`);
  const hasValidUpdatedAt =
    stringData.updatedAt instanceof Date && !Number.isNaN(stringData.updatedAt.getTime());
  const dateModified = hasValidUpdatedAt
    ? stringData.updatedAt.toISOString()
    : SITE_CONTENT_LAST_MODIFIED;
  const verifiedAtLabel = hasValidUpdatedAt
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(stringData.updatedAt)
    : null;
  const averagePriceLabel = formatAveragePrice(
    stringData.realPrice,
    stringData.priceMin,
    stringData.priceMax,
  );
  const comparisons = getStringComparisonsForName(stringData.name);
  const acousticSummary = `${stringData.name} é um encordoamento de violino nível ${stringData.qualityLevel} com núcleo ${stringData.coreMaterial}, cor sonora ${stringData.soundColor} e projeção ${stringData.projection}. Entrega resposta ${stringData.responseSpeed ?? 'equilibrada'}, durabilidade ${stringData.durability ?? 'consistente'} e sensibilidade climática ${stringData.climateSensitivity ?? 'moderada'}, com preço médio de ${averagePriceLabel}.`;

  const specs: { label: string; value: string | null }[] = [
    { label: 'Material do Núcleo', value: stringData.coreMaterial },
    { label: 'Velocidade de Resposta', value: stringData.responseSpeed },
    { label: 'Durabilidade', value: stringData.durability },
    { label: 'Cor do Som', value: stringData.soundColor },
    { label: 'Projeção', value: stringData.projection },
    { label: 'Ambiente', value: stringData.environment },
    { label: 'Revestimento', value: stringData.coating },
    { label: 'Fixação', value: stringData.fixation },
    { label: 'Tolerância de Arco', value: stringData.arcTolerance },
    { label: 'Sensibilidade Climática', value: stringData.climateSensitivity },
  ];

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pt-8 pb-16">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            buildStringProductNode(stringData, reviews.length),
            {
              '@type': 'WebPage',
              '@id': `${canonicalUrl}#webpage`,
              url: canonicalUrl,
              name: `${stringData.name} — Corda para Violino`,
              description: `Especificações técnicas, projeção, cor do som, durabilidade e avaliações da corda ${stringData.name}.`,
              inLanguage: 'pt-BR',
              dateModified,
              isPartOf: { '@id': SCHEMA_IDS.website },
              publisher: { '@id': SCHEMA_IDS.organization },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Portal NKL', item: absoluteSiteUrl('/') },
                { '@type': 'ListItem', position: 2, name: 'Catálogo de Cordas', item: absoluteSiteUrl('/catalogo') },
                { '@type': 'ListItem', position: 3, name: stringData.name, item: canonicalUrl },
              ],
            },
          ],
        }}
      />

      <Link
        href="/catalogo"
        className="inline-flex items-center gap-2 text-sm font-medium text-neon hover:underline mb-6"
      >
        ← Voltar ao Catálogo
      </Link>

      {/* Cabeçalho */}
      <div className="bg-surface border border-border rounded-xl p-8 shadow-sm mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-playfair text-3xl font-bold mb-2">{stringData.name}</h1>
            <p className="text-sm opacity-70">Encordoamento para violino</p>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md border bg-neon/10 text-neon border-neon/40">
            Nível {stringData.qualityLevel}
          </span>
        </div>
      </div>

      <div className="mb-8 space-y-4">
        <BlufSummary
          summary={acousticSummary}
          facts={[
            { label: 'Núcleo', value: stringData.coreMaterial },
            { label: 'Cor do som', value: stringData.soundColor },
            { label: 'Projeção', value: stringData.projection },
            { label: 'Preço médio', value: averagePriceLabel },
          ]}
          verifiedAt={verifiedAtLabel}
          verificationNotes="Especificações acústicas, sensibilidade climática e faixa de preço conferidas no catálogo do Portal NKL."
        />

        {comparisons.length > 0 && (
          <section
            aria-label={`Comparativos diretos com ${stringData.name}`}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Comparativos diretos</p>
            <h2 className="mt-1 font-playfair text-xl font-bold">Compare {stringData.name} lado a lado</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {comparisons.map((pair) => (
                <Link
                  key={pair.slug}
                  href={`/comparar/${pair.slug}`}
                  className="rounded-full border border-border bg-background px-4 py-2 text-xs font-bold transition-colors hover:border-neon hover:text-neon"
                >
                  {pair.title}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Grid de Especificações */}
        <section className="lg:col-span-2">
          <h2 className="font-playfair text-xl font-bold mb-4">Especificações Técnicas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {specs.map(({ label, value }) => (
              <div
                key={label}
                className="p-4 bg-surface border border-border rounded-lg"
              >
                <div className="text-xs font-medium uppercase tracking-wider opacity-60 mb-1">
                  {label}
                </div>
                <div className="font-bold">{value || '—'}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Painel de Métricas */}
        <aside className="bg-surface border border-border rounded-xl p-6 h-fit flex flex-col gap-6">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider opacity-60 mb-1">
              Nota da Comunidade
            </div>
            <div className="font-playfair text-4xl font-bold text-neon">
              {stringData.communityScore ?? '—'}
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <div className="text-xs font-medium uppercase tracking-wider opacity-60 mb-1">
              Preço Real
            </div>
            <div className="font-playfair text-3xl font-bold">
              {formatAveragePrice(stringData.realPrice, stringData.priceMin, stringData.priceMax)}
            </div>
            <div className="text-sm opacity-70 mt-2">
              Faixa de mercado: {formatPrice(stringData.priceMin)} – {formatPrice(stringData.priceMax)}
            </div>
          </div>

          {user && (
            <FavoriteButton
              action={toggleFavoriteString}
              targetId={stringData.id}
              initialSaved={isFavorite}
            />
          )}

          {/* Tarefa 6 — CTA Comprar com marketplaces do legado */}
          <AffiliateLinks links={stringData.affiliateLinks} productName={stringData.name} variant="full" />

          <Link
            href="/comparar"
            className="inline-flex justify-center py-3 border border-neon text-neon rounded-md font-bold transition-all hover:bg-neon hover:text-black"
          >
            Comparar com outras
          </Link>
        </aside>
      </div>

      {/* Avaliações da Comunidade */}
      <section className="mt-12">
        <h2 className="font-playfair text-2xl font-bold mb-6">Avaliações da Comunidade</h2>

        {user ? (
          <form
            action={submitReview}
            className="mb-10 p-6 bg-surface border border-border rounded-xl flex flex-col gap-4"
          >
            <input type="hidden" name="stringId" value={stringData.id} />
            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium opacity-80">Nota (1 a 10)</span>
                <select
                  name="rating"
                  required
                  defaultValue="8"
                  className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium opacity-80">Comentário</span>
                <textarea
                  name="comment"
                  rows={3}
                  placeholder="Conte sua experiência com esse encordoamento..."
                  className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none resize-none"
                />
              </label>
            </div>
            <button
              type="submit"
              className="self-start px-6 py-3 bg-text text-bg rounded-md font-bold transition-all hover:opacity-90"
            >
              Enviar avaliação
            </button>
          </form>
        ) : (
          <p className="mb-10 p-6 bg-surface border border-dashed border-border rounded-xl text-center text-sm opacity-70">
            <Link href="/login" className="text-neon font-bold hover:underline">
              Entre na sua conta
            </Link>{' '}
            para avaliar este encordoamento.
          </p>
        )}

        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="p-6 bg-surface border border-border rounded-xl"
            >
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="font-bold">{review.reviewerName}</div>
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md border bg-neon/10 text-neon border-neon/40">
                  {review.rating}/10
                </span>
              </div>
              <div className="text-xs opacity-60 mb-2">
                {new Date(review.createdAt).toLocaleDateString('pt-BR')}
              </div>
              <p className="text-sm opacity-90">{review.comment || 'Sem comentário.'}</p>
            </article>
          ))}
          {reviews.length === 0 && (
            <p className="text-center opacity-60 py-8 border border-dashed border-border rounded-lg">
              Este encordoamento ainda não recebeu avaliações. Seja o primeiro!
            </p>
          )}
        </div>
      </section>
    </div>
  );
}