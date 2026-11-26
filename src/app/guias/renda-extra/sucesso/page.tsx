import type { Metadata } from 'next';
import Link from 'next/link';
import type Stripe from 'stripe';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { guidePurchases, guideSubscriptions } from '@/db/schema';
import { GuideAssetDownloads } from '@/components/sales/guide-asset-downloads';
import { GuestGuideStatus } from '@/components/sales/guest-guide-status';
import { GuidePurchaseAnalytics } from '@/components/sales/guide-purchase-analytics';
import { getGuideAssetsForOffer } from '@/lib/guide-assets';
import { getStripeClient } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';
import { getLanguageEbookByOffer, isEnglishEbookOffer } from '@/lib/guide-offer';

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
    session_id?: string;
    provider?: string;
    status?: string;
    plan?: string;
    reference?: string;
    guest_access_token?: string;
  }>;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

function parseGuestReference(reference: string): { kind: 'purchase' | 'subscription'; id: string } | null {
  const match = /^guide_(purchase|subscription):(.+)$/u.exec(reference);
  if (!match || !UUID_PATTERN.test(match[2])) return null;
  return { kind: match[1] as 'purchase' | 'subscription', id: match[2] };
}

export default async function GuidePurchaseSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  if (params.reference && params.guest_access_token) {
    const guestReference = parseGuestReference(params.reference);
    if (!guestReference) {
      return (
        <div className="mx-auto max-w-3xl px-4 py-16">
          <section className="rounded-2xl border border-orange/30 bg-orange/5 p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Link inválido</p>
            <h1 className="mt-3 font-playfair text-3xl font-bold">Não encontramos este acesso.</h1>
            <p className="mt-4 leading-relaxed text-foreground/75">
              O link está incompleto ou foi alterado. Use o link enviado por e-mail ou recupere seu acesso na página do guia.
            </p>
            <Link href="/guias/renda-extra" className="mt-6 inline-flex font-bold text-neon hover:underline">
              Voltar para os guias
            </Link>
          </section>
        </div>
      );
    }
    const [guestPurchase] = guestReference.kind === 'purchase'
      ? await db.select({ offerVariant: guidePurchases.offerVariant }).from(guidePurchases).where(eq(guidePurchases.id, guestReference.id)).limit(1)
      : [];
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <GuestGuideStatus
          reference={params.reference}
          guestAccessToken={params.guest_access_token}
          assets={getGuideAssetsForOffer(guestPurchase?.offerVariant)}
        />
      </div>
    );
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let stripeSession: Stripe.Checkout.Session | null = null;
  if (params.session_id?.startsWith('cs_')) {
    try {
      stripeSession = await getStripeClient().checkout.sessions.retrieve(params.session_id);
    } catch (error) {
      console.error('[GUIDE_SUCCESS] Falha ao consultar sessão Stripe:', error instanceof Error ? error.message : 'erro desconhecido');
    }
  }
  const stripeReference = typeof stripeSession?.metadata?.reference === 'string'
    ? stripeSession.metadata.reference
    : '';
  const parsedStripeReference = parseGuestReference(stripeReference);
  const purchaseReference = parsedStripeReference?.kind === 'purchase' ? parsedStripeReference.id : '';
  const [purchase] = user?.id && purchaseReference
    ? await db.select({
      id: guidePurchases.id,
      status: guidePurchases.status,
      offerVariant: guidePurchases.offerVariant,
      amountCents: guidePurchases.amountCents,
      paymentId: guidePurchases.paymentId,
      downloadCount: guidePurchases.downloadCount,
      maxDownloads: guidePurchases.maxDownloads,
    }).from(guidePurchases).where(and(
      eq(guidePurchases.id, purchaseReference),
      eq(guidePurchases.userId, user.id),
    )).limit(1)
    : [];
  const [subscription] = user?.id && params.plan === 'subscription'
    ? await db.select({
      status: guideSubscriptions.status,
      offerVariant: guideSubscriptions.offerVariant,
      gatewaySubscriptionId: guideSubscriptions.gatewaySubscriptionId,
      downloadCount: guideSubscriptions.downloadCount,
      maxDownloads: guideSubscriptions.maxDownloads,
    })
      .from(guideSubscriptions)
      .where(and(
        eq(guideSubscriptions.userId, user.id),
        eq(guideSubscriptions.status, 'active'),
      ))
      .limit(1)
    : [];
  const paymentId = params.payment_id
    ?? (typeof stripeSession?.payment_intent === 'string' ? stripeSession.payment_intent : stripeSession?.id);
  const stripeSessionId = stripeSession?.id;
  const paymentMatches = Boolean(paymentId) && (
    purchase?.paymentId === paymentId
    || (stripeSessionId === paymentId && purchase?.paymentId === stripeSessionId)
  );
  const isApproved = purchase?.status === 'approved' && paymentMatches;
  const isEnglishEbook = isEnglishEbookOffer(purchase?.offerVariant);
  const languageEbook = getLanguageEbookByOffer(purchase?.offerVariant);
  const isPaidEbook = isEnglishEbook || Boolean(languageEbook);
  const isSubscriptionActive = subscription?.status === 'active';
  const purchaseDownloadsRemaining = purchase ? Math.max(purchase.maxDownloads - purchase.downloadCount, 0) : 0;
  const subscriptionDownloadsRemaining = subscription ? Math.max(subscription.maxDownloads - subscription.downloadCount, 0) : 0;

  const purchaseValueBrl = purchase?.amountCents
    ? purchase.amountCents / 100
    : isPaidEbook
      ? 47
      : 39;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      {isApproved ? (
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8">
          {paymentId && (
            <GuidePurchaseAnalytics
              transactionId={paymentId}
              value={purchaseValueBrl}
              offerVariant={purchase?.offerVariant}
            />
          )}
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Acesso liberado</p>
          <h1 className="mt-3 font-playfair text-4xl font-bold">{isPaidEbook ? 'Pagamento confirmado! Seu e-book está liberado.' : 'Pagamento Confirmado! Seu acesso foi liberado.'}</h1>
          <p className="mt-4 leading-relaxed text-foreground/75">
            {isPaidEbook
              ? `Seu e-book${languageEbook ? ` de ${languageEbook.language.toLowerCase()}` : ' de inglês'} personalizado fica disponível para download protegido.`
              : 'Obrigado pela compra. O Guia Essencial Renda Extra 2027 e os quatro materiais complementares ficam disponíveis para download protegido.'}
          </p>
          {paymentId && user?.id && (
            <GuideAssetDownloads
              assets={getGuideAssetsForOffer(purchase?.offerVariant)}
              initialRemainingDownloads={purchaseDownloadsRemaining}
            />
          )}
        </section>
      ) : isSubscriptionActive ? (
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8">
          {subscription.gatewaySubscriptionId && (
            <GuidePurchaseAnalytics
              transactionId={subscription.gatewaySubscriptionId}
              value={19}
              offerVariant={subscription.offerVariant}
            />
          )}
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Assinatura ativa</p>
          <h1 className="mt-3 font-playfair text-4xl font-bold">Seu acesso mensal foi confirmado.</h1>
          <p className="mt-4 leading-relaxed text-foreground/75">A assinatura dos Guias para Liberdade Financeira está ativa. Os materiais ficam disponíveis por download protegido enquanto o acesso estiver ativo.</p>
          {user?.id && (
            <GuideAssetDownloads
              assets={getGuideAssetsForOffer(subscription.offerVariant)}
              initialRemainingDownloads={subscriptionDownloadsRemaining}
            />
          )}
        </section>
      ) : (
        <section className="rounded-2xl border border-orange/30 bg-orange/5 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Pagamento em processamento</p>
          <h1 className="mt-3 font-playfair text-4xl font-bold">Estamos confirmando seu pagamento.</h1>
          <p className="mt-4 leading-relaxed text-foreground/75">
            O acesso será liberado após a confirmação do Stripe. Se o pagamento já foi aprovado, aguarde alguns instantes e atualize esta página.
          </p>
        </section>
      )}
    </div>
  );
}
