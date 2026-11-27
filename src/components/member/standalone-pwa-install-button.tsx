'use client';

import { Download, ExternalLink, Smartphone, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ProductSlug } from '@/config/products';
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

export type StandalonePwaInstallButtonProps = {
  productSlug: ProductSlug;
  appName: string;
  iconSrc: string;
};

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  return isStandaloneDisplayMode(window, navigator as StandaloneNavigator);
}

export function StandalonePwaInstallButton({
  productSlug,
  appName,
  iconSrc,
}: StandalonePwaInstallButtonProps) {
  const pathname = usePathname();
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<InstallPlatform>('other');
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [installedNow, setInstalledNow] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [runningStandalone, setRunningStandalone] = useState(false);

  const toolPath = `/app/${productSlug}`;
  const isOnToolRoute = pathname === toolPath;
  const scope = `standalone-${productSlug}`;

  useEffect(() => {
    let cancelled = false;
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    const legacyStorageKey = `standalone-pwa-installed-${productSlug}`;

    const markInstalled = (emitEvent = false): void => {
      if (cancelled) return;
      setPrompt(null);
      setInstalled(true);
      persistPwaInstall(window.localStorage, scope);
      try {
        window.localStorage.setItem(legacyStorageKey, 'true');
      } catch {
        // Ignore storage restrictions.
      }
      if (emitEvent) {
        window.dispatchEvent(new Event(PWA_INSTALLED_EVENT));
      }
    };

    const syncPlatformTimer = window.setTimeout(() => {
      if (cancelled) return;
      const standalone = isStandaloneDisplay();
      const legacyInstalled = window.localStorage.getItem(legacyStorageKey) === 'true';
      const persisted = legacyInstalled || hasPersistedPwaInstall(window.localStorage, scope);
      setRunningStandalone(standalone);
      setInstalled(standalone || persisted);
      setPlatform(detectInstallPlatform(navigator.userAgent, standalone));

      void resolvePwaInstalledState({
        scope,
        win: window,
        nav: navigator as StandaloneNavigator,
        storage: window.localStorage,
      }).then((resolved) => {
        if (resolved) markInstalled(false);
      });
    }, 0);

    const handleBeforeInstallPrompt = (event: Event): void => {
      if (
        isStandaloneDisplay()
        || window.localStorage.getItem(legacyStorageKey) === 'true'
        || hasPersistedPwaInstall(window.localStorage, scope)
      ) {
        markInstalled(false);
        return;
      }
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = (): void => {
      setInstalledNow(true);
      markInstalled(true);
    };

    const handleGlobalInstalled = (): void => {
      markInstalled(false);
    };

    const handleDisplayChange = (): void => {
      const standalone = isStandaloneDisplay();
      if (standalone) {
        setRunningStandalone(true);
        markInstalled(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener(PWA_INSTALLED_EVENT, handleGlobalInstalled);
    document.addEventListener('visibilitychange', handleDisplayChange);
    displayModeQuery.addEventListener('change', handleDisplayChange);

    return () => {
      cancelled = true;
      window.clearTimeout(syncPlatformTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener(PWA_INSTALLED_EVENT, handleGlobalInstalled);
      document.removeEventListener('visibilitychange', handleDisplayChange);
      displayModeQuery.removeEventListener('change', handleDisplayChange);
    };
  }, [productSlug, scope]);

  useEffect(() => {
    if (!instructionsOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setInstructionsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [instructionsOpen]);

  async function handleInstallClick(): Promise<void> {
    if (prompt) {
      const activePrompt = prompt;
      setPrompt(null);
      await activePrompt.prompt();
      const choice = await activePrompt.userChoice;
      if (shouldClearInstallPrompt(choice.outcome) && choice.outcome === 'accepted') {
        setInstalledNow(true);
        setInstalled(true);
        persistPwaInstall(window.localStorage, scope);
        try {
          window.localStorage.setItem(`standalone-pwa-installed-${productSlug}`, 'true');
        } catch {
          // Ignore storage restrictions.
        }
        window.dispatchEvent(new Event(PWA_INSTALLED_EVENT));
      }
      return;
    }

    setInstructionsOpen(true);
  }

  if (runningStandalone && isOnToolRoute) {
    return (
      <span className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
        <Smartphone size={15} aria-hidden="true" />
        App {appName} aberto no modo dedicado
      </span>
    );
  }

  if (installed) {
    if (!installedNow) return null;
    return (
      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300" role="status">
        Atalho de {appName} adicionado com sucesso.
      </p>
    );
  }

  const instructions = getInstallInstructions(platform, appName);
  const modalTitleId = `standalone-pwa-modal-${productSlug}`;

  return (
    <>
      <div className="flex flex-col items-start gap-1.5">
        <button
          type="button"
          onClick={() => void handleInstallClick()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background/80 px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-orange hover:text-orange"
        >
          <Download size={16} aria-hidden="true" />
          <span>Instalar App desta ferramenta</span>
        </button>
        {installedNow && (
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300" role="status">
            Atalho de {appName} adicionado com sucesso.
          </p>
        )}
      </div>

      {instructionsOpen && (
        <div
          className="fixed inset-0 z-[340] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalTitleId}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src={iconSrc}
                  alt={appName}
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-xl border border-border object-cover"
                />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">
                    App dedicado
                  </p>
                  <h3 id={modalTitleId} className="mt-0.5 font-playfair text-2xl font-bold">
                    Instalar {appName}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInstructionsOpen(false)}
                className="rounded-md p-2 text-foreground/60 hover:bg-accent hover:text-foreground"
                aria-label="Fechar instruções"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-foreground/75">
              Adicione <strong>{appName}</strong> à tela inicial do seu celular ou computador para
              abrir esta ferramenta com ícone próprio e acesso direto.
            </p>

            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground/85">
              {instructions.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            {!isOnToolRoute && (
              <div className="mt-4 rounded-xl border border-neon/30 bg-neon/5 p-3.5 text-xs leading-relaxed text-foreground/80">
                Para garantir que o ícone salvo abra direto em <strong>{appName}</strong>, você
                pode abrir a ferramenta primeiro e tocar em instalar por lá.
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {!isOnToolRoute && (
                <Link
                  href={toolPath}
                  onClick={() => setInstructionsOpen(false)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-neon px-4 py-2.5 text-sm font-bold text-black hover:opacity-90"
                >
                  <span>Abrir {appName}</span>
                  <ExternalLink size={15} aria-hidden="true" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => setInstructionsOpen(false)}
                className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2.5 text-sm font-bold text-foreground hover:border-neon"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
