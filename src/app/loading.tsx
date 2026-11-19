export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl items-center justify-center px-4 py-16" aria-busy="true">
      <div className="flex items-center gap-3 rounded-full border border-border bg-surface/80 px-5 py-3 text-sm opacity-80">
        <span className="h-3 w-3 animate-pulse rounded-full bg-neon" aria-hidden="true" />
        Carregando...
      </div>
    </div>
  );
}
