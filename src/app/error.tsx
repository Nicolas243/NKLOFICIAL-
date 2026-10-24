'use client';

type RouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RouteError({ error, reset }: RouteErrorProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="flex w-full max-w-md flex-col items-center gap-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface text-3xl font-bold text-neon">
          !
        </div>
        <h1 className="font-playfair text-3xl font-bold">Instabilidade temporária</h1>
        <p className="text-sm leading-relaxed opacity-80">Os servidores estão passando por uma instabilidade momentânea. Tente carregar a página novamente.</p>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-neon px-6 py-3 font-bold text-black transition-opacity hover:opacity-90"
        >
          Tentar novamente
        </button>
        {error.digest && <p className="text-xs opacity-50">Referência: {error.digest}</p>}
      </div>
    </main>
  );
}