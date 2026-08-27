import { getNewsFeed } from '@/actions/news';
import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import NewsForm from './news-form';

export const metadata = {
  title: 'Mural de Notícias | Portal NKL',
};

export default async function NoticiasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const news = await getNewsFeed();

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8 pb-16">
      <h1 className="font-playfair text-3xl font-bold mb-8 text-center">Mural de Notícias e Eventos</h1>
      
      {/* Restrição de acesso baseada na sessão */}
      {user && (
        <section className="mb-12 p-6 bg-surface border border-border rounded-xl shadow-sm">
          <h2 className="font-playfair text-xl mb-4 border-b border-border pb-2">Central de Publicação</h2>
          <NewsForm />
        </section>
      )}

      {/* Renderização do Feed */}
      <div className="news-feed">
        {news.map((item) => (
          <article key={item.id} className="news-card">
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
              <div className="news-tags">
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
              </div>
            </div>
          </article>
        ))}

        {news.length === 0 && (
          <p className="text-center opacity-60 py-8 border border-dashed border-border rounded-lg">
            O mural está vazio. Autentique-se para criar a primeira publicação.
          </p>
        )}
      </div>
    </div>
  );
}