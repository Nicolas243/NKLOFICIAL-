import assert from 'node:assert/strict';
import test from 'node:test';
import {
  detectInstallPlatform,
  getInstallAction,
  getInstallInstructions,
  shouldClearInstallPrompt,
} from '../install-state';

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
