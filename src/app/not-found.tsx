import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-5">
        <div className="font-playfair text-7xl font-bold text-neon">404</div>
        <h1 className="font-playfair text-2xl font-bold">Página não encontrada</h1>
        <p className="text-sm opacity-80 leading-relaxed">
          O conteúdo que você procura não existe ou foi movido. Volte ao início
          ou explore as oportunidades e catálogos do Portal NKL.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-3 bg-foreground text-background rounded-md font-bold transition-all hover:opacity-90"
          >
            Voltar ao Início
          </Link>
          <Link
            href="/programas"
            className="px-6 py-3 border border-neon text-neon rounded-md font-bold transition-all hover:bg-neon hover:text-black"
          >
            Explorar Renda Extra
          </Link>
        </div>
      </div>
    </div>
  );
}
