'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type NativeAdCardProps = {
  currentPage: number;
};

type NativeAdStrategy = {
  title: string;
  description: string;
  tags: readonly [string, string];
  cta: string;
  image: string;
  imageAlt: string;
};

const strategies = [
  {
    title: 'O Mapa Completo da Renda Extra',
    description: 'Pule a fase de testes e bloqueios. Acesse o roteiro exato para focar apenas nas plataformas que pagam de verdade.',
    tags: ['Passo a Passo', 'Acesso Imediato'],
    cta: 'Acessar o Mapa',
    image: '/partner-logos/marketplaces.png',
    imageAlt: 'Mapa editorial NKL',
  },
  {
    title: 'Cansado de ser reprovado?',
    description: 'Aprenda os scripts e configurações de perfil que forçam a sua aprovação nas plataformas mais restritas.',
    tags: ['Roteiro Validado', 'Sem Enrolação'],
    cta: 'Ver o Método',
    image: '/partner-logos/dataannotation.png',
    imageAlt: 'Roteiro de aprovação NKL',
  },
  {
    title: 'O Guia à Prova de Iniciantes',
    description: 'Não sabe por onde começar? Veja como dar os primeiros passos com segurança e sem investir nenhum centavo.',
    tags: ['Para Iniciantes', '100% Seguro'],
    cta: 'Começar com Segurança',
    image: '/partner-logos/oneforma.png',
    imageAlt: 'Guia para iniciantes NKL',
  },
  {
    title: 'Liberdade Geográfica e Financeira',
    description: 'Transforme o seu computador numa fonte de rendimentos em Dólar e Euro, trabalhando de qualquer lugar.',
    tags: ['Liberdade', 'Trabalho Remoto'],
    cta: 'Conhecer o Guia',
    image: '/partner-logos/outlier.webp',
    imageAlt: 'Guia de trabalho remoto NKL',
  },
  {
    title: 'Acesso Premium: Templates NKL',
    description: 'Copie e cole os nossos templates de currículo e respostas de triagem para garantir os melhores projetos.',
    tags: ['Templates', 'Scripts Prontos'],
    cta: 'Garantir Templates',
    image: '/partner-logos/billo.png',
    imageAlt: 'Templates NKL',
  },
  {
    title: 'Vagas Limitadas nas Melhores Plataformas',
    description: 'As inscrições para tarefas de IA fecham rápido. Esteja preparado com o guia definitivo para ser selecionado.',
    tags: ['Urgência', 'Preparação'],
    cta: 'Estar Preparado',
    image: '/NKL/nkl-logo.png',
    imageAlt: 'Preparação editorial NKL',
  },
] as const satisfies readonly NativeAdStrategy[];

export function NativeAdCard({ currentPage }: NativeAdCardProps) {
  const adIndex = (currentPage - 1) % strategies.length;
  const ad = strategies[adIndex];
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const hasTrackedImpression = useRef(false);

  useEffect(() => {
    if (hasTrackedImpression.current) return;
    hasTrackedImpression.current = true;
    void fetch('/api/sales/offer-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experiment: 'native-card', variant: String(adIndex), eventType: 'impression' }),
    }).catch((error: unknown) => {
      console.error('[NATIVE_CARD] Falha ao registrar impressão:', error instanceof Error ? error.message : 'erro desconhecido');
    });
  }, [adIndex]);

  async function shareCard(): Promise<void> {
    const url = `${window.location.origin}/guias/renda-extra?ad_variant=${adIndex}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${ad.title} · Portal NKL`,
          text: ad.description,
          url,
        });
      } else {
        await navigator.clipboard.writeText(`${ad.title}\n${url}`);
        setShareMessage('Link copiado para compartilhar.');
        window.setTimeout(() => setShareMessage(null), 2600);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShareMessage('Não foi possível compartilhar agora.');
    }
  }

  return (
    <article className="group relative flex min-h-full flex-col gap-4 rounded-xl border border-border bg-income-card/95 p-4 [container-type:inline-size] shadow-sm transition hover:border-orange-500/50 hover:shadow-md md:gap-5 md:p-6">
      {shareMessage && <span className="absolute bottom-3 left-3 z-30 rounded-full bg-foreground px-3 py-1 text-xs font-bold text-background" role="status">{shareMessage}</span>}
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-neon">Conteúdo Premium</p>
            <Link href={`/guias/renda-extra?ad_variant=${adIndex}`} className="relative z-20 block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
              <h2 className="mt-1 break-words font-playfair text-2xl font-bold">{ad.title}</h2>
            </Link>
          </div>
          <span className="inline-flex max-w-full shrink-0 items-center rounded-full border border-neon/40 bg-neon/10 px-2.5 py-1 text-xs font-bold text-neon">
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
            <Link href={`/guias/renda-extra?ad_variant=${adIndex}`} className="relative z-20 inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neon/40 bg-white p-1.5" aria-label={`Abrir oferta: ${ad.title}`}>
              <Image src={ad.image} alt={ad.imageAlt} width={64} height={64} className="h-full w-full object-contain" />
            </Link>
          </div>
          <div className="flex min-w-0 w-full items-center gap-1.5 overflow-hidden">
            <Link href={`/guias/renda-extra?ad_variant=${adIndex}`} className="relative z-20 inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-border px-3 text-sm font-bold leading-none hover:border-neon">
              Ler mais
            </Link>
            <Link href={`/guias/renda-extra?ad_variant=${adIndex}`} className="relative z-20 inline-flex h-11 min-w-0 flex-1 items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-neon px-2 text-sm font-bold leading-none text-black hover:opacity-90">
              {ad.cta}
            </Link>
            <button type="button" onClick={() => void shareCard()} className="relative z-20 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border text-neon transition-colors hover:border-neon hover:bg-neon/10" aria-label={`Compartilhar ${ad.title}`} title="Compartilhar oferta">
              <Share2 size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
