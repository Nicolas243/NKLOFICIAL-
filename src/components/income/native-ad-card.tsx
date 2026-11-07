import Link from 'next/link';

type NativeAdCardProps = {
  currentPage: number;
};

type NativeAdStrategy = {
  title: string;
  description: string;
  tags: readonly [string, string];
  cta: string;
};

const strategies = [
  {
    title: 'O Mapa Completo da Renda Extra',
    description: 'Pule a fase de testes e bloqueios. Acesse o roteiro exato para focar apenas nas plataformas que pagam de verdade.',
    tags: ['Passo a Passo', 'Acesso Imediato'],
    cta: 'Acessar o Mapa',
  },
  {
    title: 'Cansado de ser reprovado?',
    description: 'Aprenda os scripts e configurações de perfil que forçam a sua aprovação nas plataformas mais restritas.',
    tags: ['Roteiro Validado', 'Sem Enrolação'],
    cta: 'Ver o Método',
  },
  {
    title: 'O Guia à Prova de Iniciantes',
    description: 'Não sabe por onde começar? Veja como dar os primeiros passos com segurança e sem investir nenhum centavo.',
    tags: ['Para Iniciantes', '100% Seguro'],
    cta: 'Começar com Segurança',
  },
  {
    title: 'Liberdade Geográfica e Financeira',
    description: 'Transforme o seu computador numa fonte de rendimentos em Dólar e Euro, trabalhando de qualquer lugar.',
    tags: ['Liberdade', 'Trabalho Remoto'],
    cta: 'Conhecer o Guia',
  },
  {
    title: 'Acesso Premium: Templates NKL',
    description: 'Copie e cole os nossos templates de currículo e respostas de triagem para garantir os melhores projetos.',
    tags: ['Templates', 'Scripts Prontos'],
    cta: 'Garantir Templates',
  },
  {
    title: 'Vagas Limitadas nas Melhores Plataformas',
    description: 'As inscrições para tarefas de IA fecham rápido. Esteja preparado com o guia definitivo para ser selecionado.',
    tags: ['Urgência', 'Preparação'],
    cta: 'Estar Preparado',
  },
] as const satisfies readonly NativeAdStrategy[];

export function NativeAdCard({ currentPage }: NativeAdCardProps) {
  const ad = strategies[currentPage % strategies.length];

  return (
    <article className="group relative flex min-h-full cursor-pointer flex-col gap-4 rounded-xl border border-border bg-surface p-4 [container-type:inline-size] shadow-sm transition hover:border-orange-500/50 hover:shadow-md md:gap-5 md:p-6">
      <Link href="/guias/renda-extra" className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500" aria-label={`${ad.cta}: ${ad.title}`}>
        <span className="sr-only">{ad.cta}: {ad.title}</span>
      </Link>
      <div className="pointer-events-none flex min-w-0 flex-col gap-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-orange-500 dark:text-orange-400">Conteúdo Premium</p>
            <h2 className="mt-1 break-words font-playfair text-2xl font-bold">{ad.title}</h2>
          </div>
          <span className="inline-flex max-w-full shrink-0 items-center rounded-full border border-orange-500/40 bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-500 dark:text-orange-400">
            Recomendação Editorial NKL
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium">Guia NKL</span>
          <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium">Renda Extra</span>
        </div>
        <p className="line-clamp-2 text-sm leading-relaxed opacity-75">{ad.description}</p>
        <div className="mt-auto flex min-w-0 flex-col gap-2">
          <div className="flex min-h-16 items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap content-start gap-1.5">
              {ad.tags.map((tag) => (
                <span key={tag} className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-border px-2.5 py-1 text-xs opacity-75">
                  {tag}
                </span>
              ))}
            </div>
            <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-orange-500/40 bg-orange-500/10 p-1.5 text-xs font-black uppercase tracking-wider text-orange-500 dark:text-orange-400">
              PDF
            </span>
          </div>
          <span className="inline-flex h-11 w-full items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-neon px-2 text-sm font-bold leading-none text-black transition-opacity group-hover:opacity-90">
            {ad.cta}
          </span>
        </div>
      </div>
    </article>
  );
}
