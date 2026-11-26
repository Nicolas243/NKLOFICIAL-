import type { Metadata } from 'next';
import Link from 'next/link';
import { AdBanner } from '@/components/ads/ad-banner';
import { AdCampaignForm } from '@/components/ads/ad-campaign-form';
import { absoluteSiteUrl } from '@/lib/site';
import { getAdPricing, formatAdPrice } from '@/lib/ad-inventory';
import { createClient } from '@/lib/supabase/server';
import { buildLoginPath } from '@/lib/auth/return-intent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Anuncie em Renda Extra',
  description: 'Conheça os espaços publicitários próprios do Portal NKL.',
  alternates: { canonical: absoluteSiteUrl('/programas/anuncie') },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdvertisePage({ searchParams }: { searchParams: SearchParams }) {
  const search = await searchParams;
  const shouldStartCheckout = search.start === '1';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adPricing = getAdPricing();
  const loginPath = buildLoginPath('/programas/anuncie?start=1', null, 'income');

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-4 md:pt-8">
      <header className="rounded-[1.5rem] border border-border bg-income-surface/90 px-5 py-8 md:rounded-[2rem] md:px-12 md:py-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Prévia de lançamento</p>
        <h1 className="mt-3 max-w-3xl font-playfair text-4xl font-bold leading-tight md:text-6xl">Anuncie no Portal NKL</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/75 md:text-lg">
          Apresente sua marca em uma faixa editorial do Portal NKL, entre conteúdos que ajudam pessoas
          a comparar oportunidades, serviços e ferramentas. O inventário é pequeno de propósito:
          cada cota é visível, identificada e revisada antes de ir ao ar.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {user?.id ? (
            <Link href="#reserva" className="inline-flex min-h-11 items-center rounded-md bg-neon px-5 py-3 text-sm font-bold text-black hover:opacity-90">
              Quero anunciar
            </Link>
          ) : (
            <Link href={loginPath} className="inline-flex min-h-11 items-center rounded-md bg-neon px-5 py-3 text-sm font-bold text-black hover:opacity-90">
              Quero anunciar
            </Link>
          )}
          <Link href="#como-funciona" className="inline-flex min-h-11 items-center rounded-md border border-border px-5 py-3 text-sm font-bold hover:border-neon hover:text-neon">
            Ver como funciona
          </Link>
        </div>
      </header>

      <div className="mt-5 rounded-xl border border-orange/30 bg-orange/5 px-4 py-3 text-sm leading-relaxed text-foreground/75">
        <strong className="text-foreground">Lançamento com revisão humana.</strong> O checkout pode receber
        a assinatura, mas nenhum anúncio é publicado automaticamente: primeiro conferimos o criativo,
        o destino e as regras de conteúdo.
      </div>

      <div className="mt-8">
        <AdBanner placement="sales" />
      </div>

      <section id="oferta" className="mt-8 rounded-2xl border border-orange/30 bg-orange/5 p-5 md:p-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange">Promoção de lançamento</p>
        <h2 className="mt-2 font-playfair text-3xl font-bold">Uma assinatura mensal para anunciar</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground/75">
          Escolha de 1 a 10 cotas para o mesmo criativo. Em novembro, cada cota custa{' '}
          <strong className="text-orange">{formatAdPrice(adPricing.monthlyPriceCents)}/mês</strong>.
          {adPricing.isPromotionActive && <> Esse valor promocional é válido somente neste mês.</>}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground/65">
          Preço normal <del>{formatAdPrice(adPricing.standardPriceCents)}/mês</del>; aproveite o valor promocional de lançamento.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-income-surface/80 p-5 md:p-6">
        <h2 className="font-playfair text-2xl font-bold">Transparência antes da promessa</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-foreground/70 md:grid-cols-2">
          <li>O Google Tag pode medir eventos, mas não adiciona cobrança automaticamente aos cliques.</li>
          <li>O contrato define conteúdo proibido, revisão, suspensão e cancelamento.</li>
          <li>Cliques são registrados pelo Portal de forma agregada e sem vender dados pessoais.</li>
        </ul>
      </section>

      <section id="como-funciona" className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="rounded-2xl border border-border bg-income-surface/80 p-5 md:p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange">Como funciona</p>
          <h2 className="mt-2 font-playfair text-3xl font-bold">Pagamento não publica sozinho</h2>
          <ol className="mt-5 space-y-4 text-sm leading-relaxed text-foreground/70">
            <li><strong className="text-foreground">1. Assine com Stripe.</strong> O botão abaixo abre o checkout seguro da assinatura recorrente.</li>
            <li><strong className="text-foreground">2. Envie o material após a confirmação.</strong> O Stripe redirecionará você para a área própria de anexar o criativo.</li>
            <li><strong className="text-foreground">3. Nós revisamos.</strong> Você acompanha a análise; conteúdos proibidos ou enganosos não entram no Portal.</li>
            <li><strong className="text-foreground">4. Publicamos.</strong> O anúncio fica ativo enquanto a assinatura e a aprovação estiverem válidas.</li>
          </ol>
          <Link href="/programas/anuncie/contrato" className="mt-6 inline-flex text-sm font-bold text-neon hover:underline">Ler contrato completo →</Link>
        </div>
        <AdCampaignForm
          initialEmail={user?.email ?? ''}
          monthlyPriceCents={adPricing.monthlyPriceCents}
          autoStart={shouldStartCheckout}
          isAuthenticated={Boolean(user?.id)}
          loginPath={loginPath}
        />
      </section>
    </div>
  );
}
