'use client';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: '#0a0a0a', color: '#f5f5f5', fontFamily: 'Arial, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', textAlign: 'center' }}>
          <section style={{ maxWidth: '420px' }}>
            <p style={{ color: '#b8ff00', fontSize: '12px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Portal NKL</p>
            <h1 style={{ fontSize: '32px', margin: '16px 0' }}>Instabilidade temporária</h1>
            <p style={{ color: '#c7c7c7', lineHeight: 1.6 }}>A aplicação encontrou uma falha inesperada. Tente novamente para restabelecer o acesso.</p>
            <button type="button" onClick={reset} style={{ background: '#b8ff00', border: 0, borderRadius: '6px', color: '#080808', cursor: 'pointer', fontWeight: 700, marginTop: '16px', padding: '12px 20px' }}>
              Tentar novamente
            </button>
            {error.digest && <p style={{ color: '#888', fontSize: '12px', marginTop: '20px' }}>Referência: {error.digest}</p>}
          </section>
        </main>
      </body>
    </html>
  );
}
