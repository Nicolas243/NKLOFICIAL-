import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BILINGUAL_COLOR_CLASSES, tokenizeBilingualExample, type ExampleToken } from '@/lib/english-ebook';
import { LANGUAGE_EBOOKS, type LanguageEbookSlug } from '@/lib/guide-offer';
import { absoluteSiteUrl } from '@/lib/site';

export const YOUGLISH_LANGUAGE_SLUGS: Record<LanguageEbookSlug, 'italian' | 'french' | 'german' | 'spanish' | 'chinese'> = {
  italiano: 'italian',
  frances: 'french',
  alemao: 'german',
  espanhol: 'spanish',
  chines: 'chinese',
};

const DETAILS: Record<LanguageEbookSlug, { intro: string; examples: [string, string][] }> = {
  italiano: { intro: 'Aprenda italiano com um ciclo completo de 100 lições, tradução palavra a palavra e prática contextualizada.', examples: [['Io voglio studiare online.', 'Eu quero estudar on-line.'], ['Posso fare una domanda?', 'Posso fazer uma pergunta?']] },
  frances: { intro: 'Construa sua base de francês com frases naturais, revisão espaçada e exemplos sempre acompanhados de tradução.', examples: [['Je veux apprendre chaque jour.', 'Eu quero aprender todos os dias.'], ['Pouvez-vous répéter, s’il vous plaît?', 'Você pode repetir, por favor?']] },
  alemao: { intro: 'Organize o alemão em pequenas vitórias: pronúncia, ordem da frase, vocabulário e conversas profissionais.', examples: [['Ich möchte heute üben.', 'Eu quero praticar hoje.'], ['Können Sie das erklären?', 'Você pode explicar isso?']] },
  espanhol: { intro: 'Aprenda espanhol observando padrões, diferenças do português e frases que você realmente usará.', examples: [['Quiero practicar todos los días.', 'Eu quero praticar todos os dias.'], ['¿Puedes repetir, por favor?', 'Você pode repetir, por favor?']] },
  chines: { intro: 'Comece no mandarim com tons, pinyin, caracteres e diálogos que podem ser repetidos em poucos minutos.', examples: [['我想每天学习。', 'Eu quero estudar todos os dias.'], ['请再说一遍，好吗？', 'Pode falar novamente, por favor?']] },
};

function ColoredTokens({ tokens }: { tokens: ExampleToken[] }) {
  return (
    <>
      {tokens.map((token, index) => (
        token.isWord
          ? <span key={`${token.text}-${index}`} className={BILINGUAL_COLOR_CLASSES[token.colorIndex % BILINGUAL_COLOR_CLASSES.length]}>{token.text}</span>
          : <span key={`${token.text}-${index}`}>{token.text}</span>
      ))}
    </>
  );
}

export function getLanguageEbookPreviewMetadata(slug: LanguageEbookSlug): Metadata {
  const offer = LANGUAGE_EBOOKS[slug];
  const details = DETAILS[slug];
  const cleanTitle = offer.title.replace(/\s*\|\s*E-book Portal NKL$/u, '');
  return {
    title: `Prévia do E-book ${cleanTitle}`,
    description: details.intro,
    alternates: { canonical: absoluteSiteUrl(`/guias/${slug}/ebook`) },
  };
}

export function LanguageEbookPreview({ slug }: { slug: string }) {
  if (!(slug in LANGUAGE_EBOOKS)) notFound();
  const language = slug as LanguageEbookSlug;
  const details = DETAILS[language];
  const offer = LANGUAGE_EBOOKS[language];
  const youglishSlug = YOUGLISH_LANGUAGE_SLUGS[language];
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link href={`/guias/${language}`} className="text-sm font-bold text-orange hover:underline">← Voltar para a página do guia</Link>
      <article className="mt-6 rounded-2xl border border-border bg-income-surface p-6 md:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Prévia do e-book · {offer.language}</p>
          {offer.comingSoon && (
            <span className="rounded-full border border-orange/40 bg-orange/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange">
              Em breve
            </span>
          )}
        </div>
        <h1 className="mt-4 font-playfair text-4xl font-bold md:text-6xl">{offer.title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-foreground/75">{details.intro}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {details.examples.map(([source, translation], index) => {
            const colored = tokenizeBilingualExample(source, translation);
            return (
              <div key={source} className="rounded-xl border border-border bg-background p-5">
                <p className="text-xs font-bold uppercase text-foreground/50">Lição {index + 1} · exemplo colorido</p>
                <p className="mt-4 font-mono text-xl font-bold leading-relaxed"><ColoredTokens tokens={colored.english} /></p>
                <p className="mt-2 font-mono text-base font-semibold leading-relaxed"><ColoredTokens tokens={colored.portuguese} /></p>
                <a className="mt-4 inline-flex text-sm font-bold text-orange hover:underline" href={`https://pt.youglish.com/pronounce/${encodeURIComponent(source)}/${youglishSlug}`} target="_blank" rel="noreferrer">Ouvir pronúncia ↗</a>
              </div>
            );
          })}
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border p-4"><strong>100</strong><span className="ml-2 text-sm">lições</span></div>
          <div className="rounded-lg border border-border p-4"><strong>500</strong><span className="ml-2 text-sm">exemplos traduzidos</span></div>
          <div className="rounded-lg border border-border p-4"><strong>90</strong><span className="ml-2 text-sm">dias de prática</span></div>
        </div>
        <div className="mt-8 rounded-xl border border-orange/30 bg-orange/5 p-5">
          <h2 className="font-playfair text-2xl font-bold">{offer.comingSoon ? 'Edição completa em produção editorial' : 'O material completo inclui'}</h2>
          <p className="mt-2 leading-relaxed text-foreground/75">
            {offer.comingSoon
              ? `A edição paga de ${offer.language} com 100 lições autorais está em produção editorial. Enquanto isso, pratique gratuitamente na página interativa de ${offer.language} ou conheça o e-book completo de Inglês já disponível.`
              : 'Rastreador de hábitos, prompts para pedir correção ao Copilot ou Gemini, diálogos de mundo real, templates profissionais e links de áudio em cada bloco.'}
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/blog/aprender/${language}`} className="inline-flex min-h-12 items-center justify-center rounded-md bg-orange px-6 py-3 font-bold text-white hover:bg-orange-dark">
            Estudar {offer.language} gratuitamente
          </Link>
          <Link href={`/guias/${language}`} className="inline-flex min-h-12 items-center justify-center rounded-md border border-border px-6 py-3 font-bold hover:border-orange hover:text-orange">
            Ver status da edição completa
          </Link>
          <Link href="/guias/ingles" className="inline-flex min-h-12 items-center justify-center rounded-md border border-neon/40 bg-neon/5 px-6 py-3 font-bold text-neon hover:border-neon">
            Ver e-book de Inglês disponível
          </Link>
        </div>
      </article>
    </main>
  );
}
