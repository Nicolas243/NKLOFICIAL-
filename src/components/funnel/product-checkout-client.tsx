'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import type { PaidProduct } from '@/config/products';
import { trackBeginCheckout } from '@/lib/analytics';
import { getAiOfferPriceCents, type AiOfferPlan } from '@/lib/ai-product';
import { getGuideTierPriceCents } from '@/lib/guide-offer';
import { isValidCpf, normalizeCpf } from '@/lib/guide-personalization';

type ProductCheckoutClientProps = {
  product: PaidProduct;
  isLoggedIn: boolean;
  userEmail: string | null;
};

type AiCheckoutResponse = {
  url?: string;
  error?: string;
  message?: string;
};

type GuideCheckoutResponse = {
  checkoutUrl?: string;
  error?: string;
  message?: string;
};

const guideCheckoutFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Informe seu nome completo para personalizar o material.')
    .max(160, 'O nome informado está muito longo.'),
  email: z
    .string()
    .trim()
    .email('Informe um e-mail válido para receber a confirmação.')
    .max(320, 'O e-mail informado está muito longo.'),
  cpf: z
    .string()
    .trim()
    .refine((value) => isValidCpf(value), 'Informe um CPF válido com 11 dígitos.'),
  cpfConsentConfirmed: z
    .boolean()
    .refine(
      (value) => value === true,
      'Confirme o uso do CPF apenas para personalizar e proteger seus materiais.',
    ),
});

