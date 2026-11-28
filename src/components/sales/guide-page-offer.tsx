'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { DecoyPricingGrid, type DecoyTierOption } from '@/components/sales/decoy-pricing-grid';
import { trackBeginCheckout, trackOfferFunnelEvent } from '@/lib/analytics';
import type { GuideResumeIntent } from '@/lib/auth/return-intent';
import {
  GUIDE_PAGE_CTA_VARIANTS,
  GUIDE_SUBSCRIPTION_PRICE_CENTS,
  INCOME_GUIDE_TIER_PRICES_CENTS,
  withOfferTier,
  type GuidePageCtaVariant,
} from '@/lib/guide-offer';

export type GuideOfferOptionId = 'complete' | 'subscription' | 'vip';

const RENDA_EXTRA_THREE_OPTIONS: readonly DecoyTierOption<GuideOfferOptionId>[] = [
  {
    id: 'complete',
    badge: 'Compra única',
    name: 'Pacote Completo (Avulso)',
    priceLabel: 'R$ 39',
    compareAtLabel: 'R$ 97',
    priceSuffix: 'pagamento único',
    subtitle: 'Leve os 5 arquivos atuais de uma só vez, sem novos guias nem atualizações mensais.',
    valueBrl: INCOME_GUIDE_TIER_PRICES_CENTS.complete / 100,
    ctaLabel: 'Escolher Pacote Único (R$ 39)',
    features: [
      { label: 'Guia Essencial Renda Extra 2027 (PDF com CPF)', included: true },
      { label: 'O Código de Novembro & Dinheiro Para Ontem', included: true },
      { label: 'Escudo de Black Friday + Planilhas Raio-X (PC e Mobile)', included: true },
      { label: 'Novos guias e atualizações mensais NKL', included: false },
      { label: '6 E-books completos de Idiomas NKL', included: false },
    ],
  },
  {
    id: 'subscription',
    badge: 'Mais vantajoso',
    name: 'Assinatura Liberdade Financeira',
    priceLabel: 'R$ 19',
    compareAtLabel: 'R$ 39',
    priceSuffix: '/mês',
    subtitle: 'Todos os 5 materiais liberados agora + novos PDFs e atualizações mensais pela metade do valor avulso.',
    recommended: true,
    valueBrl: GUIDE_SUBSCRIPTION_PRICE_CENTS / 100,
    ctaLabel: 'Assinar por R$ 19/mês',
    features: [
      { label: 'Guia Essencial Renda Extra 2027 (PDF com CPF)', included: true },
      { label: 'O Código de Novembro & Dinheiro Para Ontem', included: true },
      { label: 'Escudo de Black Friday + Planilhas Raio-X (PC e Mobile)', included: true },
      { label: 'Novos guias e atualizações mensais (cancele quando quiser)', included: true },
      { label: '6 E-books completos de Idiomas NKL', included: false },
    ],
  },
  {
    id: 'vip',
    badge: 'Acervo completo',
    name: 'Acervo Total NKL (11 Materiais)',
    priceLabel: 'R$ 247',
    compareAtLabel: 'R$ 379',
    priceSuffix: 'pagamento único',
    subtitle: 'Os 5 arquivos de Renda Extra + todos os 6 E-books de idiomas liberados em acesso vitalício.',
    valueBrl: INCOME_GUIDE_TIER_PRICES_CENTS.vip / 100,
    ctaLabel: 'Escolher Acervo Total (R$ 247)',
    features: [
      { label: 'Guia Essencial Renda Extra 2027 (PDF com CPF)', included: true },
      { label: 'O Código de Novembro & Dinheiro Para Ontem', included: true },
      { label: 'Escudo de Black Friday + Planilhas Raio-X (PC e Mobile)', included: true },
      { label: 'Acesso vitalício sem mensalidade', included: true },
      { label: '6 E-books completos de Idiomas NKL (Inglês a Mandarim)', included: true },
    ],
  },
];

const OPTION_SUMMARY_COPY: Record<
  GuideOfferOptionId,
  { priceDisplay: string; compareAt: string | null; note: string; submitLabel: string }
