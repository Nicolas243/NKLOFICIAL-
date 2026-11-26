import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Gift,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { OfferCheckoutCta } from '@/components/funnel/offer-checkout-cta';
import { AdaptiveCtaLink } from '@/components/sales/adaptive-cta-link';
import {
  PAID_PRODUCT_SLUGS,
  getProductBySlug,
  type ProductSlug,
} from '@/config/products';
import { getTrackById } from '@/config/tracks';
import { absoluteSiteUrl } from '@/lib/site';

type OfferPageProps = {
  params: Promise<{ slug: string }>;
};

const PRODUCT_EDITORIAL_CONTEXT: Record<
  ProductSlug,
  { audienceNote: string; rhythmNote: string }
> = {
  'bussola-negocios': {
    audienceNote:
      'Pensada para quem quer sair da indecisão e comparar modelos reais antes de investir horas ou dinheiro no caminho errado.',
    rhythmNote:
      'Inclui roteiro de 7 dias, checklist anti-reprovação e tracker semanal para acompanhar cada teste com calma.',
  },
  'ferramenta-ia': {
    audienceNote:
      'Feita para quem já cansou de respostas genéricas e quer playbooks e prompts organizados direto no celular.',
    rhythmNote:
      'Instale o Estúdio IA como aplicativo próprio e adapte cenários prontos em segundos no estudo ou no trabalho.',
  },
  'pacote-idiomas-ia': {
    audienceNote:
      'Para quem quer praticar inglês todos os dias sem mensalidade cara de escola e ainda usar qualquer IA como apoio de conversa e pronúncia.',
    rhythmNote:
      'Combina os E-books digitais, o guia prático de IA para idiomas, biblioteca de prompts de simulação e voz, rotina de 15 min/dia e kit de sobrevivência remota.',
  },
  'pacote-renda-extra': {
    audienceNote:
      'Criado para organizar candidaturas em sites reais de renda extra sem cair em promessas fáceis.',
    rhythmNote:
      'Acompanha planilha e tracker de envios, checklist anti-reprovação e templates prontos de apresentação.',
  },
  'ebook-ingles': {
    audienceNote:
      'Ideal para ler no transporte, nos intervalos ou em casa, com exemplos práticos e leitura confortável na tela do celular.',
    rhythmNote:
      'São 100 lições curtas e 500 exemplos coloridos com roteiro leve de 15 minutos por dia.',
  },
  'curso-ia-pratica': {
    audienceNote:
      'Para iniciantes e profissionais que querem usar IA com critério, conferência de fontes e privacidade em português simples.',
    rhythmNote:
      'Sete módulos curtos com exercícios aplicáveis no mesmo dia e progresso salvo na sua conta.',
  },
};

export function generateStaticParams(): Array<{ slug: ProductSlug }> {
  return PAID_PRODUCT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: OfferPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Material não encontrado | Portal NKL',
      description: 'Este material não está disponível no momento.',
    };
  }

  return {
    title: `${product.title} | Portal NKL`,
    description: product.aspirationalLead,
    alternates: {
      canonical: absoluteSiteUrl(product.offerRoute),
    },
    openGraph: {
      type: 'website',
      title: `${product.title} | Portal NKL`,
      description: product.aspirationalLead,
      url: absoluteSiteUrl(product.offerRoute),
    },
  };
}

