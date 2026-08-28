import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserReviews, deleteReview } from '@/actions/user-activity';

export const metadata = {
  title: 'Minhas Avaliações | Portal NKL',
};

export default async function MinhasAvaliacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const reviews = await getUserReviews();

  return (
    <div className="max-w-3xl w-full mx-auto px-4 pt-8">
      <Link
        href="/perfil"
        className="inline-flex items-center gap-2 text-sm font-medium text-neon hover:underline mb-6"
      >
        ← Voltar ao Perfil
      </Link>

      <h1 className="font-playfair text-3xl font-bold mb-2">Minhas Avaliações</h1>
      <p className="text-sm opacity-70 mb-8">
        Gerencie os feedbacks que você deixou na comunidade.
      </p>

      <div className="flex flex-col gap-4">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="p-6 bg-surface border border-border rounded-xl flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neon">
                  {review.type === 'string' ? 'Corda' : 'Luthier'}
                </span>
                <h2 className="font-playfair font-bold text-lg mt-1">
                  {review.targetName}
                </h2>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md border bg-neon/10 text-neon border-neon/40">
                {review.rating}/10
              </span>
            </div>

            <div className="text-xs opacity-60">
              {new Date(review.createdAt).toLocaleDateString('pt-BR')}
            </div>

            <p className="text-sm opacity-90">
              {review.comment || 'Sem comentário.'}
            </p>

            <form action={deleteReview} className="self-end mt-2">
              <input type="hidden" name="reviewId" value={review.id} />
              <input type="hidden" name="type" value={review.type} />
              <button
                type="submit"
                className="px-4 py-2 text-sm font-bold border border-red-500/50 text-red-500 rounded-md transition-all hover:bg-red-500/10"
              >
                Excluir
              </button>
            </form>
          </article>
        ))}

        {reviews.length === 0 && (
          <p className="text-center opacity-60 py-8 border border-dashed border-border rounded-lg">
            Você ainda não avaliou nenhuma corda ou luthier.
          </p>
        )}
      </div>
    </div>
  );
}