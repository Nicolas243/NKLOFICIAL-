import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { businessDirectory, entityReports, teacherReviews, userProfiles } from '@/db/schema';
import { count, eq } from 'drizzle-orm';
import { getNewsFeed } from '@/actions/news';
import {
  publishNews,
  deleteNews,
  getPendingNewsSuggestions,
  approveNewsSuggestion,
  rejectNewsSuggestion,
} from '@/actions/news-admin';
import { getPlatformMetrics } from '@/actions/admin-analytics';
import { AdminPromoteForm } from '@/components/admin-promote-form';
import { setEntitySuspensionStateAction, updateEntityReportStatusAction } from '@/actions/moderation-and-reviews';

export const metadata = { title: 'Admin | Portal NKL' };

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) redirect('/');

  const [[profile], [{ value: adminCount }]] = await Promise.all([
    db
      .select({ role: userProfiles.role })
      .from(userProfiles)
      .where(eq(userProfiles.id, user.id))
      .limit(1),
    db.select({ value: count() }).from(userProfiles).where(eq(userProfiles.role, 'admin')),
  ]);

  const isAdmin = profile?.role === 'admin';
  const [news, metrics, pendingSuggestions, reports, confidentialReviews, suspendedProfiles, suspendedDirectories] = await Promise.all([
    isAdmin ? getNewsFeed() : Promise.resolve([]),
    isAdmin ? getPlatformMetrics() : Promise.resolve(null),
    isAdmin ? getPendingNewsSuggestions() : Promise.resolve([]),
    isAdmin ? db.select().from(entityReports).orderBy(entityReports.createdAt) : Promise.resolve([]),
    isAdmin ? db.select().from(teacherReviews).where(eq(teacherReviews.visibility, 'admin_only')) : Promise.resolve([]),
    isAdmin ? db.select({ id: userProfiles.id, name: userProfiles.fullName, count: userProfiles.resolvedReportsCount, suspendedAt: userProfiles.suspendedAt }).from(userProfiles).where(eq(userProfiles.isSuspended, true)) : Promise.resolve([]),
    isAdmin ? db.select({ id: businessDirectory.id, name: businessDirectory.businessName, count: businessDirectory.resolvedReportsCount, suspendedAt: businessDirectory.suspendedAt }).from(businessDirectory).where(eq(businessDirectory.isSuspended, true)) : Promise.resolve([]),
  ]);

  const metricCards: { label: string; value: string }[] = metrics
    ? [
        { label: 'Membros', value: String(metrics.totalUsers) },
        { label: 'Assinantes Premium', value: String(metrics.activePremiumLuthiers) },
        { label: 'Leads Gerados', value: String(metrics.totalLeadsGenerated) },
        {
          label: 'MRR Estimado',
          value: metrics.mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        },
      ]
    : [];

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
          {!isAdmin && <AdminPromoteForm isBootstrap={adminCount === 0} />}
        </div>
      </div>

      {!isAdmin ? (
        <div className="p-8 bg-surface border border-border rounded-xl text-center">
          <p className="text-red-400 font-medium">Acesso restrito a administradores.</p>
          <p className="text-sm opacity-70 mt-2">
            Acesso restrito a administradores. O primeiro admin é concedido por bootstrap;
            em seguida, apenas com o segredo de administrador.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          <section aria-label="Visão Geral da Plataforma">
            <h2 className="font-playfair text-xl font-bold mb-4">Visão Geral da Plataforma</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {metricCards.map((card) => (
                <div
                  key={card.label}
                  className="p-5 bg-surface border border-border rounded-xl flex flex-col gap-1"
                >
                  <span className="text-xs uppercase tracking-wide opacity-60">{card.label}</span>
                  <span className="font-playfair text-2xl font-bold text-neon">{card.value}</span>
                </div>
              ))}
            </div>
          </section>
          <section aria-label="Marketplace de Aulas e Split Mercado Pago">
            <h2 className="mb-4 font-playfair text-xl font-bold">Marketplace de Aulas &amp; Split Mercado Pago</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                ['Professores conectados', metrics?.connectedTeachers ?? 0],
                ['Planos ativos', metrics?.activePlans ?? 0],
                ['GMV', `R$ ${((metrics?.marketplaceGmvCents ?? 0) / 100).toFixed(2)}`],
                ['Receita da plataforma', `R$ ${((metrics?.marketplaceFeesCents ?? 0) / 100).toFixed(2)}`],
              ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-border bg-surface p-5"><span className="text-xs uppercase tracking-wide opacity-60">{label}</span><strong className="mt-2 block text-2xl text-neon">{value}</strong></div>)}
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="font-playfair text-xl font-bold">Entidades Suspensas Aguardando Análise</h2>
            {[...suspendedProfiles.map((item) => ({ ...item, type: 'user' as const })), ...suspendedDirectories.map((item) => ({ ...item, type: 'directory' as const }))].map((item) => (
              <article key={`${item.type}-${item.id}`} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5">
                <div><p className="font-bold">{item.name ?? 'Sem nome'}</p><p className="text-xs opacity-70">{item.type} · {item.count} denúncias procedentes · {item.suspendedAt?.toLocaleDateString('pt-BR')}</p></div>
                <form action={setEntitySuspensionStateAction}><input type="hidden" name="entityType" value={item.type} /><input type="hidden" name="entityId" value={item.id} /><input type="hidden" name="suspend" value="false" /><button type="submit" className="rounded-md border border-neon px-3 py-2 text-sm font-bold text-neon">Reabilitar Conta/Perfil</button></form>
              </article>
            ))}
          </section>
          <section className="space-y-4">
            <h2 className="font-playfair text-xl font-bold">Moderação, Denúncias &amp; Avaliações Confidenciais</h2>
            <div className="space-y-3">
              {reports.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-5 text-sm opacity-70">Nenhuma denúncia registrada.</p>
              ) : reports.map((report) => (
                <article key={report.id} className="rounded-xl border border-border bg-surface p-5">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-bold">{report.targetType} · {report.reason}</p>
                    <span className="text-xs uppercase text-neon">{report.status}</span>
                  </div>
                  <p className="mt-2 text-sm opacity-80">{report.details}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(['under_review', 'resolved', 'dismissed'] as const).map((status) => (
                      <form key={status} action={updateEntityReportStatusAction}>
                        <input type="hidden" name="reportId" value={report.id} />
                        <input type="hidden" name="status" value={status} />
                        <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-xs hover:border-neon">{status}</button>
                      </form>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="font-bold">Avaliações confidenciais</h3>
              {confidentialReviews.length === 0 ? (
                <p className="text-sm opacity-70">Nenhuma avaliação confidencial.</p>
              ) : confidentialReviews.map((review) => (
                <article key={review.id} className="rounded-xl border border-border bg-surface p-5">
                  <p className="font-bold text-neon">{review.rating}/5</p>
                  <p className="mt-2 text-sm">{review.comment}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="p-6 bg-surface border border-border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-playfair text-xl font-bold">Programas de parceria</h2>
              <p className="text-sm opacity-70 mt-1">Controle links de afiliado, notas editoriais e sugestões da comunidade.</p>
            </div>
            <Link href="/programas/admin" className="w-fit rounded-md bg-neon px-5 py-3 text-sm font-bold text-black hover:opacity-90">
              Gerenciar programas
            </Link>
          </section>

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

          <section className="p-6 bg-surface border border-border rounded-xl">
            <h2 className="font-playfair text-xl font-bold mb-6">
              Fila de Aprovação ({pendingSuggestions.length})
            </h2>
            {pendingSuggestions.length === 0 ? (
              <p className="text-sm opacity-60">Nenhum anúncio/sugestão pendente.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {pendingSuggestions.map((suggestion) => (
                  <article
                    key={suggestion.id}
                    className="p-4 border border-border rounded-lg flex flex-col gap-2"
                  >
                    <h3 className="font-bold text-sm">{suggestion.title}</h3>
                    <p className="text-xs opacity-70 line-clamp-2">{suggestion.contentOrLink}</p>
                    <div className="text-xs opacity-50">
                      Sugerido por: {suggestion.suggestedBy ?? 'Anônimo'} ·{' '}
                      {new Date(suggestion.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <form action={approveNewsSuggestion}>
                        <input type="hidden" name="suggestionId" value={suggestion.id} />
                        <button
                          type="submit"
                          className="px-4 py-1.5 text-xs font-bold bg-neon text-black rounded-md"
                        >
                          Aprovar
                        </button>
                      </form>
                      <form action={rejectNewsSuggestion}>
                        <input type="hidden" name="suggestionId" value={suggestion.id} />
                        <button
                          type="submit"
                          className="px-4 py-1.5 text-xs border border-red-500/50 text-red-400 rounded-md"
                        >
                          Rejeitar
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            )}
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