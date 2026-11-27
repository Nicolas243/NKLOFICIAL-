import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { PortalSuggestionArea } from '@/lib/income-portal';
import { absoluteSiteUrl } from '@/lib/site';

const SUGGEST_GOOGLE_FORM_URL = 'https://forms.gle/ng6VM1gsSwWpJ2pw5';
const SUGGEST_GOOGLE_FORM_EMBED_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSd5lHlvB0PfFbsbItfvIBs1osWbH4ZzAlcexLlZGl4dlF2Q_A/viewform?embedded=true';

export const metadata: Metadata = {
  title: 'Sugerir site ou ferramenta',
  description: 'Indique ferramentas, guias, dicionários, canais ou plataformas confiáveis para o Portal NKL.',
  alternates: { canonical: absoluteSiteUrl('/sugerir') },
};

const AREA_COPY: Record<
  PortalSuggestionArea,
  {
    badge: string;
    heading: string;
    description: string;
    urlPlaceholder: string;
    reasonPlaceholder: string;
    backHref: string;
    backLabel: string;
  }
> = {
  idiomas: {
    badge: 'Sugestão · Idiomas com IA',
    heading: 'Indique um site ou ferramenta para aprender idiomas',
    description:
      'Conhece um conversor de pinyin com áudio, dicionário confiável, podcast graduado ou exercício gratuito para Inglês, Mandarim, Italiano, Francês, Alemão ou Espanhol? Envie abaixo para análise editorial.',
    urlPlaceholder: 'https://www.chinesja.com.br/...',
    reasonPlaceholder:
      'Explique qual idioma atende, o que o leitor consegue fazer no site (ex.: marcar tons no pinyin e ouvir áudio) e se o uso é gratuito.',
    backHref: '/blog/aprender/chines',
    backLabel: 'Voltar para os guias de idiomas',
  },
  ia: {
    badge: 'Sugestão · IA na Prática',
    heading: 'Indique uma ferramenta ou referência útil de IA',
    description:
      'Envie sites, repositórios educativos, verificadores ou aplicativos confiáveis que ajudam a estudar, organizar trabalho ou conferir informações com segurança.',
    urlPlaceholder: 'https://...',
    reasonPlaceholder:
      'Descreva o que a ferramenta faz, para quem é indicada e quais cuidados ou limites o usuário precisa saber.',
    backHref: '/ia',
    backLabel: 'Voltar para IA na Prática',
  },
  'renda-extra': {
    badge: 'Sugestão · Oportunidades e Ferramentas',
    heading: 'Indique um site ou plataforma verificável',
    description:
      'Sugira plataformas reais de trabalho remoto, microtarefas, avaliação de modelos, serviços digitais ou utilitários que merecem entrar no catálogo do Portal NKL.',
    urlPlaceholder: 'https://...',
    reasonPlaceholder:
      'Conte como funciona o cadastro, se exige investimento ou idioma, como paga e por que considera a plataforma transparente.',
    backHref: '/programas',
    backLabel: 'Voltar para o catálogo de Renda Extra',
  },
  musica: {
    badge: 'Sugestão · NKL Cordas',
    heading: 'Indique um recurso para músicos, luthiers ou professores',
    description:
      'Compartilhe referências técnicas de encordoamento, acústica, conservação de instrumentos de arco, métodos de estudo ou escolas sérias.',
    urlPlaceholder: 'https://...',
    reasonPlaceholder:
      'Explique como o recurso ajuda violinistas, violistas, violoncelistas, contrabaixistas ou profissionais de luteria.',
    backHref: '/musica/naipe_cordas',
    backLabel: 'Voltar para NKL Cordas',
  },
  geral: {
    badge: 'Sugestão · Portal NKL',
    heading: 'Indique um site, guia ou ferramenta útil',
    description:
      'Envie recomendações de recursos gratuitos ou profissionais para qualquer trilha do Portal NKL. Todas as indicações passam por verificação editorial antes da publicação.',
    urlPlaceholder: 'https://...',
    reasonPlaceholder:
      'Explique a área relacionada, o que a ferramenta faz e por que vale incluí-la no portal.',
    backHref: '/',
    backLabel: 'Voltar ao Portal NKL',
  },
};

function sanitizeArea(raw?: string): PortalSuggestionArea {
  if (raw === 'idiomas' || raw === 'ia' || raw === 'renda-extra' || raw === 'musica') {
    return raw;
  }
  return 'geral';
}

function sanitizeOriginPath(raw?: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  return trimmed.slice(0, 160);
}

type SuggestPageProps = {
  searchParams?: Promise<{ area?: string; origem?: string }>;
};

export default async function SuggestSitePage({ searchParams }: SuggestPageProps) {
  const params = searchParams ? await searchParams : {};
  const area = sanitizeArea(params.area);
  const originPath = sanitizeOriginPath(params.origem);
  const copy = AREA_COPY[area];
  const backHref = originPath ?? copy.backHref;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 md:pt-14">
      <Link href={backHref} className="text-sm font-bold text-orange hover:underline">
        ← {originPath ? 'Voltar para a página anterior' : copy.backLabel}
      </Link>

      <section className="mt-6 rounded-3xl border border-border bg-income-surface p-6 shadow-sm md:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">{copy.badge}</p>
        <h1 className="mt-3 font-playfair text-3xl font-bold md:text-5xl">{copy.heading}</h1>
        <p className="mt-4 leading-relaxed text-foreground/75">{copy.description}</p>
        {originPath && (
          <p className="mt-3 text-xs font-medium text-foreground/60">
            Página de origem registrada: <code>{originPath}</code>
          </p>
        )}

        <div className="mt-6 rounded-2xl border border-orange/35 bg-orange/5 p-5">
          <p className="text-sm leading-relaxed text-foreground/85">
            Envie sua indicação pelo formulário oficial do Portal NKL no Google Forms. Assim garantimos entrega rápida e análise editorial sem falhas.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={SUGGEST_GOOGLE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-dark"
            >
              <span>Abrir formulário de sugestão</span>
              <ExternalLink size={16} aria-hidden="true" />
            </a>
            <span className="text-xs text-foreground/60">
              Abre em nova guia ({copy.badge.replace('Sugestão · ', '')})
            </span>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-background">
          <iframe
            src={SUGGEST_GOOGLE_FORM_EMBED_URL}
            title={`Formulário oficial de sugestão — ${copy.badge.replace('Sugestão · ', '')}`}
            className="h-[680px] w-full border-0"
            loading="lazy"
          />
        </div>

        {area === 'renda-extra' && (
          <p className="mt-6 text-xs leading-relaxed text-foreground/60">
            Quer explorar todas as oportunidades já analisadas?{' '}
            <Link href="/programas" className="font-bold text-orange hover:underline">
              Abrir catálogo de Renda Extra
            </Link>
            .
          </p>
        )}
      </section>
    </main>
  );
}
