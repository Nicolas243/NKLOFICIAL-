import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { guidePurchases, guideSubscriptions } from '@/db/schema';
import { GuideAssetDownloads } from '@/components/sales/guide-asset-downloads';
import { GUIDE_ASSETS } from '@/lib/guide-assets';

export const metadata: Metadata = {
  title: 'Pagamento confirmado | Guia NKL',
  robots: {
    index: false,
    follow: false,
  },
};

type SuccessPageProps = {
  searchParams: Promise<{
    external_reference?: string;
    payment_id?: string;
    provider?: string;
    subscription_reference?: string;
    status?: string;
    plan?: string;
  }>;
};

export default async function GuidePurchaseSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const purchaseReference = typeof params.external_reference === 'string'
    ? params.external_reference.replace(/^guide_purchase:/u, '')
    : '';
  const purchaseId = z.string().uuid().safeParse(purchaseReference);
  const [purchase] = purchaseId.success
    ? await db.select({
      id: guidePurchases.id,
      status: guidePurchases.status,
      paymentId: guidePurchases.paymentId,
      downloadCount: guidePurchases.downloadCount,
      maxDownloads: guidePurchases.maxDownloads,
    }).from(guidePurchases).where(eq(guidePurchases.id, purchaseId.data)).limit(1)
    : params.provider === 'hotmart' && params.payment_id?.startsWith('hotmart:')
      ? await db.select({
        id: guidePurchases.id,
        status: guidePurchases.status,
        paymentId: guidePurchases.paymentId,
        downloadCount: guidePurchases.downloadCount,
        maxDownloads: guidePurchases.maxDownloads,
      }).from(guidePurchases).where(eq(guidePurchases.paymentId, params.payment_id)).limit(1)
      : [];
  const subscriptionReference = params.subscription_reference ?? params.external_reference;
  const [subscription] = params.plan === 'subscription' && subscriptionReference
    ? await db.select({
      status: guideSubscriptions.status,
      downloadCount: guideSubscriptions.downloadCount,
      maxDownloads: guideSubscriptions.maxDownloads,
    })
      .from(guideSubscriptions)
      .where(eq(guideSubscriptions.externalReference, subscriptionReference))
      .limit(1)
    : [];
  const paymentMatches = Boolean(params.payment_id) && purchase?.paymentId === params.payment_id;
  const isApproved = purchase?.status === 'approved' && paymentMatches;
  const isSubscriptionActive = subscription?.status === 'active';
  const purchaseDownloadsRemaining = purchase ? Math.max(purchase.maxDownloads - purchase.downloadCount, 0) : 0;
  const subscriptionDownloadsRemaining = subscription ? Math.max(subscription.maxDownloads - subscription.downloadCount, 0) : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      {isApproved ? (
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Acesso liberado</p>
          <h1 className="mt-3 font-playfair text-4xl font-bold">Pagamento Confirmado! Seu acesso foi liberado.</h1>
          <p className="mt-4 leading-relaxed text-foreground/75">Obrigado pela compra. O Guia Essencial Renda Extra 2027 e os quatro materiais complementares ficam disponíveis para download protegido.</p>
          {params.payment_id && (params.external_reference || params.provider === 'hotmart') && (
            <GuideAssetDownloads
              assets={GUIDE_ASSETS}
              context={params.provider === 'hotmart'
                ? { provider: 'hotmart', payment_id: params.payment_id }
                : { external_reference: params.external_reference as string, payment_id: params.payment_id }}
              initialRemainingDownloads={purchaseDownloadsRemaining}
            />
          )}
        </section>
      ) : isSubscriptionActive ? (
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Assinatura ativa</p>
          <h1 className="mt-3 font-playfair text-4xl font-bold">Seu acesso mensal foi confirmado.</h1>
          <p className="mt-4 leading-relaxed text-foreground/75">A assinatura dos Guias para Liberdade Financeira está ativa. Os materiais ficam disponíveis por download protegido enquanto o acesso estiver ativo.</p>
          {subscriptionReference && (
            <GuideAssetDownloads
              assets={GUIDE_ASSETS}
              context={{ subscription_reference: subscriptionReference }}
              initialRemainingDownloads={subscriptionDownloadsRemaining}
            />
          )}
        </section>
      ) : (
        <section className="rounded-2xl border border-orange/30 bg-orange/5 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Pagamento em processamento</p>
          <h1 className="mt-3 font-playfair text-4xl font-bold">Estamos confirmando seu pagamento.</h1>
          <p className="mt-4 leading-relaxed text-foreground/75">
            O acesso será liberado após a confirmação do {params.provider === 'hotmart' ? 'Hotmart' : 'Mercado Pago'}. Se o pagamento já foi aprovado, aguarde alguns instantes e atualize esta página.
          </p>
        </section>
      )}
    </div>
  );
}
