'use client';

export function EnglishEbookPrintControls() {
  return (
    <div className="ebook-controls" aria-label="Controles do e-book">
      <button type="button" onClick={() => window.print()} className="ebook-control-button">
        Salvar como PDF
      </button>
      <a href="/guias/ingles" className="ebook-control-link">
        Voltar à apresentação
      </a>
    </div>
  );
}
