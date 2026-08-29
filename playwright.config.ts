import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para a espinha dorsal crítica do portal.
 * O `webServer` faz o build de produção e sobe o servidor em http://localhost:3000
 * antes de executar a suíte — garantindo que a validação rode contra o artefato
 * final (não apenas o dev server).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