> = {
  subscription: {
    priceDisplay: 'R$ 19/mês',
    compareAt: 'R$ 39',
    note: 'assinatura mensal · cancele quando quiser',
    submitLabel: 'Começar por R$ 19/mês',
  },
  complete: {
    priceDisplay: 'R$ 39,00',
    compareAt: 'R$ 97,00',
    note: 'pagamento único · 5 arquivos',
    submitLabel: 'Liberar pacote único (R$ 39)',
  },
  vip: {
    priceDisplay: 'R$ 247,00',
    compareAt: 'R$ 379,00',
    note: 'pagamento único · 11 materiais',
    submitLabel: 'Liberar Acervo Total (R$ 247)',
  },
};

const STORAGE_KEY = 'nkl_guide_page_cta_variant_v1';
const IMPRESSION_KEY_PREFIX = `${STORAGE_KEY}:impression:`;

type GuidePageOfferProps = {
  id?: string;
  initialVariant: GuidePageCtaVariant | null;
  purchaseOfferVariant?: string;
  subscriptionOfferVariant?: string;
  resumeIntent?: GuideResumeIntent | null;
  forceFallback?: boolean;
};

type CheckoutApiResponse = {
  error?: string;
  checkoutUrl?: string;
  message?: string;
};

function randomVariant(): GuidePageCtaVariant {
  const index = Math.floor(Math.random() * GUIDE_PAGE_CTA_VARIANTS.length);
  return GUIDE_PAGE_CTA_VARIANTS[index]?.id ?? '0';
}

function readStoredVariant(): GuidePageCtaVariant | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return GUIDE_PAGE_CTA_VARIANTS.some((variant) => variant.id === stored)
      ? stored as GuidePageCtaVariant
      : null;
  } catch {
    return null;
  }
}

function persistVariant(variant: GuidePageCtaVariant): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, variant);
  } catch (error) {
    console.error('[GUIDE_PAGE_CTA] Falha ao persistir variante:', error instanceof Error ? error.message : 'erro desconhecido');
  }
}

