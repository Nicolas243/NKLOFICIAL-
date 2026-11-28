import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductCheckoutClient } from '@/components/funnel/product-checkout-client';
import { getProductBySlug } from '@/config/products';
import type { OfferTier } from '@/lib/guide-offer';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type CheckoutPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ tier?: string }>;
};

function parseInitialTier(rawTier: string | undefined): OfferTier | undefined {
  if (rawTier === 'essential' || rawTier === 'complete' || rawTier === 'vip') {
    return rawTier;
  }
  return undefined;
}

export async function generateMetadata({
  params,
}: CheckoutPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Checkout não encontrado | Portal NKL',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Finalizar acesso · ${product.title} | Portal NKL`,
    description: `Conclua o pagamento seguro para liberar ${product.title} na sua conta.`,
    robots: { index: false, follow: false },
  };
}

async function loadCheckoutAuthState(): Promise<{
  isLoggedIn: boolean;
  userEmail: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return {
      isLoggedIn: Boolean(user?.id),
      userEmail: user?.email ?? null,
    };
  } catch {
    return {
      isLoggedIn: false,
      userEmail: null,
    };
  }
}

export default async function OfferCheckoutPage({
  params,
  searchParams,
}: CheckoutPageProps) {
  const [{ slug }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({} as { tier?: string }),
  ]);
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const authState = await loadCheckoutAuthState();

  return (
    <ProductCheckoutClient
      product={product}
      isLoggedIn={authState.isLoggedIn}
      userEmail={authState.userEmail}
      initialTier={parseInitialTier(query.tier)}
    />
  );
}
