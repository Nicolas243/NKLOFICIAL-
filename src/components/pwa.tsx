'use client';

import { Download, ExternalLink, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { APP_BRAND_NAME } from '@/config/app-brand';
import { isIncomePortalPath, isMusicPortalPath } from '@/lib/income-portal';
import { trackAnalyticsEvent } from '@/lib/analytics';
import {
  PWA_INSTALLED_EVENT,
  detectInstallPlatform,
  getInstallAction,
  getInstallInstructions,
  hasInstallIntent,
  hasPersistedPwaInstall,
  isStandaloneDisplayMode,
  markInstallIntent,
  persistPwaInstall,
  resolvePwaInstalledState,
  shouldClearInstallPrompt,
  type InstallAppKind,
  type InstallPlatform,
  type StandaloneNavigator,
} from '@/lib/pwa/install-state';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type AppScope = 'portal' | 'income' | 'music' | 'languages' | 'ai';

const INITIAL_STATE_DELAY_MS = 0;
const INSTALL_REMINDER_DELAY_MS = 22000;
const INSTALL_REMINDER_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const CLOSE_OVERLAYS_EVENT = 'nkl:close-overlays';
const INSTALL_INTENT_EVENT = 'nkl:pwa-install-intent';

type InstallState = {
  prompt: BeforeInstallPromptEvent | null;
  consumePrompt: () => void;
  installed: boolean;
  platform: InstallPlatform;
};

function isStandalone(): boolean {
  return isStandaloneDisplayMode(window, navigator as StandaloneNavigator);
}

function isFunnelRoute(pathname: string): boolean {
  return (
    pathname === '/instalar'
    || pathname.startsWith('/instalar/')
    || pathname === '/ofertas'
    || pathname.startsWith('/ofertas/')
  );
}

function getAppScope(pathname: string, explicitKind?: InstallAppKind): AppScope {
  if (explicitKind) return explicitKind;
  if (isIncomePortalPath(pathname)) return 'income';
  if (pathname === '/ia' || pathname.startsWith('/ia/')) return 'ai';
  if (
    pathname.startsWith('/blog/aprender')
    || (pathname.startsWith('/guias/') && !pathname.startsWith('/guias/renda-extra'))
  ) {
    return 'languages';
  }
  if (isMusicPortalPath(pathname)) return 'music';
  return 'portal';
}

function toInstallIntentKind(scope: AppScope): InstallAppKind {
  return scope === 'income' ? 'income' : 'music';
}

function getAppDisplayName(scope: AppScope): string {
  if (scope === 'income') return 'Renda Extra';
  if (scope === 'music') return 'Música';
  if (scope === 'languages') return 'Idiomas';
  if (scope === 'ai') return 'IA na Prática';
  return APP_BRAND_NAME;
}

function hasScopeInstallIntent(scope: AppScope): boolean {
  if (scope === 'income' || scope === 'music') {
    return hasInstallIntent(window.localStorage, scope);
  }
  return window.localStorage.getItem(`nkl-pwa-install-intent-${scope}`) === 'true';
}

function markScopeInstallIntent(scope: AppScope): void {
  if (scope === 'income' || scope === 'music') {
    markInstallIntent(window.localStorage, scope);
    return;
  }
  window.localStorage.setItem(`nkl-pwa-install-intent-${scope}`, 'true');
}

function useInstallState(scope: AppScope): InstallState {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>('other');

  useEffect(() => {
    let cancelled = false;
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');

    const syncInstalled = (emitEvent = false): void => {
      if (cancelled) return;
      setInstalled(true);
      setPrompt(null);
      persistPwaInstall(window.localStorage, scope);
      if (emitEvent) {
        window.dispatchEvent(new Event(PWA_INSTALLED_EVENT));
      }
    };

    const handleAppInstalled = (): void => syncInstalled(true);
    const handleGlobalInstalled = (): void => syncInstalled(false);

    const handleBeforeInstallPrompt = (event: Event): void => {
      if (
        isStandalone()
        || hasPersistedPwaInstall(window.localStorage, scope)
        || hasScopeInstallIntent(scope)
      ) {
        if (isStandalone() || hasPersistedPwaInstall(window.localStorage, scope)) {
          syncInstalled(false);
        }
        return;
      }
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };

    const updateDisplayMode = (): void => {
      if (isStandalone() || hasPersistedPwaInstall(window.localStorage, scope)) {
        syncInstalled(false);
      }
    };

    const initialStateTimer = window.setTimeout(() => {
      if (cancelled) return;
      const standalone = isStandalone();
      const persisted = hasPersistedPwaInstall(window.localStorage, scope);
      setInstalled(standalone || persisted);
      setPlatform(detectInstallPlatform(navigator.userAgent, standalone));

      void resolvePwaInstalledState({
        scope,
        win: window,
        nav: navigator as StandaloneNavigator,
        storage: window.localStorage,
      }).then((isInstalled) => {
        if (isInstalled) syncInstalled(false);
      });
    }, INITIAL_STATE_DELAY_MS);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener(PWA_INSTALLED_EVENT, handleGlobalInstalled);
    document.addEventListener('visibilitychange', updateDisplayMode);
    displayModeQuery.addEventListener('change', updateDisplayMode);
    return () => {
      cancelled = true;
      window.clearTimeout(initialStateTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener(PWA_INSTALLED_EVENT, handleGlobalInstalled);
      document.removeEventListener('visibilitychange', updateDisplayMode);
      displayModeQuery.removeEventListener('change', updateDisplayMode);
    };
  }, [scope]);

  return { prompt, consumePrompt: () => setPrompt(null), installed, platform };
}

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    void navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.error('[pwa] Falha ao registrar service worker:', error);
    });
  }, []);

  return null;
}