export function GuidePageOffer({
  id,
  initialVariant,
  purchaseOfferVariant = 'sales-page',
  subscriptionOfferVariant = 'sales-page:subscription',
  resumeIntent = null,
  forceFallback = false,
}: GuidePageOfferProps) {
  const [variantId, setVariantId] = useState<GuidePageCtaVariant | null>(initialVariant);
  const [selectedOption, setSelectedOption] = useState<GuideOfferOptionId>(
    resumeIntent === 'purchase' ? 'complete' : 'subscription',
  );
  const [offerVerified, setOfferVerified] = useState<'checking' | 'approved' | 'unavailable'>('checking');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [cpfConsentConfirmed, setCpfConsentConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const cpfInputRef = useRef<HTMLInputElement>(null);

  const variant = useMemo(
    () => GUIDE_PAGE_CTA_VARIANTS.find((item) => item.id === variantId) ?? (
      forceFallback
        ? {
            title: 'Guia Essencial Renda Extra 2027',
            summary: 'Um pacote organizado para estudar oportunidades de renda extra com mais clareza, sem promessa de resultado.',
            ctaLabel: 'Começar por R$ 19/mês',
          }
        : null
    ),
    [forceFallback, variantId],
  );

  const verifyOfferAvailability = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/sales/verify-offer', { cache: 'no-store' });
      const payload: { verified?: boolean } = await response.json();
      setOfferVerified(response.ok && payload.verified ? 'approved' : 'unavailable');
    } catch (error) {
      console.error('[GUIDE_OFFER] Falha ao verificar oferta:', error instanceof Error ? error.message : 'erro desconhecido');
      setOfferVerified('unavailable');
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void verifyOfferAvailability();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [verifyOfferAvailability]);

  useEffect(() => {
    if (!resumeIntent) return;
    cpfInputRef.current?.scrollIntoView({ block: 'center' });
    cpfInputRef.current?.focus();
  }, [resumeIntent]);

  useEffect(() => {
    if (initialVariant !== null) {
      persistVariant(initialVariant);
      return;
    }
    if (forceFallback) return;

    const storedVariant = readStoredVariant();
    if (storedVariant !== null) {
      const frame = window.requestAnimationFrame(() => setVariantId(storedVariant));
      return () => window.cancelAnimationFrame(frame);
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);

    async function selectVariant(): Promise<void> {
      try {
        const response = await fetch('/api/sales/offer-events?experiment=guide-page-cta', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Resposta ${response.status}`);
        const payload: { variant?: string } = await response.json();
        const selected = GUIDE_PAGE_CTA_VARIANTS.find((item) => item.id === payload.variant)?.id;
        if (!selected) throw new Error('Variante inválida.');
        persistVariant(selected);
        if (!cancelled) setVariantId(selected);
      } catch (error) {
        if (controller.signal.aborted || cancelled) return;
        console.error('[GUIDE_PAGE_CTA] Falha ao escolher variante:', error instanceof Error ? error.message : 'erro desconhecido');
        const fallback = randomVariant();
        persistVariant(fallback);
        if (!cancelled) setVariantId(fallback);
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void selectVariant();
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [forceFallback, initialVariant]);

  useEffect(() => {
    if (variantId === null) return;
    try {
      const impressionKey = `${IMPRESSION_KEY_PREFIX}${variantId}`;
      if (window.localStorage.getItem(impressionKey) === '1') return;
      window.localStorage.setItem(impressionKey, '1');
    } catch {
      return;
    }
    trackOfferFunnelEvent(`guide-page-cta:${variantId}`, 'impression');
  }, [variantId]);

  if (variant === null) {
    return (
      <aside className="md:sticky md:top-20" aria-live="polite">
        <div className="rounded-2xl border border-orange/25 bg-income-surface p-6 shadow-sm md:p-8">
          <p className="text-sm text-foreground/70">Preparando os detalhes da assinatura e pacotes...</p>
        </div>
      </aside>
    );
  }

  const offerVariant = variantId === null ? purchaseOfferVariant : `guide-page-cta:${variantId}`;
  const activeOption = RENDA_EXTRA_THREE_OPTIONS.find((option) => option.id === selectedOption) ?? RENDA_EXTRA_THREE_OPTIONS[1]!;
  const priceCopy = OPTION_SUMMARY_COPY[selectedOption];
  const isSubscription = selectedOption === 'subscription';
  const resolvedSubscriptionOfferVariant = variantId === null ? subscriptionOfferVariant : offerVariant;
  const resolvedPurchaseOfferVariant = withOfferTier(
    offerVariant,
    selectedOption === 'vip' ? 'vip' : 'complete',
  );

  async function handleCheckoutSubmit(): Promise<void> {
    setMessage(null);
    const activeAttribution = isSubscription
      ? resolvedSubscriptionOfferVariant
      : resolvedPurchaseOfferVariant;
    trackOfferFunnelEvent(activeAttribution, 'checkout');
    trackBeginCheckout({
      funnel: 'renda-extra-guide',
      tier: selectedOption,
      valueBrl: activeOption.valueBrl,
      offerVariant: activeAttribution,
    });

    setIsLoading(true);
    try {
      const endpoint = isSubscription
        ? '/api/payments/create-guide-subscription'
        : '/api/payments/create-guide-checkout';
      const bodyPayload = isSubscription
        ? {
            offerVariant: resolvedSubscriptionOfferVariant,
            cancelPath: typeof window !== 'undefined' ? window.location.pathname : '/guias/renda-extra',
            fullName,
            email,
            cpf,
            cpfConsentConfirmed,
          }
        : {
            offerVariant: resolvedPurchaseOfferVariant,
            tier: selectedOption,
            cancelPath: typeof window !== 'undefined' ? window.location.pathname : '/guias/renda-extra',
            fullName,
            email,
            cpf,
            cpfConsentConfirmed,
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      const payload: CheckoutApiResponse = await response.json();
      if (!response.ok || !payload.checkoutUrl) {
        setMessage(
          payload.message ??
          payload.error ??
          (isSubscription
            ? 'Não foi possível iniciar a assinatura.'
            : 'Não foi possível iniciar o checkout.'),
        );
        return;
      }
      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível conectar ao pagamento agora. Tente novamente.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div id={id} className="scroll-mt-24 space-y-6">
      <DecoyPricingGrid
        funnel="renda-extra-guide"
        eyebrow="3 formatos claros de acesso"
        heading="Escolha seu plano para liberar os 5 materiais agora"
        subheading="A assinatura de R$ 19/mês já libera todos os 5 arquivos na hora pela metade do pacote avulso e ainda inclui novos guias todo mês."
        options={RENDA_EXTRA_THREE_OPTIONS}
        selectedTier={selectedOption}
        onSelectTier={setSelectedOption}
        offerVariant={offerVariant}
      />

      <section
        id="guide-unified-checkout"
        className="mx-auto max-w-2xl rounded-3xl border border-orange/35 bg-income-surface p-6 shadow-sm md:p-8"
        aria-labelledby="guide-checkout-title"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">
              {isSubscription ? 'Assinatura selecionada' : 'Opção selecionada'}
            </p>
            <h2 id="guide-checkout-title" className="mt-2 font-playfair text-2xl font-bold sm:text-3xl">
              {isSubscription ? 'Guias para Liberdade Financeira' : activeOption.name}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/75">
              {isSubscription ? variant.summary : activeOption.subtitle}
            </p>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            {priceCopy.compareAt && (
              <span className="block text-sm text-foreground/45 line-through">{priceCopy.compareAt}</span>
            )}
            <span className="font-playfair text-4xl font-bold text-orange">{priceCopy.priceDisplay}</span>
            <span className="block text-xs font-bold uppercase tracking-wide text-foreground/55">
              {priceCopy.note}
            </span>
          </div>
        </div>

        {offerVerified === 'unavailable' && (
          <p role="alert" className="mt-4 rounded-xl border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-900 dark:text-red-100">
            A oferta não pôde ser confirmada agora. Tente atualizar a página em instantes.
          </p>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleCheckoutSubmit();
          }}
          className="mt-5 space-y-4"
          noValidate
        >
          <div>
            <label htmlFor="guide-checkout-name" className="block text-xs font-bold uppercase tracking-[0.12em] text-foreground/70">
              Nome completo
            </label>
            <input
              id="guide-checkout-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Seu nome completo"
              autoComplete="name"
              className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20"
            />
          </div>

          <div>
            <label htmlFor="guide-checkout-email" className="block text-xs font-bold uppercase tracking-[0.12em] text-foreground/70">
              E-mail para receber o acesso
            </label>
            <input
              id="guide-checkout-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@exemplo.com"
              autoComplete="email"
              className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20"
            />
          </div>

          <div>
            <label htmlFor="guide-checkout-cpf" className="block text-xs font-bold uppercase tracking-[0.12em] text-foreground/70">
              CPF para personalizar os materiais
            </label>
            <input
              id="guide-checkout-cpf"
              ref={cpfInputRef}
              inputMode="numeric"
              value={cpf}
              onChange={(event) => setCpf(event.target.value)}
              placeholder="000.000.000-00"
              autoComplete="off"
              className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20"
            />
          </div>

          <label className="flex items-start gap-2.5 rounded-xl border border-border bg-background/70 p-3 text-xs leading-relaxed text-foreground/75">
            <input
              type="checkbox"
              checked={cpfConsentConfirmed}
              onChange={(event) => setCpfConsentConfirmed(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-orange"
            />
            <span>Concordo que o CPF seja usado apenas para personalizar e proteger meus materiais.</span>
          </label>

          <button
            type="submit"
            disabled={isLoading || offerVerified === 'unavailable'}
            className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-orange px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-dark disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isLoading ? 'Preparando pagamento seguro...' : priceCopy.submitLabel}
          </button>

          {message && (
            <p className="rounded-xl border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-900 dark:text-red-200" role="alert">
              {message}
            </p>
          )}

          <p className="flex items-center justify-center gap-2 pt-1 text-center text-xs text-foreground/60">
            <ShieldCheck size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>O pagamento é processado pelo Stripe e o acesso é liberado após a confirmação.</span>
          </p>
        </form>
      </section>
    </div>
  );
}
