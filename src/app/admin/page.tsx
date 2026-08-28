import { redirect } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getNewsFeed } from '@/actions/news';
import { publishNews, deleteNews } from '@/actions/news-admin';
import { promoteToAdmin } from '@/actions/admin-setup';

export const metadata = { title: 'Admin | Portal NKL' };

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) redirect('/');

  const [profile] = await db
    .select({ role: userProfiles.role })
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1);

  const isAdmin = profile?.role === 'admin';
  const news = isAdmin ? await getNewsFeed() : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 pb-6 border-b border-border">
        <div>
          <h1 className="font-playfair text-3xl font-bold">Painel de Administração</h1>
          <p className="text-sm opacity-70">Gerenciamento central do ecossistema.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1 bg-surface border border-border rounded-full">
            Perfil: <strong className="text-neon">{profile?.role ?? 'user'}</strong>
          </span>
          {!isAdmin && (
            <form action={promoteToAdmin}>
              <button type="submit" className="px-4 py-2 text-xs font-bold bg-neon text-black rounded-md">
                Promover a Admin
              </button>
            </form>
          )}
        </div>
      </div>

      {!isAdmin ? (
        <div className="p-8 bg-surface border border-border rounded-xl text-center">
          <p className="text-red-400 font-medium">Acesso restrito a administradores.</p>
          <p className="text-sm opacity-70 mt-2">Clique em &quot;Promover a Admin&quot; acima para habilitar seu acesso.</p>
        </div>
      ) : (
        <div className="space-y-12">
          <section className="p-6 bg-surface border border-border rounded-xl">
            <h2 className="font-playfair text-xl font-bold mb-6">Publicar Nova Notícia</h2>
            <form action={publishNews} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="title" required placeholder="Título" className="p-3 bg-background border border-border rounded-md text-sm" />
                <input type="text" name="tags" placeholder="Tags (vírgula)" className="p-3 bg-background border border-border rounded-md text-sm" />
              </div>
              <textarea name="content" rows={4} required placeholder="Conteúdo..." className="w-full p-3 bg-background border border-border rounded-md text-sm" />
              <input type="file" name="image" accept="image/png, image/jpeg, image/webp" required className="w-full p-2 border border-border rounded-md text-sm" />
              <button type="submit" className="w-full py-3 bg-neon text-black font-bold rounded-md">Publicar Notícia</button>
            </form>
          </section>

          <section className="space-y-4">
            <h2 className="font-playfair text-xl font-bold">Notícias ({news.length})</h2>
            {news.map((item) => (
              <article key={item.id} className="p-4 bg-surface border border-border rounded-lg flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {item.imageUrl && (
                    <div className="relative w-16 h-12 rounded overflow-hidden bg-background shrink-0">
                      <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-sm">{item.title}</h3>
                    <p className="text-xs opacity-60">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <form action={deleteNews}>
                  <input type="hidden" name="newsId" value={item.id} />
                  <button type="submit" className="px-3 py-1 text-xs border border-red-500/50 text-red-400 rounded-md">Excluir</button>
                </form>
              </article>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}