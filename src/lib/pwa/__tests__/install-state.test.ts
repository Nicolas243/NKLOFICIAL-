import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PWA_INSTALLED_STORAGE_KEY,
  detectInstallPlatform,
  getInstallAction,
  getInstallInstructions,
  getInstallIntentStorageKey,
  getScopedInstalledStorageKey,
  hasInstallIntent,
  hasInstalledRelatedApp,
  hasPersistedPwaInstall,
  isStandaloneDisplayMode,
  markInstallIntent,
  persistPwaInstall,
  resolvePwaInstalledState,
  shouldClearInstallPrompt,
} from '../install-state';

function createMemoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

test('detects iOS Safari instructions when the native prompt is unavailable', () => {
  const platform = detectInstallPlatform(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
    false,
  );

  assert.equal(platform, 'ios');
  assert.deepEqual(getInstallInstructions(platform, 'NKL Música'), [
    'Abra o menu Compartilhar do Safari.',
    'Toque em Adicionar à Tela de Início.',
    'Confirme em Adicionar.',
  ]);
});

test('detects Firefox desktop as an instructions-only platform', () => {
  const platform = detectInstallPlatform(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    false,
  );

  assert.equal(platform, 'firefox');
  assert.equal(getInstallAction({
    installed: false,
    nativePromptAvailable: false,
    platform,
  }), 'instructions');
});

test('uses the native prompt when available and hides action when already installed', () => {
  assert.equal(getInstallAction({
    installed: false,
    nativePromptAvailable: true,
    platform: 'chromium',
  }), 'native-prompt');
  assert.equal(getInstallAction({
    installed: true,
    nativePromptAvailable: true,
    platform: 'chromium',
  }), 'hidden');
});

test('provides Chromium instructions when no native prompt is exposed', () => {
  assert.deepEqual(
    getInstallInstructions('chromium', 'Renda Extra'),
    [
      'Abra o menu do navegador.',
      'Escolha Instalar aplicativo ou Adicionar à tela inicial.',
      'Confirme a instalação de Renda Extra.',
    ],
  );
});

test('clears a native prompt after either user choice', () => {
  assert.equal(shouldClearInstallPrompt('accepted'), true);
  assert.equal(shouldClearInstallPrompt('dismissed'), true);
});

test('shares the header install intent with the reminder', () => {
  const storage = createMemoryStorage();

  assert.equal(hasInstallIntent(storage, 'income'), false);
  markInstallIntent(storage, 'income');
  assert.equal(storage.values.get(getInstallIntentStorageKey('income')), 'true');
  assert.equal(hasInstallIntent(storage, 'income'), true);
});

test('persists and detects global nkl_pwa_installed and scoped install flags', () => {
  const storage = createMemoryStorage();

  assert.equal(hasPersistedPwaInstall(storage, 'portal'), false);
  persistPwaInstall(storage, 'portal');
  assert.equal(storage.values.get(PWA_INSTALLED_STORAGE_KEY), 'true');
  assert.equal(storage.values.get(getScopedInstalledStorageKey('portal')), 'true');
  assert.equal(hasPersistedPwaInstall(storage, 'portal'), true);
  assert.equal(hasPersistedPwaInstall(storage, 'income'), true);
});

test('detects standalone display mode and iOS navigator.standalone', () => {
  assert.equal(
    isStandaloneDisplayMode({ matchMedia: () => ({ matches: true }) as MediaQueryList }, null),
    true,
  );
  assert.equal(
    isStandaloneDisplayMode({ matchMedia: () => ({ matches: false }) as MediaQueryList }, { standalone: true }),
    true,
  );
  assert.equal(
    isStandaloneDisplayMode({ matchMedia: () => ({ matches: false }) as MediaQueryList }, { standalone: false }),
    false,
  );
});

test('detects installed related apps and persists nkl_pwa_installed', async () => {
  const storage = createMemoryStorage();
  assert.equal(await hasInstalledRelatedApp({ getInstalledRelatedApps: async () => [] }), false);
  assert.equal(await hasInstalledRelatedApp({ getInstalledRelatedApps: async () => [{ id: 'nkl' }] }), true);

  const resolved = await resolvePwaInstalledState({
    scope: 'music',
    win: { matchMedia: () => ({ matches: false }) as MediaQueryList },
    nav: {
      standalone: false,
      getInstalledRelatedApps: async () => [{ id: 'nkl' }],
    },
    storage,
  });

  assert.equal(resolved, true);
  assert.equal(storage.values.get(PWA_INSTALLED_STORAGE_KEY), 'true');
  assert.equal(
    getInstallAction({ installed: resolved, nativePromptAvailable: true, platform: 'chromium' }),
    'hidden',
  );
});
