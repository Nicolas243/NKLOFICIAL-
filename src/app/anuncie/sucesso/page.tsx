import type { Metadata } from 'next';
import Link from 'next/link';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { adCampaigns } from '@/db/schema';
import { AdMaterialUploadForm } from '@/components/ads/ad-material-upload-form';
import { getStripeClient } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Enviar material do anúncio · Portal NKL' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdCheckoutSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const sessionId = typeof params.session_id === 'string' ? params.session_id : null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let [campaign] = user?.id && sessionId
    ? await db
      .select({
        id: adCampaigns.id,
        businessName: adCampaigns.businessName,
        status: adCampaigns.status,
        billingStatus: adCampaigns.billingStatus,
        assetUrl: adCampaigns.assetUrl,
        stripeSubscriptionId: adCampaigns.stripeSubscriptionId,
      })
      .from(adCampaigns)
      .where(and(eq(adCampaigns.userId, user.id), eq(adCampaigns.stripeCheckoutSessionId, sessionId)))
      .limit(1)
    : [];

  if (campaign && campaign.billingStatus !== 'active' && sessionId?.startsWith('cs_')) {
    try {
      const session = await getStripeClient().checkout.sessions.retrieve(sessionId);
      const subId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id ?? null;
      if (session.payment_status === 'paid' || session.status === 'complete') {
        const nextStatus = campaign.status === 'pending_payment' ? 'pending_review' : campaign.status;
        await db.update(adCampaigns).set({
          billingStatus: 'active',
          status: nextStatus,
          ...(subId ? { stripeSubscriptionId: subId } : {}),
          updatedAt: new Date(),
        }).where(eq(adCampaigns.id, campaign.id));
        campaign = { ...campaign, billingStatus: 'active', status: nextStatus, stripeSubscriptionId: subId };
      }
    } catch (error) {
      console.error('[AD_SUCCESS] Falha ao reconciliar checkout Stripe:', error instanceof Error ? error.message : 'erro desconhecido');
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 md:py-16">
      <section className="rounded-2xl border border-neon/30 bg-income-surface/90 p-6 md:p-10">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-neon">Próximo passo</p>
        <h1 className="mt-3 font-playfair text-4xl font-bold">Pagamento recebido</h1>
        {!campaign ? (
          <div className="mt-5 space-y-3 text-sm leading-relaxed text-foreground/75">
            <p>Estamos aguardando a confirmação da assinatura pelo Stripe. Atualize esta página em alguns instantes.</p>
            <Link href="/programas/anuncie" className="inline-flex min-h-11 items-center rounded-md bg-neon px-5 py-3 font-bold text-black">Voltar para anunciar</Link>
          </div>
        ) : campaign.billingStatus !== 'active' ? (
          <p className="mt-5 text-sm leading-relaxed text-foreground/75">A assinatura ainda está sendo confirmada pelo Stripe. Assim que for confirmada, esta página liberará o envio do material.</p>
        ) : campaign.assetUrl ? (
          <div className="mt-5 space-y-3 text-sm leading-relaxed text-foreground/75">
            <p>O material de <strong className="text-foreground">{campaign.businessName}</strong> já foi recebido e está aguardando análise editorial.</p>
            <p>A equipe editorial do Portal NKL revisa manualmente cada criativo e o link de destino antes da publicação nas faixas publicitárias.</p>
            <Link href="/programas/anuncie" className="inline-flex min-h-11 items-center rounded-md border border-border px-5 py-3 font-bold hover:border-neon">Voltar para anunciar</Link>
          </div>
        ) : (
          <>
            <p className="mt-5 text-sm leading-relaxed text-foreground/75">
              A assinatura de <strong className="text-foreground">{campaign.businessName}</strong> foi confirmada. Envie agora o criativo que será analisado antes da publicação.
            </p>
            <AdMaterialUploadForm campaignId={campaign.id} />
          </>
        )}
      </section>
    </main>
  );
}
