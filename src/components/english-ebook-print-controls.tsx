import Link from 'next/link';

export function EnglishEbookPrintControls() {
  return (
    <>
      <div className="ebook-controls print:hidden" aria-label="Navegação da amostra do e-book">
        <Link href="/guias/ingles" className="ebook-control-link">
          Ver detalhes da oferta
        </Link>
        <Link href="/blog/aprender/ingles" className="ebook-control-link">
          Voltar ao guia de estudo
        </Link>
      </div>

      <Link
        href="/guias/ingles#checkout"
        className="fixed bottom-4 left-1/2 z-50 inline-flex min-h-[48px] -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-full bg-[#1d5b9e] px-6 py-3 font-sans text-sm font-bold text-white no-underline shadow-xl ring-2 ring-white/85 transition hover:bg-[#16477d] sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0 print:hidden"
      >
        Liberar e-book completo
      </Link>
    </>
  );
}
