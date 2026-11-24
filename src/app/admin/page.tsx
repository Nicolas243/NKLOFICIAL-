import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { adCampaigns, businessDirectory, entityReports, pushSubscriptions, teacherReviews, userProfiles } from '@/db/schema';
import { asc, count, eq } from 'drizzle-orm';
import { getNewsFeed } from '@/actions/news';
import {
  publishNews,
  deleteNews,
  getPendingNewsSuggestions,
  approveNewsSuggestion,
  rejectNewsSuggestion,
} from '@/actions/news-admin';
import { getPlatformMetrics } from '@/actions/admin-analytics';
import { dispatchSubAppNotification } from '@/actions/admin-push';
import { AdminPromoteForm } from '@/components/admin-promote-form';
import { setEntitySuspensionStateAction, updateEntityReportStatusAction } from '@/actions/moderation-and-reviews';
import { approveAdCampaign, rejectAdCampaign } from '@/actions/ad-campaigns';
import { getServerPushConfiguration } from '@/lib/notifications/push';

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
  const pushConfig = getServerPushConfiguration();
  const [news, metrics, pendingSuggestions, reports, confidentialReviews, suspendedProfiles, suspendedDirectories, pendingAdCampaigns, pushSubRows] = await Promise.all([
    isAdmin ? getNewsFeed() : Promise.resolve([]),
    isAdmin ? getPlatformMetrics() : Promise.resolve(null),
    isAdmin ? getPendingNewsSuggestions() : Promise.resolve([]),
    isAdmin ? db.select().from(entityReports).orderBy(entityReports.createdAt) : Promise.resolve([]),
    isAdmin ? db.select().from(teacherReviews).where(eq(teacherReviews.visibility, 'admin_only')) : Promise.resolve([]),
    isAdmin ? db.select({ id: userProfiles.id, name: userProfiles.fullName, count: userProfiles.resolvedReportsCount, suspendedAt: userProfiles.suspendedAt }).from(userProfiles).where(eq(userProfiles.isSuspended, true)) : Promise.resolve([]),
    isAdmin ? db.select({ id: businessDirectory.id, name: businessDirectory.businessName, count: businessDirectory.resolvedReportsCount, suspendedAt: businessDirectory.suspendedAt }).from(businessDirectory).where(eq(businessDirectory.isSuspended, true)) : Promise.resolve([]),
    isAdmin ? db.select({
      id: adCampaigns.id,
      businessName: adCampaigns.businessName,
      contactEmail: adCampaigns.contactEmail,
      responsibleName: adCampaigns.responsibleName,
      whatsapp: adCampaigns.whatsapp,
      businessCategory: adCampaigns.businessCategory,
      offerDescription: adCampaigns.offerDescription,
      campaignObjective: adCampaigns.campaignObjective,
      targetAudience: adCampaigns.targetAudience,
      socialUrl: adCampaigns.socialUrl,
      destinationUrl: adCampaigns.destinationUrl,
      assetUrl: adCampaigns.assetUrl,
      assetAltText: adCampaigns.assetAltText,
      slotCount: adCampaigns.slotCount,
      monthlyAmountCents: adCampaigns.monthlyAmountCents,
      billingStatus: adCampaigns.billingStatus,
      createdAt: adCampaigns.createdAt,
    }).from(adCampaigns).where(eq(adCampaigns.status, 'pending_review')).orderBy(asc(adCampaigns.createdAt)) : Promise.resolve([]),
    isAdmin ? db.select({ appScope: pushSubscriptions.appScope }).from(pushSubscriptions) : Promise.resolve([]),
  ]);

  const scopeCounts: Record<string, number> = {
    portal: 0,
    'renda-extra': 0,
    musica: 0,
    idiomas: 0,
    ia: 0,
  };
  for (const row of pushSubRows) {
    const scope = row.appScope || 'portal';
    scopeCounts[scope] = (scopeCounts[scope] ?? 0) + 1;
  }

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
          <section aria-label="Marketplace de Aulas">
            <h2 className="mb-4 font-playfair text-xl font-bold">Marketplace de Aulas</h2>
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
            <div>
              <h2 className="font-playfair text-xl font-bold">Materiais de anúncios aguardando sua análise ({pendingAdCampaigns.length})</h2>
              <p className="mt-1 text-sm opacity-70">Este é o lugar para você analisar cada material após a assinatura Stripe. Revise criativo, destino e contexto antes de aprovar ou cancelar.</p>
            </div>
            {pendingAdCampaigns.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-5 text-sm opacity-70">Nenhuma campanha aguardando revisão.</p>
            ) : pendingAdCampaigns.map((campaign) => (
              <article key={campaign.id} className="grid gap-5 rounded-xl border border-orange/30 bg-surface p-5 lg:grid-cols-[7rem_1fr_auto] lg:items-center">
                <div className="aspect-square overflow-hidden rounded-lg border border-border bg-background">
                  {campaign.assetUrl ? (
                    campaign.assetUrl.endsWith('.webm') ? (
                      <video src={campaign.assetUrl} className="h-full w-full object-cover" muted loop autoPlay playsInline />
                    ) : (
                      <Image src={campaign.assetUrl} alt={campaign.assetAltText} width={112} height={112} className="h-full w-full object-cover" />
                    )
                  ) : <span className="flex h-full items-center justify-center p-2 text-center text-xs opacity-60">Aguardando envio</span>}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{campaign.businessName}</h3>
                    <span className="rounded-full border border-neon/40 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-neon">{campaign.billingStatus}</span>
                  </div>
                  <p className="mt-1 text-sm opacity-70">{campaign.contactEmail} · {campaign.slotCount} {campaign.slotCount === 1 ? 'cota' : 'cotas'} · {(campaign.monthlyAmountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês</p>
                  <p className="mt-2 text-sm"><strong>Contato:</strong> {campaign.responsibleName ?? 'Não informado'} · {campaign.whatsapp ?? 'WhatsApp não informado'}</p>
                  <p className="mt-1 text-sm"><strong>Categoria:</strong> {campaign.businessCategory ?? 'Não informada'} · <strong>Objetivo:</strong> {campaign.campaignObjective ?? 'Não informado'}</p>
                  <p className="mt-2 text-sm leading-relaxed"><strong>Oferta:</strong> {campaign.offerDescription ?? 'Não informada'}</p>
                  {campaign.targetAudience && <p className="mt-1 text-xs opacity-70"><strong>Público:</strong> {campaign.targetAudience}</p>}
                  {campaign.socialUrl && <a href={campaign.socialUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-xs text-neon hover:underline">Perfil institucional: {campaign.socialUrl}</a>}
                  <a href={campaign.destinationUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block truncate text-sm text-neon hover:underline">{campaign.destinationUrl}</a>
                  <p className="mt-2 text-xs opacity-55">Recebido em {campaign.createdAt.toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex flex-wrap gap-2 lg:flex-col">
                  <form action={approveAdCampaign}>
                    <input type="hidden" name="campaignId" value={campaign.id} />
                    <button type="submit" className="w-full rounded-md bg-neon px-4 py-2 text-sm font-bold text-black hover:opacity-90">Aprovar e publicar</button>
                  </form>
                  <form action={rejectAdCampaign} className="space-y-2">
                    <input type="hidden" name="campaignId" value={campaign.id} />
                    <input name="reviewNotes" placeholder="Motivo da reprovação" className="min-h-9 w-full rounded-md border border-border bg-background px-2 text-xs" />
                    <button type="submit" className="w-full rounded-md border border-red-500/50 px-4 py-2 text-sm font-bold text-red-400 hover:bg-red-500/10">Reprovar e cancelar</button>
                  </form>
                </div>
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

          <section aria-label="Apps Instalados e Notificações por Área" className="p-6 bg-surface border border-border rounded-xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-playfair text-xl font-bold">Apps Instalados e Notificações por Área</h2>
                <p className="text-sm opacity-70 mt-1">Envie comunicados segmentados por sub-app instalado (Portal NKL, Renda Extra, Música, Idiomas ou IA).</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${pushConfig.enabled ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-orange/40 bg-orange/10 text-orange'}`}>
                {pushConfig.enabled ? 'Web Push VAPID ativo' : 'In-app ativo (adicione VAPID para Push OS)'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(scopeCounts).map(([scope, total]) => (
                <div key={scope} className="rounded-lg border border-border bg-background p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-60">{scope}</p>
                  <p className="mt-1 font-playfair text-2xl font-bold text-neon">{total}</p>
                </div>
              ))}
            </div>

            <form action={dispatchSubAppNotification} className="space-y-3 border-t border-border pt-4">
              <div className="grid grid-cols-1 md:grid-cols-[0.35fr_0.65fr] gap-3">
                <select name="appScope" defaultValue="all" className="p-3 bg-background border border-border rounded-md text-sm">
                  <option value="all">Todos os apps instalados</option>
                  <option value="portal">Portal NKL (Geral)</option>
                  <option value="renda-extra">Renda Extra</option>
                  <option value="musica">Música</option>
                  <option value="idiomas">Idiomas</option>
                  <option value="ia">IA na Prática</option>
                </select>
                <input type="text" name="title" required placeholder="Título da notificação" className="p-3 bg-background border border-border rounded-md text-sm" />
              </div>
              <textarea name="message" rows={3} required placeholder="Mensagem clara para os usuários dessa área..." className="w-full p-3 bg-background border border-border rounded-md text-sm" />
              <button type="submit" className="rounded-md bg-neon px-5 py-2.5 text-sm font-bold text-black hover:opacity-90">
                Enviar notificação segmentada
              </button>
            </form>
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