type InstallButtonProps = {
  kind?: InstallAppKind;
};

export function PwaInstallButton({ kind }: InstallButtonProps) {
  const pathname = usePathname();
  const appScope = getAppScope(pathname, kind);
  const intentKind = toInstallIntentKind(appScope);
  const displayName = getAppDisplayName(appScope);
  const { prompt, consumePrompt, installed, platform } = useInstallState(appScope);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  useEffect(() => {
    if (!instructionsOpen) return;
    document.dispatchEvent(new Event(CLOSE_OVERLAYS_EVENT));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setInstructionsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [instructionsOpen]);

  const installAction = getInstallAction({
    installed,
    nativePromptAvailable: Boolean(prompt),
    platform,
  });

  if (installAction === 'hidden') return null;

  function trackInstallEvent(eventName: string): void {
    trackAnalyticsEvent(eventName, {
      app_kind: intentKind,
      app_scope: appScope,
      install_action: installAction,
      platform,
    });
  }

  async function install(): Promise<void> {
    markScopeInstallIntent(appScope);
    window.dispatchEvent(new CustomEvent(INSTALL_INTENT_EVENT, { detail: { kind: appScope } }));

    if (!prompt) {
      trackInstallEvent('pwa_install_instructions_open');
      setInstructionsOpen(true);
      return;
    }

    trackInstallEvent('pwa_install_prompt_open');
    const activePrompt = prompt;
    consumePrompt();
    await activePrompt.prompt();
    const choice = await activePrompt.userChoice;
    trackInstallEvent(`pwa_install_${choice.outcome}`);
    if (choice.outcome === 'accepted') {
      persistPwaInstall(window.localStorage, appScope);
      window.dispatchEvent(new Event(PWA_INSTALLED_EVENT));
      return;
    }
    if (shouldClearInstallPrompt(choice.outcome)) return;
  }

  const spaceNote =
    appScope === 'portal'
      ? `Este atalho abre o aplicativo ${APP_BRAND_NAME} direto da tela inicial.`
      : `Este atalho abre o sub-app ${displayName} direto da sua tela inicial sem misturar outras áreas.`;

  return (
    <>
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-orange px-3 py-2 text-sm font-bold text-orange transition-colors hover:bg-orange hover:text-white"
        aria-label={`Instalar o app ${displayName}`}
        title={`Instalar ${displayName}`}
      >
        <Download size={17} aria-hidden="true" />
        <span className="hidden sm:inline">Instalar</span>
      </button>
      {instructionsOpen && (
        <div className="fixed inset-0 z-[320] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={`install-${appScope}-title`}>
          <div className="w-full max-w-md rounded-2xl border border-orange/40 bg-surface p-6 text-foreground shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Instalação</p>
                <h2 id={`install-${appScope}-title`} className="mt-2 font-playfair text-2xl font-bold">Adicionar {displayName}</h2>
              </div>
              <button type="button" onClick={() => setInstructionsOpen(false)} className="rounded-md p-2 text-foreground/60 hover:bg-accent hover:text-foreground" aria-label="Fechar instruções">
                <X size={21} aria-hidden="true" />
              </button>
            </div>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-base leading-relaxed text-foreground/75">
              {getInstallInstructions(platform, displayName).map((instruction) => <li key={instruction}>{instruction}</li>)}
            </ol>
            <p className="mt-3 text-sm leading-relaxed text-foreground/65">{spaceNote}</p>
            <button type="button" onClick={() => setInstructionsOpen(false)} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-neon px-5 py-3 text-sm font-bold text-black hover:opacity-90">
              Entendi <ExternalLink size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function PwaInstallReminder() {
  const pathname = usePathname();
  const suppressForFunnel = isFunnelRoute(pathname);
  const appScope = getAppScope(pathname);
  const intentKind = toInstallIntentKind(appScope);
  const displayName = getAppDisplayName(appScope);
  const { prompt, consumePrompt, installed, platform } = useInstallState(appScope);
  const [visible, setVisible] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  useEffect(() => {
    if (!instructionsOpen) return;
    document.dispatchEvent(new Event(CLOSE_OVERLAYS_EVENT));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setInstructionsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [instructionsOpen]);

  useEffect(() => {
    if (suppressForFunnel) {
      const hideTimer = window.setTimeout(() => {
        setVisible(false);
      }, INITIAL_STATE_DELAY_MS);
      return () => window.clearTimeout(hideTimer);
    }

    const handleInstallIntent = (event: Event): void => {
      const kind = (event as CustomEvent<{ kind?: AppScope }>).detail?.kind;
      if (kind === appScope) setVisible(false);
    };
    window.addEventListener(INSTALL_INTENT_EVENT, handleInstallIntent);

    const timer = window.setTimeout(() => {
      const dismissedAt = Number(window.localStorage.getItem(`nkl-pwa-reminder-${appScope}`) ?? 0);
      if (
        !isStandalone()
        && !hasPersistedPwaInstall(window.localStorage, appScope)
        && !hasScopeInstallIntent(appScope)
        && Date.now() - dismissedAt > INSTALL_REMINDER_COOLDOWN_MS
      ) {
        setVisible(true);
      }
    }, INSTALL_REMINDER_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(INSTALL_INTENT_EVENT, handleInstallIntent);
    };
  }, [appScope, suppressForFunnel]);

  const installAction = getInstallAction({
    installed,
    nativePromptAvailable: Boolean(prompt),
    platform,
  });

  if (suppressForFunnel || !visible || installAction === 'hidden') return null;

  function trackInstallEvent(eventName: string): void {
    trackAnalyticsEvent(eventName, {
      app_kind: intentKind,
      app_scope: appScope,
      install_action: installAction,
      platform,
    });
  }

  async function install(): Promise<void> {
    markScopeInstallIntent(appScope);
    window.dispatchEvent(new CustomEvent(INSTALL_INTENT_EVENT, { detail: { kind: appScope } }));

    if (!prompt) {
      trackInstallEvent('pwa_install_instructions_open');
      setInstructionsOpen(true);
      return;
    }

    trackInstallEvent('pwa_install_prompt_open');
    const activePrompt = prompt;
    consumePrompt();
    await activePrompt.prompt();
    const choice = await activePrompt.userChoice;
    trackInstallEvent(`pwa_install_${choice.outcome}`);
    if (choice.outcome === 'accepted') {
      persistPwaInstall(window.localStorage, appScope);
      window.dispatchEvent(new Event(PWA_INSTALLED_EVENT));
      setVisible(false);
    }
    if (choice.outcome === 'dismissed') setVisible(false);
  }

  function dismiss(): void {
    setVisible(false);
    window.localStorage.setItem(`nkl-pwa-reminder-${appScope}`, String(Date.now()));
  }

  return (
    <>
      <aside className="fixed bottom-20 right-5 z-[175] max-w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-orange/40 bg-surface p-4 text-foreground shadow-[0_12px_30px_rgba(16,24,40,0.18)] sm:right-6" aria-label={`Lembrete de instalação do ${displayName}`}>
        <button type="button" onClick={dismiss} className="absolute right-2 top-2 rounded-md p-1 text-foreground/55 hover:text-foreground" aria-label="Fechar lembrete">
          <X size={17} aria-hidden="true" />
        </button>
        <p className="pr-5 text-sm font-bold">Tenha o {displayName} sempre à mão.</p>
        <p className="mt-1 pr-3 text-sm leading-relaxed text-foreground/70">Instale este espaço no celular para abrir mais rápido quando quiser.</p>
        <button type="button" onClick={() => void install()} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md bg-orange px-4 py-3 text-sm font-bold text-white hover:bg-orange-dark">
          <Download size={17} aria-hidden="true" /> Instalar agora
        </button>
      </aside>
      {instructionsOpen && (
        <div className="fixed inset-0 z-[320] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={`reminder-install-${appScope}-title`}>
          <div className="w-full max-w-md rounded-2xl border border-orange/40 bg-surface p-6 text-foreground shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h2 id={`reminder-install-${appScope}-title`} className="font-playfair text-2xl font-bold">Adicionar {displayName}</h2>
              <button type="button" onClick={() => setInstructionsOpen(false)} className="rounded-md p-2 text-foreground/60 hover:bg-accent hover:text-foreground" aria-label="Fechar instruções">
                <X size={21} aria-hidden="true" />
              </button>
            </div>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-base leading-relaxed text-foreground/75">
              {getInstallInstructions(platform, displayName).map((instruction) => <li key={instruction}>{instruction}</li>)}
            </ol>
            <button type="button" onClick={() => setInstructionsOpen(false)} className="mt-6 min-h-11 rounded-md bg-neon px-5 py-3 text-sm font-bold text-black hover:opacity-90">Entendi</button>
          </div>
        </div>
      )}
    </>
  );
}
