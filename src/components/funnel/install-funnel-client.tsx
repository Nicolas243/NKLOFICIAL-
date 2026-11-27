'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  Languages,
  Music2,
  Share,
  Smartphone,
  Sparkles,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  APP_BRAND_NAME,
  APP_BRAND_TAGLINE,
  APP_ICONS,
  AREA_SUB_APPS,
  NKL_SELECTED_TRACK_KEY,
  type TrackId,
} from '@/config/app-brand';
import type { PaidProduct } from '@/config/products';
import type { PortalTrack } from '@/config/tracks';
import { trackPortalFunnelEvent } from '@/lib/analytics';
import {
  PWA_INSTALLED_EVENT,
  detectInstallPlatform,
  getInstallInstructions,
  hasPersistedPwaInstall,
  isStandaloneDisplayMode,
  persistPwaInstall,
  resolvePwaInstalledState,
  shouldClearInstallPrompt,
  type InstallPlatform,
  type StandaloneNavigator,
} from '@/lib/pwa/install-state';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type InstallFunnelClientProps = {
  initialTrack: PortalTrack;
  allTracks: readonly PortalTrack[];
  products: readonly PaidProduct[];
};

const TRACK_ICONS: Record<TrackId, LucideIcon> = {
  'renda-extra': WalletCards,
  musica: Music2,
  'idiomas-ia': Languages,
  'ia-completa': Sparkles,
};

const IOS_INSTALL_STEPS = [
  '1. Toque em Compartilhar no Safari',
  '2. Escolha Adicionar à Tela de Início',
  '3. Confirme em Adicionar',
] as const;

function detectIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return isStandaloneDisplayMode(window, navigator as StandaloneNavigator);
}

