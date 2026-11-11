import type { Metadata } from 'next';
import { AdInventoryPreview } from '@/components/ads/ad-inventory-preview';

export const metadata: Metadata = {
  title: 'Anuncie no Mural NKL | Portal NKL',
  description: 'Conheça a prévia responsiva do mural de parceiros e das faixas de anúncios do Portal NKL.',
};

export default function AnunciePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-16 pt-28">
      <div className="mx-auto mb-12 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-300">Novas possibilidades</p>
        <h1 className="mt-3 font-playfair text-4xl font-bold md:text-5xl">Anuncie onde a comunidade pesquisa</h1>
        <p className="mt-4 text-base leading-relaxed text-foreground/70">
          Estamos testando um mural de parceiros com blocos responsivos e três faixas
          horizontais. A proposta é dar visibilidade a negócios úteis sem interromper
          a navegação.
        </p>
      </div>
      <AdInventoryPreview />
    </main>
  );
}
