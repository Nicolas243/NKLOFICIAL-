import Link from 'next/link';

type NativeAdCardProps = {
  currentPage: number;
};

const CTA_STRATEGIES = [
  'Descubra o método exato para filtrar lixo da internet e focar no que paga.',
  'Cansado de tentar de tudo e não sacar nada? Veja o roteiro validado.',
  'O Guia Definitivo NKL: Templates e scripts para aprovação imediata.',
  'Poupe 50 horas de pesquisa. O mapa da renda extra pronto para aplicar hoje.',
] as const;

export function NativeAdCard({ currentPage }: NativeAdCardProps) {
  const strategy = CTA_STRATEGIES[currentPage % CTA_STRATEGIES.length];

  return (
    <Link
      href="/guias/renda-extra"
      className="group flex min-h-full flex-col justify-between rounded-xl border border-orange/35 bg-[linear-gradient(145deg,rgba(249,115,22,0.12),rgba(11,94,215,0.08))] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
      aria-label="Conhecer o Guia Definitivo de Renda Extra NKL"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">Recomendação NKL</p>
        <h2 className="mt-2 font-playfair text-2xl font-bold">Renda extra com menos tentativa e erro</h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground/75">{strategy}</p>
      </div>
      <span className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-orange px-4 py-3 text-sm font-bold text-white transition group-hover:bg-orange-dark">
        Conhecer o guia
      </span>
    </Link>
  );
}
