import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { AdaptiveCtaLink } from '@/components/sales/adaptive-cta-link';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Idiomas com IA — 6 Trilhas Práticas',
  description:
    'Escolha seu idioma (Inglês, Italiano, Francês, Alemão, Espanhol ou Mandarim), pratique gratuitamente com áudio e IA ou leve o pacote completo com desconto progressivo.',
  alternates: { canonical: absoluteSiteUrl('/idiomas') },
};

type LanguageHubCard = {
  slug: 'ingles' | 'italiano' | 'frances' | 'alemao' | 'espanhol' | 'chines';
  name: string;
  nativeName: string;
  badge: string;
  summary: string;
  highlight: string;
  image: string;
  alt: string;
};

const LANGUAGE_CARDS: readonly LanguageHubCard[] = [
  {
    slug: 'ingles',
    name: 'Inglês',
    nativeName: 'English',
    badge: 'Modelo principal · 100 lições',
    summary:
      'Frases reais do cotidiano e trabalho remoto com tradução alinhada palavra por palavra em cores e plano de 90 dias.',
    highlight: 'Abre portas em plataformas globais, entrevistas e projetos remotos.',
    image: '/images/areas/ingles-ebook.jpg',
    alt: 'Capa do guia de Inglês para ganhar possibilidades',
  },
  {
    slug: 'espanhol',
    name: 'Espanhol',
    nativeName: 'Español',
    badge: 'Prática rápida · 100 lições',
    summary:
      'Domine falsos amigos, pronúncia clara e diálogos para viagens, negócios na América Latina e atendimento.',
    highlight: 'Aproveite a proximidade com o português sem cair nos erros clássicos.',
    image: '/images/areas/idioma-espanhol.jpg',
    alt: 'Capa do guia de Espanhol com IA',
  },
  {
    slug: 'italiano',
    name: 'Italiano',
    nativeName: 'Italiano',
    badge: 'Cultura e trabalho · 100 lições',
    summary:
      'Estruturas essenciais, ritmo de conversação e vocabulário para viagens, estudos e rotina na Itália.',
    highlight: 'Trilha leve com prompts de voz e revisões semanais.',
    image: '/images/areas/idioma-italiano.jpg',
    alt: 'Capa do guia de Italiano com IA',
  },
  {
    slug: 'frances',
    name: 'Francês',
    nativeName: 'Français',
    badge: 'Audição e fala · 100 lições',
    summary:
      'Vogais nasais, frases naturais de viagem e trabalho com transcrição e treinamento guiado por IA.',
    highlight: 'Perca o bloqueio da pronúncia com exercícios de 15 minutos por dia.',
    image: '/images/areas/idioma-frances.jpg',
    alt: 'Capa do guia de Francês com IA',
  },
  {
    slug: 'alemao',
    name: 'Alemão',
    nativeName: 'Deutsch',
    badge: 'Carreira e estudo · 100 lições',
    summary:
      'Ordem das frases, substantivos com artigo e conversas profissionais sem travar na gramática pesada.',
    highlight: 'Método em pequenas vitórias diárias para estudo e carreira na Europa.',
    image: '/images/areas/idioma-alemao.jpg',
    alt: 'Capa do guia de Alemão com IA',
  },
  {
    slug: 'chines',
    name: 'Mandarim',
    nativeName: '中文',
    badge: 'Tons + Chinês Já · 100 lições',
    summary:
      'Comece pelos 4 tons, pinyin com áudio (incluindo conversor do Chinês Já) e caracteres em contexto real.',
    highlight: 'Ideal para comércio internacional, importação e destaque profissional.',
    image: '/images/areas/idioma-chines.jpg',
    alt: 'Capa do guia de Mandarim com IA',
  },
];

export default function LanguagesHubPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 md:pt-12">
      <header className="rounded-[2rem] border border-orange/30 bg-income-surface/90 px-6 py-9 shadow-sm md:px-12 md:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange">
          Idiomas com IA · Portal NKL
        </p>
        <h1 className="mt-3 max-w-4xl font-playfair text-4xl font-bold leading-tight md:text-6xl">
          Escolha o idioma e comece ainda hoje — no guia gratuito ou no pacote completo.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-foreground/75 md:text-lg">
          Cada idioma reúne trilha gratuita com 90 dias de estudo, exemplos traduzidos em cores por contexto,
          guia de inteligência artificial adaptado por idade (crianças, jovens, adultos e 55+) e desconto progressivo automático:
          <strong className="text-foreground"> 30% OFF no 2º idioma</strong> e{' '}
          <strong className="text-foreground">50% OFF a partir do 3º</strong>.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <AdaptiveCtaLink
            experiment="languages-hub-cta"
            href="/guias/ingles#checkout"
            variants={[
              { id: '0', label: 'Começar pelo Inglês + Passaporte 6 Idiomas' },
              { id: '1', label: 'Desbloquear Inglês com tradução por cores' },
              { id: '2', label: 'Ver opções de E-books (a partir de R$ 27)' },
            ]}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-dark"
          />
          <Link
            href="/sugerir?area=idiomas&origem=%2Fidiomas"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-bold transition hover:border-orange hover:text-orange"
          >
            Sugerir site ou ferramenta de idiomas
          </Link>
        </div>
      </header>

      <section aria-label="Grade de idiomas disponíveis" className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {LANGUAGE_CARDS.map((card) => (
          <Link
            key={card.slug}
            href={`/blog/aprender/${card.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface/90 shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-orange/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
          >
            <div className="relative aspect-video w-full overflow-hidden border-b border-border bg-background">
              <Image
                src={card.image}
                alt={card.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition duration-300 group-hover:scale-[1.02]"
              />
            </div>

            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-orange">
                  {card.nativeName}
                </span>
                <span className="rounded-full border border-orange/30 bg-orange/10 px-2.5 py-0.5 text-[11px] font-bold text-orange">
                  {card.badge}
                </span>
              </div>

              <h2 className="mt-2 font-playfair text-3xl font-bold text-foreground">{card.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/75">{card.summary}</p>
              <p className="mt-3 rounded-xl border border-border bg-background/60 px-3 py-2 text-xs font-medium text-foreground/75">
                {card.highlight}
              </p>

              <div className="mt-auto pt-5">
                <span className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-orange px-4 py-2 text-center text-sm font-bold text-white transition group-hover:bg-orange-dark">
                  Acessar guia gratuito de {card.name}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
