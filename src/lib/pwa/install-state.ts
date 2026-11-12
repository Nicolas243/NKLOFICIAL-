export type InstallPlatform = 'ios' | 'macos-safari' | 'firefox' | 'chromium' | 'other';

export type InstallCapabilities = {
  installed: boolean;
  nativePromptAvailable: boolean;
  platform: InstallPlatform;
};

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
