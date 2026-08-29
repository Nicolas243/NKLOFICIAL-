import type { Metadata } from 'next';
import { recommendedProducts, sections, type RecommendedProduct } from '@/data/recomendados';
import { RecommendedClient } from './recommended-client';

export const metadata: Metadata = {
  title: 'Equipamentos Recomendados | Portal NKL',
  description: 'Selecao criteriosa de acessorios e arcos testados na bancada e aprovados por alunos.',
};

type Props = {
  searchParams: Promise<{ categoria?: string }>;
};

export default async function RecomendadosPage(props: Props) {
  const search = await props.searchParams;
  const categoria = search.categoria ?? 'todos';

  const filtered =
    categoria === 'todos'
      ? recommendedProducts
      : recommendedProducts.filter((p) => p.instrumento === categoria);

  const grouped = groupBy(filtered);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="text-center mb-10">
        <h1 className="font-playfair text-3xl md:text-4xl font-bold mb-2">
          Equipamentos Recomendados
        </h1>
        <p className="text-base opacity-80 max-w-2xl mx-auto mb-8">
          Selecao criteriosa de acessorios e arcos testados na bancada e aprovados por
          alunos. Links limpos e diretos para as melhores ofertas do mercado.
        </p>
        <RecommendedClient categoria={categoria} />
        <nav className="flex gap-4 justify-center flex-wrap mt-4">
          {sections.map((sec) => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              className="px-4 py-2 text-sm font-bold border border-border rounded-md transition-all hover:border-neon hover:text-neon"
            >
              {sec.titulo}
            </a>
          ))}
        </nav>
      </header>

      {sections.map((sec) => {
        const produtosSecao = grouped.get(sec.id);
        if (!produtosSecao || produtosSecao.length === 0) return null;
        return (
          <SectionBlock key={sec.id} spec={sec} products={produtosSecao} />
        );
      })}

      {filtered.length === 0 && (
        <p className="text-center opacity-60 py-16 border border-dashed border-border rounded-lg">
          Nenhum equipamento encontrado para esta categoria.
        </p>
      )}
    </div>
  );
}

function groupBy(products: RecommendedProduct[]): Map<string, RecommendedProduct[]> {
  const map = new Map<string, RecommendedProduct[]>();
  for (const p of products) {
    const list = map.get(p.secao) ?? [];
    list.push(p);
    map.set(p.secao, list);
  }
  return map;
}
const badgeColors: Record<string, string> = {
  EXCELENTE: 'bg-neon text-black',
  'MUITO BOM': 'bg-gray-500 text-white',
  BOM: 'bg-gray-600 text-white',
};

const btnStyles: Record<string, string> = {
  'btn-shopee': 'bg-orange-500 text-white hover:bg-orange-400',
  'btn-ml': 'bg-yellow-500 text-black hover:bg-yellow-400',
  'btn-amz': 'bg-amber-600 text-white hover:bg-amber-500',
};

function SectionBlock({
  spec,
  products,
}: {
  spec: { id: string; titulo: string; subtitulo?: string; desc: string };
  products: RecommendedProduct[];
}) {
  const subgroups = new Map<string, RecommendedProduct[]>();
  for (const p of products) {
    const key = `${p.grupo}|${p.badge}`;
    const list = subgroups.get(key) ?? [];
    list.push(p);
    subgroups.set(key, list);
  }

  return (
    <section id={spec.id} className="mb-12 scroll-mt-28">
      <h2 className="font-playfair text-2xl md:text-3xl font-bold mb-1 text-neon">
        {spec.titulo}
        {spec.subtitulo && (
          <span className="text-base font-normal opacity-50 ml-2">{spec.subtitulo}</span>
        )}
      </h2>
      <p className="opacity-70 mb-6">{spec.desc}</p>

      {Array.from(subgroups.entries()).map(([key, items]) => {
        const [nomeGrupo, badge] = key.split('|');
        const badgeStyle = badgeColors[badge] ?? '';

        return (
          <div key={key}>
            <div className="flex items-center gap-2 border-b border-border pb-2 mb-5">
              <span className="text-sm font-bold uppercase tracking-wider opacity-60">
                {nomeGrupo}
              </span>
              {badge ? (
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${badgeStyle}`}>
                  {badge}
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
              {items.map((p, idx) => (
                <div
                  key={`${p.titulo}-${idx}`}
                  className="p-5 bg-surface border border-border rounded-lg overflow-hidden flex flex-col gap-3 hover:border-neon transition-colors"
                >
                  <div className="text-xs font-bold uppercase tracking-wider opacity-50 break-words">
                    {p.thumb}
                  </div>
                  <h3 className="font-playfair font-bold text-base leading-snug">
                    {p.titulo}
                  </h3>
                  {p.comentario ? (
                    <p className="text-sm opacity-70 min-h-[1.5rem]">{p.comentario}</p>
                  ) : (
                    <div className="h-6" />
                  )}
                  <div className="text-neon font-bold text-lg mt-1">{p.preco}</div>
                  <div className="flex flex-wrap gap-2 mt-auto pt-2">
                    {p.botoes.map((b, bi) => {
                      const cls = btnStyles[b.classe] ?? 'bg-text text-bg hover:opacity-80';
                      return (
                        <a
                          key={bi}
                          href={b.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-3 py-1.5 text-xs font-bold rounded transition ${cls}`}
                        >
                          {b.texto}
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}