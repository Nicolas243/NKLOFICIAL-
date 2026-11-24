import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, CheckCircle2, Lock, Settings2 } from 'lucide-react';
import { StandalonePwaInstallButton } from '@/components/member/standalone-pwa-install-button';
import { APP_BRAND_NAME } from '@/config/app-brand';
import { PAID_PRODUCTS } from '@/config/products';
import { getUserActiveEntitlements } from '@/lib/entitlements';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Minha Conta',
  description:
    'Acesse suas ferramentas liberadas, materiais adquiridos e outros recursos disponíveis na sua conta.',
};

export default async function MinhaContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect('/login?next=%2Fminha-conta');
  }

  const activeEntitlements = await getUserActiveEntitlements(user.id);
  const unlockedSlugs = new Set(activeEntitlements.map((entry) => entry.productSlug));

  const unlockedProducts = PAID_PRODUCTS.filter((product) =>
    unlockedSlugs.has(product.slug),
  );
  const availableProducts = PAID_PRODUCTS.filter(
    (product) => !unlockedSlugs.has(product.slug),
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 md:pt-12">
      <header className="mb-10 flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-border bg-surface/90 p-6 sm:p-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">
            {APP_BRAND_NAME} · Área do Membro
          </p>
          <h1 className="mt-2 font-playfair text-3xl font-bold sm:text-5xl">
            Minha conta
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground/75 sm:text-base">
            Cada produto adquirido é liberado de forma individual para a sua conta
            {user.email ? ` (${user.email})` : ''}. Veja abaixo exatamente o que está ativo para você agora.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/perfil"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-background/70 px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-neon hover:text-neon"
          >
            <Settings2 size={16} aria-hidden="true" />
            <span>Dados do perfil</span>
          </Link>
        </div>
      </header>

      <section aria-labelledby="unlocked-heading" className="mb-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
              Ativos na sua conta
            </p>
            <h2 id="unlocked-heading" className="mt-1 font-playfair text-2xl font-bold sm:text-3xl">
              Seus Acessos Liberados
            </h2>
          </div>
          <span className="rounded-full border border-border bg-surface px-3.5 py-1 text-xs font-bold text-foreground/80">
            {unlockedProducts.length}{' '}
            {unlockedProducts.length === 1 ? 'acesso ativo' : 'acessos ativos'}
          </span>
        </div>

        {unlockedProducts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface/85 p-6 sm:p-8">
            <p className="text-base font-bold text-foreground">
              Você ainda não possui ferramentas ou guias pagos liberados nesta conta.
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/70">
              Assim que um pagamento é confirmado, apenas a ferramenta ou o material correspondente aparece aqui para uso imediato.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="#outros-recursos"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-neon px-5 py-2.5 text-sm font-bold text-black transition hover:opacity-90"
              >
                <span>Ver recursos disponíveis</span>
                <ArrowRight size={16} aria-hidden="true" />
              </a>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2.5 text-sm font-bold text-foreground hover:border-neon"
              >
                Voltar ao início
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {unlockedProducts.map((product) => {
              const primaryActionLabel = product.hasStandalonePwa
                ? 'Abrir ferramenta'
                : 'Acessar materiais';

              return (
                <article
                  key={product.slug}
                  className="flex flex-col justify-between rounded-2xl border border-emerald-500/35 bg-surface/90 p-6 shadow-sm"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 size={14} aria-hidden="true" />
                        Acesso ativo
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground/55">
                        {product.badgeLabel}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-3.5">
                      {product.hasStandalonePwa && product.pwaIcon192 && (
                        <Image
                          src={product.pwaIcon192}
                          alt={product.pwaBrandName ?? product.title}
                          width={48}
                          height={48}
                          className="h-12 w-12 shrink-0 rounded-xl border border-border object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-playfair text-2xl font-bold text-foreground">
                          {product.title}
                        </h3>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-foreground/75">
                      {product.headline}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                    <Link
                      href={product.toolRoute}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-neon px-5 py-2.5 text-sm font-bold text-black transition hover:opacity-90"
                    >
                      <span>{primaryActionLabel}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>

                    {product.hasStandalonePwa && (
                      <StandalonePwaInstallButton
                        productSlug={product.slug}
                        appName={product.pwaBrandName ?? product.title}
                        iconSrc={product.pwaIcon192 ?? '/icons/portal-nkl-192.png'}
                      />
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section id="outros-recursos" aria-labelledby="available-heading" className="scroll-mt-24">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">
              Catálogo individual
            </p>
            <h2 id="available-heading" className="mt-1 font-playfair text-2xl font-bold sm:text-3xl">
              Outros Recursos Disponíveis
            </h2>
          </div>
          <span className="text-xs font-semibold text-foreground/65">
            Compra separada por item, sem assinatura global obrigatória
          </span>
        </div>

        {availableProducts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface/75 p-6 text-sm text-foreground/75">
            Todos os recursos do catálogo já estão liberados na sua conta.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {availableProducts.map((product) => (
              <article
                key={product.slug}
                className="flex flex-col justify-between rounded-2xl border border-border bg-surface/80 p-6 transition hover:border-orange/50"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-semibold text-foreground/70">
                      <Lock size={13} aria-hidden="true" />
                      {product.badgeLabel}
                    </span>
                    <span className="text-xs font-bold text-orange">
                      {product.priceLabel}
                    </span>
                  </div>

                  <h3 className="mt-4 font-playfair text-xl font-bold text-foreground">
                    {product.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/75">
                    {product.headline}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-foreground/60">
                    {product.billingNote}
                  </p>
                </div>

                <div className="mt-6 border-t border-border pt-4">
                  <Link
                    href={product.offerRoute}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-orange bg-orange/10 px-4 py-2.5 text-sm font-bold text-orange transition-colors hover:bg-orange hover:text-white"
                  >
                    <span>Ver oferta individual</span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