function formatCpfValue(rawValue: string): string {
  const digits = normalizeCpf(rawValue).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function ProductCheckoutClient({
  product,
  isLoggedIn,
  userEmail,
}: ProductCheckoutClientProps) {
  const router = useRouter();
  const loginHref = `/login?next=${encodeURIComponent(product.checkoutRoute)}`;

  const [selectedPlan, setSelectedPlan] = useState<AiOfferPlan>(
    product.legacyOfferVariant === 'ai-subscription' ? 'subscription' : 'one_time',
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(userEmail ?? '');
  const [cpf, setCpf] = useState('');
  const [cpfConsentConfirmed, setCpfConsentConfirmed] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requiresAuthAction, setRequiresAuthAction] = useState(false);

  async function handleAiCheckout(): Promise<void> {
    trackBeginCheckout({
      funnel: `product-checkout:${product.slug}`,
      tier: selectedPlan,
      valueBrl: getAiOfferPriceCents(selectedPlan) / 100,
      productSlug: product.slug,
    });
    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);
    setRequiresAuthAction(false);

    try {
      const response = await fetch('/api/payments/create-ai-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          productSlug: product.slug,
        }),
      });

      const payload = (await response.json().catch(() => null)) as AiCheckoutResponse | null;

      if (response.status === 401 || payload?.error === 'auth_required') {
        setRequiresAuthAction(true);
        setStatusMessage(
          payload?.message ??
            'Entre na sua conta antes de finalizar para vincular o acesso ao seu perfil.',
        );
        router.push(loginHref);
        return;
      }

      if (response.status === 503 || payload?.error === 'ai_checkout_not_configured') {
        setStatusMessage(
          payload?.message ??
            'Este pagamento ainda está aguardando configuração no Stripe. Nenhuma cobrança foi realizada.',
        );
        return;
      }

      if (response.ok && payload?.url) {
        window.location.assign(payload.url);
        return;
      }

      setErrorMessage(
        payload?.message ??
          'Não foi possível iniciar o pagamento agora. Tente novamente em instantes.',
      );
    } catch {
      setErrorMessage(
        'Não foi possível conectar ao serviço de pagamento. Verifique sua conexão e tente novamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGuideCheckout(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    const parsed = guideCheckoutFormSchema.safeParse({
      fullName,
      email,
      cpf,
      cpfConsentConfirmed,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setErrorMessage(
        firstIssue?.message ??
          'Revise seu nome, e-mail, CPF e a confirmação antes de continuar.',
      );
      return;
    }

    setIsSubmitting(true);
    trackBeginCheckout({
      funnel: `product-checkout:${product.slug}`,
      tier: 'complete',
      valueBrl: getGuideTierPriceCents(product.legacyOfferVariant, 'complete', 0).amountCents / 100,
      offerVariant: product.legacyOfferVariant,
      productSlug: product.slug,
    });

    try {
      const response = await fetch('/api/payments/create-guide-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug: product.slug,
          offerVariant: product.legacyOfferVariant,
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          cpf: normalizeCpf(parsed.data.cpf),
          cpfConsentConfirmed: true,
        }),
      });

      const payload = (await response.json().catch(() => null)) as GuideCheckoutResponse | null;

      if (response.ok && payload?.checkoutUrl) {
        window.location.assign(payload.checkoutUrl);
        return;
      }

      setErrorMessage(
        payload?.message ??
          'Não foi possível iniciar o pagamento no momento. Tente novamente.',
      );
    } catch {
      setErrorMessage(
        'Não foi possível conectar ao servidor de pagamento. Tente novamente em instantes.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={product.offerRoute}
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-foreground/75 transition-colors hover:text-[#c2410c] dark:hover:text-[#fb923c]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Voltar para detalhes de {product.shortName}</span>
          </Link>
          <Link
            href="/minha-conta"
            className="inline-flex min-h-[44px] items-center text-xs font-semibold text-foreground/70 hover:underline"
          >
            Minha conta
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <aside className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
            <span className="inline-flex items-center rounded-full border border-[#c2410c]/30 bg-[#c2410c]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#9a3412] dark:border-[#f97316]/35 dark:bg-[#f97316]/15 dark:text-[#fdba74]">
              {product.badgeLabel}
            </span>

            <h1 className="mt-4 font-playfair text-2xl font-bold leading-snug text-foreground sm:text-3xl">
              {product.title}
            </h1>
            <p className="mt-2 text-lg font-bold text-[#c2410c] dark:text-[#fb923c]">
              {product.priceLabel}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/75">
              {product.billingNote}
            </p>

            <div className="mt-5 border-t border-border pt-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-foreground/60">
                O que será liberado
              </p>
              <ul className="mt-3 space-y-2.5">
                {product.deliverables.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/85"
                  >
                    <CheckCircle2
                      size={16}
                      className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-background p-4 text-xs leading-relaxed text-foreground/70">
              <p className="flex items-center gap-2 font-bold text-foreground">
                <ShieldCheck size={15} aria-hidden="true" />
                <span>Pagamento processado pelo Stripe</span>
              </p>
              <p className="mt-1">
                A liberação acontece somente após confirmação do pagamento e fica separada
                por item na sua área Minha Conta.
              </p>
            </div>
          </aside>

          <section
            className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8"
            aria-labelledby="checkout-form-heading"
          >
            <h2
              id="checkout-form-heading"
              className="font-playfair text-2xl font-bold text-foreground"
            >
              Concluir pedido individual
            </h2>

            {product.stripeCheckoutKind === 'ai' ? (
              <div className="mt-5 space-y-5">
                {isLoggedIn && userEmail ? (
                  <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-3.5 text-sm text-emerald-900 dark:text-emerald-200">
                    <UserCheck size={18} className="shrink-0" aria-hidden="true" />
                    <span>
                      Conta conectada: <strong>{userEmail}</strong>
                    </span>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#c2410c]/30 bg-[#c2410c]/10 p-4 text-sm text-foreground dark:border-[#f97316]/35 dark:bg-[#f97316]/10">
                    <p className="font-semibold">
                      Este acesso é vinculado à sua conta Portal NKL.
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/80">
                      Entre antes de pagar para salvar automaticamente o acesso em Minha Conta.
                    </p>
                    <Link
                      href={loginHref}
                      data-testid="checkout-login-link"
                      className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c2410c] px-4 py-2 text-xs font-bold text-[#9a3412] no-underline transition-colors hover:bg-[#c2410c] hover:text-white dark:border-[#f97316] dark:text-[#fdba74] dark:hover:bg-[#f97316] dark:hover:text-[#090b10]"
                    >
                      Entrar na minha conta para continuar
                    </Link>
                  </div>
                )}

                <fieldset className="space-y-3">
                  <legend className="text-xs font-bold uppercase tracking-[0.12em] text-foreground/65">
                    Escolha a modalidade de acesso
                  </legend>

                  <label
                    className={[
                      'flex min-h-[52px] cursor-pointer items-start justify-between gap-3 rounded-2xl border p-4 transition-colors',
                      selectedPlan === 'one_time'
                        ? 'border-[#c2410c] bg-[#c2410c]/10 dark:border-[#f97316] dark:bg-[#f97316]/15'
                        : 'border-border bg-background hover:border-[#c2410c]/50',
                    ].join(' ')}
                  >
                    <span className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="ai-plan"
                        value="one_time"
                        checked={selectedPlan === 'one_time'}
                        onChange={() => setSelectedPlan('one_time')}
                        className="mt-1 h-4 w-4 accent-[#c2410c]"
                      />
                      <span>
                        <span className="block text-sm font-bold text-foreground">
                          Acesso completo (pagamento único)
                        </span>
                        <span className="mt-0.5 block text-xs text-foreground/70">
                          Pague uma vez para usar sem mensalidade.
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-foreground">
                      R$ 99,00
                    </span>
                  </label>

                  <label
                    className={[
                      'flex min-h-[52px] cursor-pointer items-start justify-between gap-3 rounded-2xl border p-4 transition-colors',
                      selectedPlan === 'subscription'
                        ? 'border-[#c2410c] bg-[#c2410c]/10 dark:border-[#f97316] dark:bg-[#f97316]/15'
                        : 'border-border bg-background hover:border-[#c2410c]/50',
                    ].join(' ')}
                  >
                    <span className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="ai-plan"
                        value="subscription"
                        checked={selectedPlan === 'subscription'}
                        onChange={() => setSelectedPlan('subscription')}
                        className="mt-1 h-4 w-4 accent-[#c2410c]"
                      />
                      <span>
                        <span className="block text-sm font-bold text-foreground">
                          Assinatura mensal
                        </span>
                        <span className="mt-0.5 block text-xs text-foreground/70">
                          Renovação mensal flexível direto pelo Stripe.
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-foreground">
                      R$ 39/mês
                    </span>
                  </label>
                </fieldset>

                <button
                  type="button"
                  onClick={() => void handleAiCheckout()}
                  disabled={isSubmitting}
                  data-testid="checkout-submit-button"
                  className="inline-flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#c2410c] px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#9a3412] disabled:cursor-wait disabled:opacity-60 dark:bg-[#f97316] dark:text-[#090b10] dark:hover:bg-[#fb923c]"
                >
                  <Lock size={16} aria-hidden="true" />
                  <span>
                    {isSubmitting
                      ? 'Preparando pagamento seguro...'
                      : 'Ir para pagamento seguro'}
                  </span>
                </button>
              </div>
            ) : (
              <form
                onSubmit={(event) => void handleGuideCheckout(event)}
                className="mt-5 space-y-4"
                noValidate
              >
                <p className="text-sm leading-relaxed text-foreground/75">
                  Preencha seus dados abaixo para gerar a cópia personalizada e seguir ao
                  checkout seguro no Stripe.
                </p>

                <div>
                  <label
                    htmlFor="checkout-full-name"
                    className="block text-xs font-bold uppercase tracking-[0.12em] text-foreground/70"
                  >
                    Nome completo
                  </label>
                  <input
                    id="checkout-full-name"
                    name="fullName"
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Seu nome completo"
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-[#c2410c] focus:ring-2 focus:ring-[#c2410c]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-email"
                    className="block text-xs font-bold uppercase tracking-[0.12em] text-foreground/70"
                  >
                    E-mail para receber o acesso
                  </label>
                  <input
                    id="checkout-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@exemplo.com"
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-[#c2410c] focus:ring-2 focus:ring-[#c2410c]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-cpf"
                    className="block text-xs font-bold uppercase tracking-[0.12em] text-foreground/70"
                  >
                    CPF para personalizar os materiais
                  </label>
                  <input
                    id="checkout-cpf"
                    name="cpf"
                    type="text"
                    inputMode="numeric"
                    required
                    autoComplete="off"
                    value={cpf}
                    onChange={(event) => setCpf(formatCpfValue(event.target.value))}
                    placeholder="000.000.000-00"
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-[#c2410c] focus:ring-2 focus:ring-[#c2410c]/20"
                  />
                </div>

                <label className="flex min-h-[44px] cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground/80">
                  <input
                    type="checkbox"
                    checked={cpfConsentConfirmed}
                    onChange={(event) => setCpfConsentConfirmed(event.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#c2410c]"
                  />
                  <span>
                    Concordo que o CPF seja usado apenas para personalizar e proteger meus
                    materiais digitais.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="checkout-submit-button"
                  className="inline-flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#c2410c] px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#9a3412] disabled:cursor-wait disabled:opacity-60 dark:bg-[#f97316] dark:text-[#090b10] dark:hover:bg-[#fb923c]"
                >
                  <Lock size={16} aria-hidden="true" />
                  <span>
                    {isSubmitting
                      ? 'Preparando pagamento seguro...'
                      : 'Ir para pagamento seguro'}
                  </span>
                </button>
              </form>
            )}

            {statusMessage && (
              <div
                role="status"
                className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-950 dark:text-amber-200"
              >
                <p>{statusMessage}</p>
                {requiresAuthAction && (
                  <Link
                    href={loginHref}
                    data-testid="checkout-auth-redirect-link"
                    className="mt-2 inline-flex min-h-[44px] items-center font-bold underline underline-offset-4"
                  >
                    Ir para tela de login
                  </Link>
                )}
              </div>
            )}

            {errorMessage && (
              <p
                role="alert"
                className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm font-semibold leading-relaxed text-red-900 dark:text-red-200"
              >
                {errorMessage}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
