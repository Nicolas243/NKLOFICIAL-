'use client';

import { Download, ExternalLink, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  ios: boolean;
};

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
}

function isIosDevice(): boolean {
  return /iphone|ipad|ipod/iu.test(navigator.userAgent);
}

function getAppKind(pathname: string): AppKind {
  return pathname === '/programas' || pathname.startsWith('/programas/') || pathname === '/blog/renda-extra'
    ? 'income'
    : 'music';
}

function appName(kind: AppKind): string {
  return kind === 'income' ? 'Renda Extra' : 'NKL Música';
}

function useInstallState(): InstallState {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event): void => {
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };
    const updateDisplayMode = (): void => setInstalled(isStandalone());

    const initialStateTimer = window.setTimeout(() => {
      setInstalled(isStandalone());
      setIos(isIosDevice());
    }, INITIAL_STATE_DELAY_MS);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', updateDisplayMode);
    return () => {
      window.clearTimeout(initialStateTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', updateDisplayMode);
    };
  }, []);

  return { prompt, installed, ios };
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
  const { prompt, installed, ios } = useInstallState();
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  if (installed || (!prompt && !ios)) return null;

  async function install(): Promise<void> {
    if (!prompt) {
      setInstructionsOpen(true);
      return;
    }

    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === 'accepted') {
      window.localStorage.setItem(`nkl-pwa-installed-${appKind}`, 'true');
    }
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
            <p className="mt-4 text-base leading-relaxed text-foreground/75">No Safari do iPhone ou iPad, toque em Compartilhar e escolha <strong>Adicionar à Tela de Início</strong>.</p>
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
  const { prompt, installed, ios } = useInstallState();
  const [visible, setVisible] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const dismissedAt = Number(window.localStorage.getItem(`nkl-pwa-reminder-${appKind}`) ?? 0);
      if (!isStandalone() && Date.now() - dismissedAt > INSTALL_REMINDER_COOLDOWN_MS) setVisible(true);
    }, INSTALL_REMINDER_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [appKind]);

  if (!visible || installed || (!prompt && !ios)) return null;

  async function install(): Promise<void> {
    if (!prompt) {
      setInstructionsOpen(true);
      return;
    }
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === 'accepted') {
      setVisible(false);
      window.localStorage.setItem(`nkl-pwa-installed-${appKind}`, 'true');
    }
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
            <p className="mt-4 text-base leading-relaxed text-foreground/75">No Safari, toque em Compartilhar e depois em <strong>Adicionar à Tela de Início</strong>.</p>
            <button type="button" onClick={() => setInstructionsOpen(false)} className="mt-6 min-h-11 rounded-md bg-neon px-5 py-3 text-sm font-bold text-black hover:opacity-90">Entendi</button>
          </div>
        </div>
      )}
    </>
  );
}
