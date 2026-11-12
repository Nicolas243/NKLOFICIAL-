export default function PartnerProgramDetailsLoading() {
  return (
    <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-4 md:pb-24 md:pt-10" aria-busy="true" aria-label="Carregando oportunidade">
      <div className="h-11 w-56 animate-pulse rounded-full bg-income-card/80" />
      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-border bg-income-surface/90 md:rounded-[2rem]">
        <div className="space-y-5 border-b border-border p-6 md:p-10">
          <div className="h-3 w-32 animate-pulse rounded bg-neon/20" />
          <div className="h-14 max-w-3xl animate-pulse rounded bg-income-card/80 md:h-20" />
          <div className="h-5 max-w-2xl animate-pulse rounded bg-income-card/80" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-income-card/80" />)}
          </div>
        </div>
        <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[1fr_0.8fr]">
          <div className="space-y-4">
            <div className="h-9 w-56 animate-pulse rounded bg-income-card/80" />
            <div className="h-32 animate-pulse rounded bg-income-card/80" />
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-income-card/80" />
        </div>
      </div>
    </div>
  );
}
