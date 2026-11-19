import Link from 'next/link';

export function EnglishEbookPrintControls() {
  return (
    <div className="ebook-controls" aria-label="Acesso ao e-book completo">
      <Link href="/guias/ingles#checkout" className="ebook-control-button">
        Liberar e-book completo (R$ 47)
      </Link>
      <Link href="/guias/ingles" className="ebook-control-link">
        Ver detalhes da oferta
      </Link>
      <Link href="/blog/aprender/ingles" className="ebook-control-link">
        Voltar ao guia de estudo
      </Link>
    </div>
  );
}