export function InstallFunnelClient({
  initialTrack,
  allTracks,
  products,
}: InstallFunnelClientProps) {
  const router = useRouter();
  const [selectedTrackId, setSelectedTrackId] = useState<TrackId>(initialTrack.id);
  const [nativePrompt, setNativePrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>('other');
  const [promptFeedback, setPromptFeedback] = useState<string | null>(null);
  const [isPrompting, setIsPrompting] = useState(false);

  const activeTrack =
    allTracks.find((track) => track.id === selectedTrackId) ?? initialTrack;
  const recommendedProduct =
    products.find((product) => product.slug === activeTrack.recommendedProductSlug) ??
    products[0];

  const offerRouteRef = useRef(recommendedProduct.offerRoute);
  const selectedTrackIdRef = useRef<TrackId>(activeTrack.id);
  const navigatedRef = useRef(false);
  const installAcceptedTrackedRef = useRef(false);

  useEffect(() => {
    offerRouteRef.current = recommendedProduct.offerRoute;
    selectedTrackIdRef.current = activeTrack.id;
  }, [activeTrack.id, recommendedProduct.offerRoute]);

  useEffect(() => {
    try {
      window.localStorage.setItem(NKL_SELECTED_TRACK_KEY, activeTrack.id);
      window.dispatchEvent(
        new CustomEvent('nkl:track-updated', { detail: { trackId: activeTrack.id } }),
      );
    } catch {
      // Ignore storage access errors in restricted browsing contexts.
    }
  }, [activeTrack.id]);

  useEffect(() => {
    let cancelled = false;
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');

    const updateEnvironment = (): void => {
      if (cancelled) return;
      const standalone = detectIsStandalone();
      const persisted = hasPersistedPwaInstall(window.localStorage);
      setInstalled(standalone || persisted);
      setPlatform(detectInstallPlatform(navigator.userAgent, standalone));

      void resolvePwaInstalledState({
        win: window,
        nav: navigator as StandaloneNavigator,
        storage: window.localStorage,
      }).then((resolved) => {
        if (!cancelled && resolved) {
          setInstalled(true);
          setNativePrompt(null);
        }
      });
    };

    const handleBeforeInstallPrompt = (event: Event): void => {
      if (detectIsStandalone() || hasPersistedPwaInstall(window.localStorage)) {
        setInstalled(true);
        return;
      }
      event.preventDefault();
      setNativePrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = (): void => {
      setInstalled(true);
      setNativePrompt(null);
      persistPwaInstall(window.localStorage);
      window.dispatchEvent(new Event(PWA_INSTALLED_EVENT));
      if (!installAcceptedTrackedRef.current) {
        installAcceptedTrackedRef.current = true;
        trackPortalFunnelEvent('install_prompt_accepted', {
          track_id: selectedTrackIdRef.current,
          platform: 'appinstalled_event',
        });
      }
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        router.push(offerRouteRef.current);
      }
    };

    const handleGlobalInstalled = (): void => {
      setInstalled(true);
      setNativePrompt(null);
    };

    const timer = window.setTimeout(updateEnvironment, 0);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener(PWA_INSTALLED_EVENT, handleGlobalInstalled);
    document.addEventListener('visibilitychange', updateEnvironment);
    displayModeQuery.addEventListener('change', updateEnvironment);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener(PWA_INSTALLED_EVENT, handleGlobalInstalled);
      document.removeEventListener('visibilitychange', updateEnvironment);
      displayModeQuery.removeEventListener('change', updateEnvironment);
    };
  }, [router]);

  function handleSelectTrack(trackId: TrackId): void {
    setSelectedTrackId(trackId);
    setPromptFeedback(null);
    trackPortalFunnelEvent('track_select', {
      track_id: trackId,
      source: 'install_page',
    });
    try {
      window.history.replaceState(null, '', `/instalar?trilha=${trackId}`);
    } catch {
      // Ignore history API restrictions.
    }
  }

  async function handleNativeInstall(): Promise<void> {
    if (!nativePrompt || isPrompting) return;
    setIsPrompting(true);
    setPromptFeedback(null);
    trackPortalFunnelEvent('install_cta_click', {
      track_id: activeTrack.id,
      source: 'install_page',
      target: 'native_prompt',
    });

    try {
      await nativePrompt.prompt();
      const choice = await nativePrompt.userChoice;
      if (shouldClearInstallPrompt(choice.outcome)) {
        setNativePrompt(null);
      }
      if (choice.outcome === 'accepted') {
        setInstalled(true);
        persistPwaInstall(window.localStorage);
        window.dispatchEvent(new Event(PWA_INSTALLED_EVENT));
        if (!installAcceptedTrackedRef.current) {
          installAcceptedTrackedRef.current = true;
          trackPortalFunnelEvent('install_prompt_accepted', {
            track_id: activeTrack.id,
            platform,
          });
        }
        if (!navigatedRef.current) {
          navigatedRef.current = true;
          router.push(recommendedProduct.offerRoute);
        }
        return;
      }
      setPromptFeedback(
        'Tudo bem. Você pode seguir agora pelo navegador e instalar o aplicativo depois.',
      );
    } catch {
      setPromptFeedback(
        'Não foi possível abrir o aviso do navegador agora. Continue normalmente pelo botão abaixo.',
      );
    } finally {
      setIsPrompting(false);
    }
  }

  const ActiveTrackIcon = TRACK_ICONS[activeTrack.id];
  const areaSubApp = AREA_SUB_APPS[activeTrack.id];
  const fallbackInstructions = getInstallInstructions(platform, APP_BRAND_NAME);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-foreground/75 transition-colors hover:text-[#c2410c] dark:hover:text-[#fb923c]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Voltar para o {APP_BRAND_NAME}</span>
        </Link>
      </div>

      <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 rounded-2xl border border-border bg-[#090b10] p-1.5 shadow-sm">
              <Image
                src={APP_ICONS.portal[192]}
                alt={`Ícone do aplicativo ${APP_BRAND_NAME}`}
                width={68}
                height={68}
                className="h-full w-full rounded-xl object-contain"
                priority
              />
            </div>

            <div className="min-w-0">
              <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-[#c2410c] dark:text-[#fb923c]">
                Aplicativo oficial · {APP_BRAND_NAME}
              </p>
              <h1 className="mt-1 font-playfair text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                Instale o {APP_BRAND_NAME} no seu aparelho
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/75 sm:text-base">
                {APP_BRAND_TAGLINE} Na área escolhida, você também pode instalar o sub-app{' '}
                <strong>{areaSubApp.name}</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 border-t border-border pt-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground/65">
            Ajustar sua trilha ativa
          </p>
          <div
            className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4"
            role="group"
            aria-label={`Selecionar trilha do ${APP_BRAND_NAME}`}
          >
            {allTracks.map((track) => {
              const Icon = TRACK_ICONS[track.id];
              const isSelected = track.id === activeTrack.id;
              return (
                <button
                  key={track.id}
                  type="button"
                  aria-pressed={isSelected}
                  data-track-id={track.id}
                  onClick={() => handleSelectTrack(track.id)}
                  className={[
                    'flex min-h-[52px] w-full cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm font-bold transition-colors',
                    isSelected
                      ? 'border-[#c2410c] bg-[#c2410c]/10 text-[#9a3412] dark:border-[#f97316] dark:bg-[#f97316]/15 dark:text-[#fdba74]'
                      : 'border-border bg-background text-foreground hover:border-[#c2410c]/50',
                  ].join(' ')}
                >
                  <Icon size={17} className="shrink-0" aria-hidden="true" />
                  <span className="truncate">{track.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="rounded-2xl border border-border bg-background p-5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#c2410c]/12 text-[#c2410c] dark:bg-[#f97316]/15 dark:text-[#fb923c]">
                <ActiveTrackIcon size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-foreground/60">
                  Trilha selecionada
                </p>
                <h2 className="text-xl font-bold text-foreground">
                  {activeTrack.title}
                </h2>
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-foreground/75">
              {activeTrack.summary}
            </p>

            <ol className="mt-5 space-y-3">
              {activeTrack.steps.map((step) => (
                <li
                  key={step.stepNumber}
                  className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3.5"
                >
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#c2410c] text-xs font-bold text-white dark:bg-[#f97316] dark:text-[#090b10]">
                    {step.stepNumber}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#9a3412] dark:text-[#fb923c]">
                      {step.tag}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-foreground">
                      {step.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/70 sm:text-sm">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <aside className="flex flex-col justify-between gap-5 rounded-2xl border border-border bg-background p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#c2410c] dark:text-[#fb923c]">
                Passo de instalação
              </p>
              <h2 className="mt-1.5 text-xl font-bold text-foreground">
                Deixe o {APP_BRAND_NAME} na tela inicial
              </h2>

              {installed ? (
                <div
                  className="mt-4 rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-200"
                  role="status"
                >
                  <p className="flex items-center gap-2 font-bold">
                    <CheckCircle2 size={17} aria-hidden="true" />
                    <span>Aplicativo {APP_BRAND_NAME} pronto neste aparelho.</span>
                  </p>
                  <p className="mt-1.5 leading-relaxed opacity-90">
                    Sua trilha já está salva. Siga para o próximo passo para conhecer o material completo.
                  </p>
                </div>
              ) : nativePrompt ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm leading-relaxed text-foreground/75">
                    Toque abaixo para instalar o {APP_BRAND_NAME} direto na tela inicial e avançar automaticamente.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleNativeInstall()}
                    disabled={isPrompting}
                    className="inline-flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#c2410c] px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#9a3412] disabled:cursor-wait disabled:opacity-60 dark:bg-[#f97316] dark:text-[#090b10] dark:hover:bg-[#fb923c]"
                  >
                    <Download size={18} aria-hidden="true" />
                    <span>
                      {isPrompting ? 'Abrindo instalação...' : `Instalar app ${APP_BRAND_NAME}`}
                    </span>
                  </button>
                </div>
              ) : platform === 'ios' ? (
                <div className="mt-4 rounded-xl border border-border bg-surface p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Share size={16} className="text-[#c2410c] dark:text-[#fb923c]" aria-hidden="true" />
                    <span>Como instalar no iPhone ou iPad (Safari)</span>
                  </p>
                  <ol className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/80">
                    {IOS_INSTALL_STEPS.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-border bg-surface p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Smartphone size={16} className="text-[#c2410c] dark:text-[#fb923c]" aria-hidden="true" />
                    <span>Como adicionar no seu navegador</span>
                  </p>
                  <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/80">
                    {fallbackInstructions.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ol>
                </div>
              )}

              {promptFeedback && (
                <p
                  role="status"
                  className="mt-3 rounded-xl border border-border bg-surface p-3 text-xs leading-relaxed text-foreground/80"
                >
                  {promptFeedback}
                </p>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs font-medium text-foreground/65">
                Próximo passo sugerido para sua trilha: <strong>{recommendedProduct.title}</strong>
              </p>
              <Link
                href={recommendedProduct.offerRoute}
                data-testid="instalar-continue-cta"
                onClick={() =>
                  trackPortalFunnelEvent('offer_cta_click', {
                    track_id: activeTrack.id,
                    product_slug: recommendedProduct.slug,
                    source: 'install_page',
                  })
                }
                className="mt-3 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-foreground bg-foreground px-5 py-3 text-center text-sm font-bold text-background no-underline transition-opacity hover:opacity-90"
              >
                <span>Continuar para o próximo passo</span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                href={activeTrack.freePortalHref}
                className="mt-2.5 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground/80 no-underline transition-colors hover:border-[#c2410c] hover:text-[#c2410c] dark:hover:border-[#f97316] dark:hover:text-[#fb923c]"
              >
                Prefiro explorar a área gratuita agora
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
