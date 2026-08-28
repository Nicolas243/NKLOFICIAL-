import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-5">
        <div className="font-playfair text-7xl font-bold text-neon">404</div>
        <h1 className="font-playfair text-2xl font-bold">Página não encontrada</h1>
        <p className="text-sm opacity-80 leading-relaxed">
          O conteúdo que você procura não existe ou foi movido. Volte ao catálogo
          e continue explorando a coleção.
        </p>
        <Link
          href="/catalogo"
          className="px-6 py-3 bg-text text-bg rounded-md font-bold transition-all hover:opacity-90"
        >
          Voltar para o Catálogo
        </Link>
      </div>
    </div>
  );
}