export default async function OfferDetailPage({ params }: OfferPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const track = getTrackById(product.trackId);
  const editorial = PRODUCT_EDITORIAL_CONTEXT[product.slug];

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-foreground/75 transition-colors hover:text-[#c2410c] dark:hover:text-[#fb923c]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Voltar ao início</span>
          </Link>
          <Link
            href="/minha-conta"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-border bg-surface/85 px-3.5 py-2 text-xs font-semibold text-foreground/80 backdrop-blur-sm transition-colors hover:border-[#c2410c] hover:text-[#c2410c] dark:hover:border-[#f97316] dark:hover:text-[#fb923c]"
          >
            Acessar minha conta
          </Link>
        </div>

        <header className="rounded-3xl border border-border bg-surface/90 p-6 shadow-sm backdrop-blur-md sm:p-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center rounded-full border border-[#c2410c]/30 bg-[#c2410c]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#9a3412] dark:border-[#f97316]/35 dark:bg-[#f97316]/15 dark:text-[#fdba74]">
              {product.badgeLabel}
            </span>
            {track && (
              <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground/75">
                Trilha: {track.shortLabel}
              </span>
            )}
          </div>

          <p className="mt-5 text-sm font-bold uppercase tracking-[0.12em] text-foreground/60">
            {product.title}
          </p>
          <h1 className="mt-2 max-w-3xl font-playfair text-3xl font-bold leading-tight text-foreground sm:text-5xl">
            {product.headline}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/80 sm:text-lg">
            {product.aspirationalLead}
          </p>

          <div className="mt-7 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xl font-bold text-foreground sm:text-2xl">
                {product.priceLabel}
              </p>
              <p className="mt-1 text-sm text-foreground/70">
                {product.billingNote}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {product.slug === 'bussola-negocios' && (
                <AdaptiveCtaLink
                  experiment="bussola-cta"
                  href="/quiz-negocios"
                  variants={[
                    { id: '0', label: 'Descobrir meu negócio dos sonhos' },
                    { id: '1', label: 'Mapear minhas 3 melhores ideias' },
                    { id: '2', label: 'Começar pela bússola interativa' },
                  ]}
                  className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-[#c2410c]/40 bg-background/80 px-5 py-3 text-center text-sm font-bold text-[#9a3412] no-underline transition-colors hover:border-[#c2410c] dark:border-[#f97316]/45 dark:text-[#fdba74] dark:hover:border-[#fb923c]"
                />
              )}
              <OfferCheckoutCta
                href={product.checkoutRoute}
                label={product.ctaLabel}
                productSlug={product.slug}
                trackId={product.trackId}
                placement="hero"
                testId="offer-checkout-cta"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-[#c2410c] px-6 py-3 text-center text-sm font-bold text-white no-underline shadow-sm transition-colors hover:bg-[#9a3412] dark:bg-[#f97316] dark:text-[#090b10] dark:hover:bg-[#fb923c]"
              />
            </div>
          </div>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <section
            className="rounded-3xl border border-border bg-surface/90 p-6 shadow-sm backdrop-blur-md"
            aria-labelledby="offer-deliverables-heading"
          >
            <h2
              id="offer-deliverables-heading"
              className="font-playfair text-2xl font-bold text-foreground"
            >
              O que está incluso
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              {editorial.audienceNote}
            </p>
            <ul className="mt-5 space-y-3.5">
              {product.deliverables.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm leading-relaxed text-foreground/90 sm:text-base"
                >
                  <CheckCircle2
                    size={19}
                    className="mt-0.5 shrink-0 text-[#c2410c] dark:text-[#fb923c]"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="rounded-3xl border border-border bg-surface/90 p-6 shadow-sm backdrop-blur-md"
            aria-labelledby="offer-bonuses-heading"
          >
            <div className="flex items-center gap-2">
              <Gift
                size={20}
                className="shrink-0 text-[#c2410c] dark:text-[#fb923c]"
                aria-hidden="true"
              />
              <h2
                id="offer-bonuses-heading"
                className="font-playfair text-2xl font-bold text-foreground"
              >
                Bônus práticos que acompanham este acesso
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              {editorial.rhythmNote}
            </p>
            <ul className="mt-5 space-y-3.5">
              {product.bonuses.map((bonus) => (
                <li
                  key={bonus}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-background p-3.5 text-sm leading-relaxed text-foreground/90"
                >
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                  <span>{bonus}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {product.hasStandalonePwa && product.pwaIcon192 && (
          <section
            className="mt-8 rounded-3xl border border-[#c2410c]/35 bg-surface/90 p-6 shadow-sm backdrop-blur-md dark:border-[#f97316]/35 sm:p-8"
            aria-labelledby="offer-standalone-pwa-heading"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="h-20 w-20 shrink-0 rounded-2xl border border-border bg-[#090b10] p-2">
                <Image
                  src={product.pwaIcon192}
                  alt={`Ícone do aplicativo ${product.pwaBrandName ?? product.title}`}
                  width={64}
                  height={64}
                  className="h-full w-full rounded-xl object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#c2410c] dark:text-[#fb923c]">
                  <Smartphone size={15} aria-hidden="true" />
                  <span>App dedicado incluso</span>
                </p>
                <h2
                  id="offer-standalone-pwa-heading"
                  className="mt-1 font-playfair text-2xl font-bold text-foreground"
                >
                  {product.pwaBrandName} direto na tela inicial do seu celular
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                  Depois da confirmação, o {product.pwaBrandName} pode ser instalado como um
                  aplicativo independente no seu celular ou computador, com ícone próprio para
                  abrir a ferramenta em um toque sem precisar procurar menus.
                </p>
              </div>
            </div>
          </section>
        )}

        <section
          className="mt-8 rounded-3xl border border-border bg-surface/90 p-6 shadow-sm backdrop-blur-md sm:p-8"
          aria-labelledby="offer-transparency-heading"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-foreground/65">
                <ShieldCheck size={16} aria-hidden="true" />
                <span>Transparência na sua conta</span>
              </p>
              <h2
                id="offer-transparency-heading"
                className="mt-1.5 text-lg font-bold text-foreground sm:text-xl"
              >
                Acesso individual liberado direto em Minha Conta
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/75">
                Cada item do Portal NKL funciona de forma independente. Ao confirmar este
                pedido, você libera exatamente o acesso a {product.title} na área{' '}
                <Link
                  href="/minha-conta"
                  className="font-semibold text-[#c2410c] underline underline-offset-4 dark:text-[#fb923c]"
                >
                  Minha Conta
                </Link>
                , sem mistura com outros materiais que você não escolheu.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-2.5 sm:items-end">
              <OfferCheckoutCta
                href={product.checkoutRoute}
                label={product.ctaLabel}
                productSlug={product.slug}
                trackId={product.trackId}
                placement="footer"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-[#c2410c] px-6 py-3 text-sm font-bold text-white no-underline transition-colors hover:bg-[#9a3412] dark:bg-[#f97316] dark:text-[#090b10] dark:hover:bg-[#fb923c]"
              />
              <div className="flex items-center gap-4 text-xs font-semibold text-foreground/70">
                <Link href="/" className="hover:underline">
                  Voltar ao início
                </Link>
                <Link href="/minha-conta" className="hover:underline">
                  Ir para minha conta
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
