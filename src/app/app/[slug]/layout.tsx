import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getProductBySlug } from '@/config/products';

type AppLayoutParams = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: AppLayoutParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: 'Área do Membro' };
  }

  if (product.hasStandalonePwa) {
    const brandTitle = product.pwaBrandName ?? product.title;
    const icon192 = product.pwaIcon192 ?? '/icons/portal-nkl-192.png';
    const icon512 = product.pwaIcon512 ?? icon192;

    return {
      title: { absolute: brandTitle },
      description: product.pwaDescription ?? product.aspirationalLead,
      manifest: `/app/${product.slug}/manifest.webmanifest`,
      icons: {
        icon: [
          { url: icon192, sizes: '192x192', type: 'image/png' },
          { url: icon512, sizes: '512x512', type: 'image/png' },
        ],
        apple: [{ url: icon192, sizes: '192x192', type: 'image/png' }],
      },
    };
  }

  return {
    title: product.title,
    description: product.aspirationalLead,
  };
}

export default function AppToolLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark min-h-[calc(100vh-5rem)] w-full bg-slate-950 text-slate-100 [--background:#020617] [--border:#1e293b] [--foreground:#f8fafc] [--neon:#38bdf8] [--neon-dark:#7dd3fc] [--orange:#f97316] [--surface:#0f172a] [--text:#f8fafc]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-12">
        {children}
      </div>
    </div>
  );
}
