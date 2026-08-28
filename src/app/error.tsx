'use client';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-border/50 flex items-center justify-center text-neon text-3xl font-bold">
          !
        </div>
        <h1 className="font-playfair text-3xl font-bold">Ops, algo deu errado</h1>
        <p className="text-sm opacity-80 leading-relaxed">
          Não foi possível carregar esta página no momento. Isso pode ser uma
          falha temporária de conexão. Tente novamente em instantes.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-text text-bg rounded-md font-bold transition-all hover:opacity-90"
        >
          Tentar novamente
        </button>
        {error.digest ? (
          <p className="text-xs opacity-50">Referência: {error.digest}</p>
        ) : null}
      </div>
    </div>
  );
}