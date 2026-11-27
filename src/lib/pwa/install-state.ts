export type InstallPlatform = 'ios' | 'macos-safari' | 'firefox' | 'chromium' | 'other';

export type InstallCapabilities = {
  installed: boolean;
  nativePromptAvailable: boolean;
  platform: InstallPlatform;
};

export type InstallAppKind = 'music' | 'income';

export const PWA_INSTALLED_STORAGE_KEY = 'nkl_pwa_installed';
export const PWA_INSTALLED_EVENT = 'nkl:pwa-installed';

export type StandaloneNavigator = Navigator & {
  standalone?: boolean;
  getInstalledRelatedApps?: () => Promise<readonly unknown[]>;
};

export function getScopedInstalledStorageKey(scope: string): string {
  return `nkl-pwa-installed-${scope}`;
}

export function hasPersistedPwaInstall(
  storage: Pick<Storage, 'getItem'> | null | undefined,
  scope?: string,
): boolean {
  if (!storage) return false;
  try {
    if (storage.getItem(PWA_INSTALLED_STORAGE_KEY) === 'true') return true;
    return scope ? storage.getItem(getScopedInstalledStorageKey(scope)) === 'true' : false;
  } catch {
    return false;
  }
}

export function persistPwaInstall(
  storage: Pick<Storage, 'setItem'> | null | undefined,
  scope?: string,
): void {
  if (!storage) return;
  try {
    storage.setItem(PWA_INSTALLED_STORAGE_KEY, 'true');
    if (scope) {
      storage.setItem(getScopedInstalledStorageKey(scope), 'true');
    }
  } catch {
    // Ignore storage access errors in restricted browsing contexts.
  }
}

export function isStandaloneDisplayMode(
  win?: Pick<Window, 'matchMedia'> | null,
  nav?: Pick<StandaloneNavigator, 'standalone'> | null,
): boolean {
  const matchesStandalone = Boolean(win?.matchMedia?.('(display-mode: standalone)')?.matches);
  const navigatorStandalone = Boolean(nav?.standalone);
  return matchesStandalone || navigatorStandalone;
}

export async function hasInstalledRelatedApp(
  nav?: Pick<StandaloneNavigator, 'getInstalledRelatedApps'> | null,
): Promise<boolean> {
  if (!nav || typeof nav.getInstalledRelatedApps !== 'function') return false;
  try {
    const relatedApps = await nav.getInstalledRelatedApps();
    return Array.isArray(relatedApps) && relatedApps.length > 0;
  } catch {
    return false;
  }
}

export async function resolvePwaInstalledState(options: {
  scope?: string;
  win?: Pick<Window, 'matchMedia'> | null;
  nav?: Pick<StandaloneNavigator, 'standalone' | 'getInstalledRelatedApps'> | null;
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null;
}): Promise<boolean> {
  const { scope, win, nav, storage } = options;
  if (isStandaloneDisplayMode(win, nav)) {
    persistPwaInstall(storage, scope);
    return true;
  }
  if (hasPersistedPwaInstall(storage, scope)) {
    return true;
  }
  if (await hasInstalledRelatedApp(nav)) {
    persistPwaInstall(storage, scope);
    return true;
  }
  return false;
}

export function getInstallIntentStorageKey(kind: InstallAppKind): string {
  return `nkl-pwa-install-intent-${kind}`;
}

export function hasInstallIntent(
  storage: Pick<Storage, 'getItem'>,
  kind: InstallAppKind,
): boolean {
  return storage.getItem(getInstallIntentStorageKey(kind)) === 'true';
}

export function markInstallIntent(
  storage: Pick<Storage, 'setItem'>,
  kind: InstallAppKind,
): void {
  storage.setItem(getInstallIntentStorageKey(kind), 'true');
}

function isSafari(userAgent: string): boolean {
  return /safari/iu.test(userAgent) && !/chrome|crios|android/iu.test(userAgent);
}

export function detectInstallPlatform(userAgent: string, isStandalone: boolean): InstallPlatform {
  if (isStandalone) return 'other';
  if (/iphone|ipad|ipod/iu.test(userAgent)) return 'ios';
  if (isSafari(userAgent) && /macintosh/iu.test(userAgent)) return 'macos-safari';
  if (/firefox|fxios/iu.test(userAgent)) return 'firefox';
  if (/chrome|crios|edg|opr|opera|brave|samsungbrowser/iu.test(userAgent)) return 'chromium';
  return 'other';
}

export function getInstallInstructions(platform: InstallPlatform, appName: string): string[] {
  if (platform === 'ios') {
    return [
      'Abra o menu Compartilhar do Safari.',
      'Toque em Adicionar à Tela de Início.',
      'Confirme em Adicionar.',
    ];
  }

  if (platform === 'macos-safari') {
    return [
      'Abra o menu Arquivo do Safari.',
      'Escolha Adicionar ao Dock.',
      `Confirme a instalação de ${appName}.`,
    ];
  }

  if (platform === 'firefox') {
    return [
      'Abra o menu do navegador.',
      'Escolha Instalar ou Adicionar à tela inicial, quando disponível.',
      `Confirme a instalação de ${appName}.`,
    ];
  }

  return [
    'Abra o menu do navegador.',
    'Escolha Instalar aplicativo ou Adicionar à tela inicial.',
    `Confirme a instalação de ${appName}.`,
  ];
}

export function getInstallAction(capabilities: InstallCapabilities): 'native-prompt' | 'instructions' | 'hidden' {
  if (capabilities.installed) return 'hidden';
  if (capabilities.nativePromptAvailable) return 'native-prompt';
  return 'instructions';
}

export function shouldClearInstallPrompt(outcome: 'accepted' | 'dismissed'): boolean {
  return outcome === 'accepted' || outcome === 'dismissed';
}
