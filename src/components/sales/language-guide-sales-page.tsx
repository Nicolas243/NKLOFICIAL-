import type { Metadata } from 'next';
import Link from 'next/link';
import { AffiliateDisclaimer } from '@/components/affiliate-disclaimer';
import { GuideCheckoutButton } from '@/components/sales/guide-checkout-button';
import { LanguageAiAndPlanner } from '@/components/sales/language-ai-and-planner';
import { absoluteSiteUrl } from '@/lib/site';
import { getLanguageEbookByOffer } from '@/lib/guide-offer';

export type LanguageGuideSlug = 'italiano' | 'frances' | 'alemao' | 'espanhol' | 'chines';

const CONTENT: Record<LanguageGuideSlug, {
  offerVariant: string;
  title: string;
  description: string;
  topics: string[];
}> = {
  italiano: { offerVariant: 'italian-ebook-sales-page', title: 'Italiano para ganhar possibilidades', description: 'Um caminho prático para estudar italiano no celular, entender frases reais e abrir novas possibilidades culturais e profissionais.', topics: ['pronúncia e leitura sem complicação', 'frases para viagens, trabalho e rotina', 'gramática essencial em passos curtos', 'diálogos e exercícios de produção', 'plano de 90 dias com rastreador visual', 'áudio, IA e templates para continuar praticando'] },
  frances: { offerVariant: 'french-ebook-sales-page', title: 'Francês para ganhar possibilidades', description: 'Aprenda francês com situações reais, tradução em português e uma rotina que transforma pequenas sessões em progresso consistente.', topics: ['sons, acentos e leitura guiada', 'frases úteis para vida real', 'gramática que você realmente usa', 'diálogos de estudo e trabalho', 'plano de 90 dias com revisão', 'links de áudio e feedback com IA'] },
  alemao: { offerVariant: 'german-ebook-sales-page', title: 'Alemão para ganhar possibilidades', description: 'Um guia claro para construir frases em alemão, reconhecer padrões e praticar com confiança mesmo começando do zero.', topics: ['pronúncia e combinações de letras', 'ordem das palavras e casos essenciais', 'vocabulário de rotina e carreira', 'diálogos profissionais contextualizados', 'plano de 90 dias', 'templates e prompts de correção'] },
  espanhol: { offerVariant: 'spanish-ebook-sales-page', title: 'Espanhol para ganhar possibilidades', description: 'Estude espanhol com frases naturais, diferenças importantes do português e prática orientada para situações do dia a dia.', topics: ['falsos cognatos e pronúncia', 'conversas de viagem e trabalho', 'gramática essencial sem excesso', 'role-plays de situações reais', 'plano de 90 dias', 'áudios, IA e modelos prontos'] },
  chines: { offerVariant: 'mandarin-ebook-sales-page', title: 'Mandarim para ganhar possibilidades', description: 'Comece no mandarim com pinyin, tons, caracteres essenciais e diálogos curtos que você consegue repetir e revisar.', topics: ['tons, pinyin e memorização', 'frases de apresentação e rotina', 'estrutura de perguntas e respostas', 'diálogos com contexto profissional', 'plano de 90 dias', 'áudio, IA e templates de prática'] },
};

export function getLanguageGuideMetadata(slug: LanguageGuideSlug): Metadata {
  const content = CONTENT[slug];
  return {
    title: `${content.title} | E-book Portal NKL`,
    description: content.description,
    alternates: { canonical: absoluteSiteUrl(`/guias/${slug}`) },
  };
}

export function LanguageGuideSalesPage({
  slug,
  comingSoon,
}: {
  slug: LanguageGuideSlug;
  comingSoon?: boolean;
}) {
  const content = CONTENT[slug];
  const offer = getLanguageEbookByOffer(content.offerVariant);
  const isComingSoon = comingSoon ?? offer?.comingSoon ?? false;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 md:pt-14">
      <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-start">
        <section>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange">E-book NKL · leitura no celular</p>
            {isComingSoon && (
              <span className="rounded-full border border-orange/40 bg-orange/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange">
                Em breve
              </span>
            )}
          </div>
          <h1 className="mt-4 font-playfair text-5xl font-bold leading-[1.02] md:text-7xl">{content.title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-foreground/75">{content.description}</p>
          <div className="mt-7 rounded-2xl border border-border bg-income-surface p-5">
            <p className="font-bold">{isComingSoon ? 'O que está sendo preparado na edição completa:' : 'Você vai encontrar:'}</p>
            <ul className="mt-4 space-y-3 text-sm">
              {content.topics.map((topic) => <li key={topic} className="flex gap-3"><span className="text-orange">✓</span><span>{topic}</span></li>)}
            </ul>
          </div>
          <p className="mt-6 text-sm leading-relaxed text-foreground/65">
            {isComingSoon
              ? 'A edição completa paga com 100 lições autorais e 500 exemplos traduzidos por cores está atualmente em produção editorial. Enquanto finalizamos o material completo, você já pode estudar gratuitamente pelo guia interativo do Portal NKL.'
              : 'São 100 lições, 500 exemplos traduzidos por cores, links de pronúncia, diálogos e ferramentas práticas. O material ensina possibilidades, não garante renda ou contratação.'}
          </p>
        </section>
        <aside className="rounded-2xl border border-orange/30 bg-income-surface p-6 shadow-[var(--card-shadow)] md:sticky md:top-24 md:p-8">
          {isComingSoon ? (
            <>
              <div className="inline-flex items-center rounded-full border border-orange/40 bg-orange/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange">
                Em breve · Em produção editorial
              </div>
              <p className="mt-4 font-playfair text-3xl font-bold">Edição completa de 100 lições em preparação</p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/75">
                A edição paga de {offer?.language ?? slug} com 100 lições inéditas está passando por revisão editorial. O checkout de R$ 47 permanece desativado até a publicação final.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href={`/blog/aprender/${slug}`}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-orange px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-orange-dark"
                >
                  Estudar agora na página gratuita de {offer?.language ?? slug}
                </Link>
                <Link
                  href={`/guias/${slug}/ebook`}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border px-5 py-3 text-center text-sm font-bold transition hover:border-orange hover:text-orange"
                >
                  Ver prévia do formato do e-book
                </Link>
                <Link
                  href="/guias/ingles"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-neon/40 bg-neon/5 px-5 py-3 text-center text-sm font-bold text-neon transition hover:border-neon"
                >
                  Conhecer o e-book disponível: Inglês para ganhar dinheiro
                </Link>
              </div>
              <p className="mt-4 text-center text-xs leading-relaxed text-foreground/55">
                Nenhuma cobrança é realizada para títulos com status Em breve.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-orange">E-book completo</p>
              <p className="mt-3 font-playfair text-5xl font-bold">R$ 47</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">Pagamento único · PDF personalizado · acesso protegido</p>
              <GuideCheckoutButton label="Comprar e receber o e-book" offerVariant={content.offerVariant} />
              <Link href={`/guias/${slug}/ebook`} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border px-5 py-3 text-sm font-bold hover:border-orange hover:text-orange">Abrir prévia paginada</Link>
              <p className="mt-3 text-center text-xs leading-relaxed text-foreground/55">Pagamento processado pelo Stripe. O acesso é liberado após a confirmação.</p>
            </>
          )}
        </aside>
      </div>
      <LanguageAiAndPlanner language={offer?.language ?? slug} slug={slug} />
      <div className="mt-10"><AffiliateDisclaimer /></div>
      {offer === undefined && <p className="sr-only">Oferta indisponível.</p>}
    </main>
  );
}
