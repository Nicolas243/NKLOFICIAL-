'use client';

import { Download, ExternalLink, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isIncomePortalPath } from '@/lib/income-portal';
import { trackAnalyticsEvent } from '@/lib/analytics';
import {
  detectInstallPlatform,
  getInstallAction,
  getInstallInstructions,
  type InstallPlatform,
} from '@/lib/pwa/install-state';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type AppKind = 'music' | 'income';
const INITIAL_STATE_DELAY_MS = 0;
const INSTALL_REMINDER_DELAY_MS = 22000;
const INSTALL_REMINDER_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

type InstallState = {
  prompt: BeforeInstallPromptEvent | null;
  installed: boolean;
  platform: InstallPlatform;
};

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
}

function getAppKind(pathname: string): AppKind {
  return isIncomePortalPath(pathname)
    ? 'income'
    : 'music';
}

function appName(kind: AppKind): string {
  return kind === 'income' ? 'Renda Extra' : 'NKL Música';
}

function useInstallState(kind: AppKind): InstallState {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>('other');

  useEffect(() => {
    const installedStorageKey = `nkl-pwa-installed-${kind}`;
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    const markInstalled = (): void => {
      setInstalled(true);
      setPrompt(null);
      window.localStorage.setItem(installedStorageKey, 'true');
    };
    const handleBeforeInstallPrompt = (event: Event): void => {
      if (window.localStorage.getItem(installedStorageKey) === 'true') return;
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };
    const updateDisplayMode = (): void => {
      if (isStandalone()) markInstalled();
    };

    const initialStateTimer = window.setTimeout(() => {
      setInstalled(isStandalone() || window.localStorage.getItem(installedStorageKey) === 'true');
      setPlatform(detectInstallPlatform(navigator.userAgent, isStandalone()));
    }, INITIAL_STATE_DELAY_MS);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', markInstalled);
    document.addEventListener('visibilitychange', updateDisplayMode);
    displayModeQuery.addEventListener('change', updateDisplayMode);
    return () => {
      window.clearTimeout(initialStateTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', markInstalled);
      document.removeEventListener('visibilitychange', updateDisplayMode);
      displayModeQuery.removeEventListener('change', updateDisplayMode);
    };
  }, [kind]);

  return { prompt, installed, platform };
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
  kind?: AppKind;
};

export function PwaInstallButton({ kind }: InstallButtonProps) {
  const pathname = usePathname();
  const appKind = kind ?? getAppKind(pathname);
  const { prompt, installed, platform } = useInstallState(appKind);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  useEffect(() => {
    if (!instructionsOpen) return;
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
      app_kind: appKind,
      install_action: installAction,
      platform,
    });
  }

  async function install(): Promise<void> {
    if (!prompt) {
      trackInstallEvent('pwa_install_instructions_open');
      setInstructionsOpen(true);
      return;
    }

    trackInstallEvent('pwa_install_prompt_open');
    await prompt.prompt();
    const choice = await prompt.userChoice;
    trackInstallEvent(`pwa_install_${choice.outcome}`);
    if (choice.outcome === 'dismissed') return;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-orange px-3 py-2 text-sm font-bold text-orange transition-colors hover:bg-orange hover:text-white"
        aria-label={`Instalar o app ${appName(appKind)}`}
        title={`Instalar ${appName(appKind)}`}
      >
        <Download size={17} aria-hidden="true" />
        <span className="hidden sm:inline">Instalar</span>
      </button>
      {instructionsOpen && (
        <div className="fixed inset-0 z-[320] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={`install-${appKind}-title`}>
          <div className="w-full max-w-md rounded-2xl border border-orange/40 bg-surface p-6 text-foreground shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Instalação</p>
                <h2 id={`install-${appKind}-title`} className="mt-2 font-playfair text-2xl font-bold">Adicionar {appName(appKind)}</h2>
              </div>
              <button type="button" onClick={() => setInstructionsOpen(false)} className="rounded-md p-2 text-foreground/60 hover:bg-accent hover:text-foreground" aria-label="Fechar instruções">
                <X size={21} aria-hidden="true" />
              </button>
            </div>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-base leading-relaxed text-foreground/75">
              {getInstallInstructions(platform, appName(appKind)).map((instruction) => <li key={instruction}>{instruction}</li>)}
            </ol>
            <p className="mt-3 text-sm leading-relaxed text-foreground/65">Este atalho abre o app de {appKind === 'income' ? 'Renda Extra' : 'música'} sem misturar os dois espaços.</p>
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
  const appKind = getAppKind(pathname);
  const { prompt, installed, platform } = useInstallState(appKind);
  const [visible, setVisible] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  useEffect(() => {
    if (!instructionsOpen) return;
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
    const timer = window.setTimeout(() => {
      const dismissedAt = Number(window.localStorage.getItem(`nkl-pwa-reminder-${appKind}`) ?? 0);
      if (!isStandalone() && Date.now() - dismissedAt > INSTALL_REMINDER_COOLDOWN_MS) setVisible(true);
    }, INSTALL_REMINDER_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [appKind]);

  const installAction = getInstallAction({
    installed,
    nativePromptAvailable: Boolean(prompt),
    platform,
  });

  if (!visible || installAction === 'hidden') return null;

  function trackInstallEvent(eventName: string): void {
    trackAnalyticsEvent(eventName, {
      app_kind: appKind,
      install_action: installAction,
      platform,
    });
  }

  async function install(): Promise<void> {
    if (!prompt) {
      trackInstallEvent('pwa_install_instructions_open');
      setInstructionsOpen(true);
      return;
    }

    trackInstallEvent('pwa_install_prompt_open');
    await prompt.prompt();
    const choice = await prompt.userChoice;
    trackInstallEvent(`pwa_install_${choice.outcome}`);
    if (choice.outcome === 'accepted') setVisible(false);
    if (choice.outcome === 'dismissed') setVisible(false);
  }

  function dismiss(): void {
    setVisible(false);
    window.localStorage.setItem(`nkl-pwa-reminder-${appKind}`, String(Date.now()));
  }

  return (
    <>
      <aside className="fixed bottom-20 right-5 z-[175] max-w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-orange/40 bg-surface p-4 text-foreground shadow-[0_12px_30px_rgba(16,24,40,0.18)] sm:right-6" aria-label={`Lembrete de instalação do ${appName(appKind)}`}>
        <button type="button" onClick={dismiss} className="absolute right-2 top-2 rounded-md p-1 text-foreground/55 hover:text-foreground" aria-label="Fechar lembrete">
          <X size={17} aria-hidden="true" />
        </button>
        <p className="pr-5 text-sm font-bold">Tenha o {appName(appKind)} sempre à mão.</p>
        <p className="mt-1 pr-3 text-sm leading-relaxed text-foreground/70">Instale este espaço no celular para abrir mais rápido quando quiser.</p>
        <button type="button" onClick={() => void install()} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md bg-orange px-4 py-3 text-sm font-bold text-white hover:bg-orange-dark">
          <Download size={17} aria-hidden="true" /> Instalar agora
        </button>
      </aside>
      {instructionsOpen && (
        <div className="fixed inset-0 z-[320] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={`reminder-install-${appKind}-title`}>
          <div className="w-full max-w-md rounded-2xl border border-orange/40 bg-surface p-6 text-foreground shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h2 id={`reminder-install-${appKind}-title`} className="font-playfair text-2xl font-bold">Adicionar {appName(appKind)}</h2>
              <button type="button" onClick={() => setInstructionsOpen(false)} className="rounded-md p-2 text-foreground/60 hover:bg-accent hover:text-foreground" aria-label="Fechar instruções">
                <X size={21} aria-hidden="true" />
              </button>
            </div>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-base leading-relaxed text-foreground/75">
              {getInstallInstructions(platform, appName(appKind)).map((instruction) => <li key={instruction}>{instruction}</li>)}
            </ol>
            <button type="button" onClick={() => setInstructionsOpen(false)} className="mt-6 min-h-11 rounded-md bg-neon px-5 py-3 text-sm font-bold text-black hover:opacity-90">Entendi</button>
          </div>
        </div>
      )}
    </>
  );
}
