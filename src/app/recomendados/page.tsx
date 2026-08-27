export const metadata = {
  title: 'Equipamentos Recomendados | Portal NKL',
};

export default function RecomendadosPage() {
  return (
    <main className="main-content">
      <h1 className="category-title text-center !mt-0">Lista de Equipamentos</h1>
      
      <div className="category-filters">
        <button className="filter-btn active">Todos</button>
        <button className="filter-btn outline">Violino</button>
        <button className="filter-btn outline">Acessórios</button>
      </div>

      <div className="product-grid">
        <article className="product-card">
          <div className="product-thumb">Imagem do Produto</div>
          <h3 className="product-title">Breu Pirastro Gold</h3>
          <p className="product-comment">Excelente aderência para cordas de núcleo sintético.</p>
          <div className="product-price">R$ 180,00</div>
          <div className="button-group">
            <a href="#" className="product-btn btn-ml">Mercado Livre</a>
          </div>
        </article>
      </div>
    </main>
  );
}