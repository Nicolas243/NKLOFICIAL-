import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLuthierDetails } from '@/actions/luthier';
import { isLuthierFavorite, toggleFavoriteLuthier } from '@/actions/favorites';
import { getReviewsByLuthierId, submitLuthierReview } from '@/actions/reviews';
import { FavoriteButton } from '@/components/favorite-button';
import { createClient } from '@/lib/supabase/server';

type Params = Promise<{ id: string }>;

function buildWhatsAppUrl(whatsapp: string): string {
  const digits = whatsapp.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

export default async function LuthierDetailsPage(props: { params: Params }) {
  const { id } = await props.params;
  const luthier = await getLuthierDetails(id);

  if (!luthier) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isFavorite = user?.id ? await isLuthierFavorite(user.id, id) : false;
  const reviews = await getReviewsByLuthierId(id);

  const displayName = luthier.businessName ?? luthier.fullName ?? 'Luthier';
  const location =
    luthier.city && luthier.state
      ? `${luthier.city} · ${luthier.state}`
      : luthier.city ?? luthier.state ?? 'Localização não informada';

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pt-8">
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-8 border-b border-border">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-playfair text-3xl font-bold mb-1">{displayName}</h1>
              <p className="text-sm opacity-80">{location}</p>
            </div>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${
                luthier.planType === 'premium'
                  ? 'bg-neon/10 text-neon border-neon/40'
                  : 'bg-accent/10 text-foreground/70 border-border'
              }`}
            >
              {luthier.planType === 'premium' ? 'Perfil Premium' : 'Verificado'}
            </span>
          </div>
        </div>

        {/* Corpo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
          <div className="lg:col-span-2 p-8">
            <h2 className="font-playfair text-xl font-bold mb-3">Sobre</h2>
            <p className="leading-relaxed opacity-90 whitespace-pre-line">
              {luthier.bio || 'Este profissional ainda não adicionou uma biografia.'}
            </p>
          </div>

          {/* Painel lateral */}
          <aside className="p-8 flex flex-col gap-4">
            <div className="text-sm">
              <span className="font-medium opacity-70">Plano</span>
              <p className="font-bold mt-1 capitalize">
                {luthier.planType === 'premium' ? 'Premium' : 'Grátis / Verificado'}
              </p>
            </div>

            {user && (
              <FavoriteButton
                action={toggleFavoriteLuthier}
                targetId={luthier.id}
                initialSaved={isFavorite}
              />
            )}

            {luthier.whatsapp ? (
              <a
                href={buildWhatsAppUrl(luthier.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex justify-center py-3 bg-text text-bg rounded-md font-bold transition-all hover:opacity-90"
              >
                Contatar via WhatsApp
              </a>
            ) : (
              <p className="text-center text-sm opacity-60 border border-dashed border-border rounded-md py-3">
                WhatsApp não disponível
              </p>
            )}
          </aside>
        </div>
      </div>

      {/* Avaliações de Clientes */}
      <section className="mt-12">
        <h2 className="font-playfair text-2xl font-bold mb-6">Avaliações de Clientes</h2>

        {user ? (
          <form
            action={submitLuthierReview}
            className="mb-10 p-6 bg-surface border border-border rounded-xl flex flex-col gap-4"
          >
            <input type="hidden" name="luthierId" value={id} />
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
                  placeholder="Conte sua experiência com este profissional..."
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
            para avaliar este profissional.
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
              Este profissional ainda não recebeu avaliações. Seja o primeiro!
            </p>
          )}
        </div>
      </section>
    </div>
  );
}