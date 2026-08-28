import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStringDetails } from '@/actions/strings';
import { getReviewsByStringId, submitReview } from '@/actions/reviews';
import { createClient } from '@/lib/supabase/server';

type Params = Promise<{ id: string }>;

function formatPrice(value: string | null): string {
  if (!value) return '—';
  return `R$ ${value}`;
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
    <div className="max-w-5xl w-full mx-auto px-4 pt-8">
      <Link
        href="/catalogo"
        className="inline-flex items-center gap-2 text-sm font-medium text-neon hover:underline mb-6"
      >
        ← Voltar ao Catálogo
      </Link>

      {/* Cabeçalho */}
      <div className="bg-surface border border-border rounded-xl p-8 shadow-sm mb-8">
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
              {formatPrice(stringData.realPrice)}
            </div>
            <div className="text-sm opacity-70 mt-2">
              Faixa de mercado: {formatPrice(stringData.priceMin)} – {formatPrice(stringData.priceMax)}
            </div>
          </div>

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