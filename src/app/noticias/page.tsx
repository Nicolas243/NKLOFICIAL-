import { getNewsFeed, getNewsComments, isNewsLiked } from '@/actions/news';
import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import NewsForm from './news-form';
import SuggestNewsModal from './suggest-news-modal';
import { SuggestNewsBannerButton } from './suggest-news-banner-button';
import { NewsEngagement } from '@/components/news-engagement';
import { getHiddenScrollbarClassName } from '@/lib/ui/support-layout';

export const metadata = {
  title: 'Mural de Notícias | Portal NKL',
};

export default async function NoticiasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const news = await getNewsFeed();

  // Engajamento (Tarefa 9): 1 query para os likes do usuário logado + comentários.
  const likedNewsIds = new Set<string>();
  if (user?.id) {
    const liked = await Promise.all(
      news.map((item) => isNewsLiked(item.id, user.id))
    );
    news.forEach((item, index) => {
      if (liked[index]) likedNewsIds.add(item.id);
    });
  }
  const commentsByNews = new Map<string, Awaited<ReturnType<typeof getNewsComments>>>();
  await Promise.all(
    news.map(async (item) => {
      commentsByNews.set(item.id, await getNewsComments(item.id));
    })
  );

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8 pb-16">
      <h1 className="font-playfair text-3xl font-bold mb-8 text-center">Mural de Notícias e Eventos</h1>

      {/* Banner público — qualquer visitante pode sugerir */}
      {!user && (
        <div className="mb-8 p-4 bg-neon/5 border border-neon/20 rounded-xl flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm opacity-80">Viu algo interessante? Envie uma sugestão de notícia para a comunidade.</p>
          <SuggestNewsBannerButton />
        </div>
      )}

      {/* Restrição de acesso baseada na sessão */}
      {user && (
        <section className="mb-12 p-6 bg-surface border border-border rounded-xl shadow-sm">
          <h2 className="font-playfair text-xl mb-4 border-b border-border pb-2">Central de Publicação</h2>
          <NewsForm />
        </section>
      )}

      {/* Renderização do Feed */}
      <div className="news-feed">
        {news.slice(0, 5).map((item) => (
          <article key={item.id} className="news-card flex flex-col">
            <div className="news-img-box">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                className="news-img"
              />
            </div>
            <div className="news-content">
              <div className={`news-tags ${getHiddenScrollbarClassName()}`}>
                {item.tags?.split(',').map((tag) => (
                  <span key={tag.trim()} className="news-tag highlight">
                    {tag.trim()}
                  </span>
                ))}
              </div>
              <h3 className="news-title">{item.title}</h3>
              <p className="news-desc">{item.content}</p>
              <div className="news-footer">
                <span className="news-date">
                  {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                </span>
                {item.author && (
                  <span className="news-date">Por {item.author}</span>
                )}
              </div>

              {/* Tarefa 9 — curtir e comentar */}
              <NewsEngagement
                newsId={item.id}
                initialLiked={likedNewsIds.has(item.id)}
                initialLikes={item.likesCount}
                initialComments={commentsByNews.get(item.id) ?? []}
                canComment={Boolean(user)}
              />
            </div>
          </article>
        ))}

        {news.length === 0 && (
          <p className="text-center opacity-60 py-8 border border-dashed border-border rounded-lg">
            O mural está vazio. Seja o primeiro a sugerir uma notícia!
          </p>
        )}
      </div>

      {/* Modal de sugestão pública (acessível a todos) */}
      <SuggestNewsModal />
    </div>
  );
}