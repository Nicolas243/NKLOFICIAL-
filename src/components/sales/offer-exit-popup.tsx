'use client';

import { useEffect, useRef, useState } from 'react';
import { GuideSubscriptionButton } from '@/components/sales/guide-subscription-button';

const POPUP_EXPERIMENT = 'exit-popup';
const POPUP_SHOWN_KEY = 'nkl_exit_offer_shown';
const MIN_READ_TIME_MS = 12000;

const variants = [
  {
    eyebrow: 'Uma rota mais leve',
    title: 'Prefere começar sem o pagamento único?',
    description: 'Assine os Guias para Liberdade Financeira por R$ 19/mês e avance no seu ritmo, com materiais práticos para decisões melhores.',
  },
  {
    eyebrow: 'Acesso contínuo',
    title: 'Continue pesquisando com um guia ao seu lado',
    description: 'A assinatura mensal reúne os guias editoriais e atualizações para você não depender de tentativa e erro.',
  },
  {
    eyebrow: 'Para começar agora',
    title: 'Um primeiro passo que cabe no mês',
    description: 'Tenha acesso ao acervo por R$ 19/mês e escolha o material que faz sentido para sua próxima decisão.',
  },
  {
    eyebrow: 'Mais contexto, menos ruído',
    title: 'Não precisa decidir tudo hoje',
    description: 'Comece pela assinatura mensal e use os guias para comparar caminhos com mais calma e clareza.',
  },
  {
    eyebrow: 'Guias NKL',
    title: 'Transforme pesquisa em próximos passos',
    description: 'Acesso mensal aos materiais do NKL para organizar oportunidades, critérios e ações sem promessas fáceis.',
  },
] as const;

type PopupVariant = (typeof variants)[number];

async function chooseVariant(): Promise<string> {
  try {
    const response = await fetch('/api/sales/offer-events', { cache: 'no-store' });
    if (!response.ok) throw new Error('Variante indisponível.');
    const payload: { variant?: string } = await response.json();
    if (payload.variant && Number(payload.variant) >= 0 && Number(payload.variant) < variants.length) {
      return payload.variant;
    }
  } catch (error) {
    console.error('[EXIT_OFFER] Falha ao escolher variante:', error instanceof Error ? error.message : 'erro desconhecido');
  }
  return String(Math.floor(Math.random() * variants.length));
}

function trackEvent(variant: string, eventType: 'impression' | 'conversion'): void {
  void fetch('/api/sales/offer-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ experiment: POPUP_EXPERIMENT, variant, eventType }),
  }).catch((error: unknown) => {
    console.error('[EXIT_OFFER] Falha ao registrar evento:', error instanceof Error ? error.message : 'erro desconhecido');
  });
}

export function OfferExitPopup() {
  const [variantIndex, setVariantIndex] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const startedAt = useRef<number | null>(null);
  const hasInteracted = useRef(false);
  const hasOpened = useRef(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(POPUP_SHOWN_KEY)) return;
    startedAt.current = Date.now();

    const openPopup = async (): Promise<void> => {
      if (hasOpened.current || hasInteracted.current || Date.now() - (startedAt.current ?? Date.now()) < MIN_READ_TIME_MS) return;
      hasOpened.current = true;
      window.sessionStorage.setItem(POPUP_SHOWN_KEY, 'true');
      const selectedVariant = await chooseVariant();
      setVariantIndex(selectedVariant);
      setIsOpen(true);
      trackEvent(selectedVariant, 'impression');
    };

    const handlePointerDown = (): void => {
      hasInteracted.current = true;
    };
    const handleMouseLeave = (event: MouseEvent): void => {
      if (event.clientY <= 0) void openPopup();
    };
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'hidden') void openPopup();
    };

    document.addEventListener('pointerdown', handlePointerDown, { once: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!isOpen || variantIndex === null) return null;
  const variant: PopupVariant = variants[Number(variantIndex)] ?? variants[0];

  return (
    <div className="fixed inset-0 z-[260] flex items-end justify-center bg-slate-950/55 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="exit-offer-title">
      <section className="relative w-full max-w-lg rounded-2xl border border-orange-500/30 bg-income-surface p-6 shadow-2xl md:p-8">
        <button type="button" onClick={() => setIsOpen(false)} className="absolute right-4 top-4 text-2xl leading-none opacity-55 hover:opacity-100" aria-label="Fechar oferta">×</button>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500 dark:text-orange-400">{variant.eyebrow}</p>
        <h2 id="exit-offer-title" className="mt-3 pr-7 font-playfair text-3xl font-bold leading-tight">{variant.title}</h2>
        <p className="mt-4 text-sm leading-relaxed text-foreground/70">{variant.description}</p>
        <div className="mt-6 flex items-end gap-3">
          <span className="text-sm text-foreground/45">assinatura</span>
          <span className="font-playfair text-4xl font-bold text-orange-500">R$ 19/mês</span>
        </div>
        <div className="mt-6">
          <GuideSubscriptionButton
            offerVariant={`${POPUP_EXPERIMENT}:${variantIndex}`}
            label="Quero os guias por R$ 19/mês"
          />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-foreground/50">A cobrança é recorrente e os termos aparecem no checkout do Mercado Pago.</p>
      </section>
    </div>
  );
}
