export const metadata = {
  title: 'Portal NKL | Especialistas em Violino',
  description: 'O melhor portal de violino do Brasil.',
};

export default function HomePage() {
  return (
    <div className="home-container">
      <section className="showcase-section">
        <div className="content-side">
          <h2>Bem-vindo ao Portal NKL</h2>
          <p>
            O acervo mais completo sobre lutheria, acústica e performance. 
            Descubra as nuances do seu instrumento com nossa biblioteca técnica.
          </p>
          <a href="/catalogo" className="btn-home-cta">
            Acessar Catálogo de Cordas
          </a>
        </div>
        <div className="photo-side">
          <div className="photo-box">
            <img src="/NKL/violinfoto1.jpg" alt="Violino" className="home-photo-img img-foto1" />
          </div>
        </div>
      </section>

      <section className="showcase-section reverse">
        <div className="content-side">
          <h2>Física do Som</h2>
          <p>
            Compreenda como a tensão, o núcleo e o revestimento das cordas afetam 
            a projeção e a cor do som do seu violino.
          </p>
          <a href="/fisica-do-som" className="btn-home-cta">
            Ler Artigo Completo
          </a>
        </div>
        <div className="photo-side">
          <div className="photo-box">
            <img src="/NKL/acustica.jpg" alt="Acústica" className="home-photo-img img-zoom-15" />
          </div>
        </div>
      </section>
    </div>
  );
}