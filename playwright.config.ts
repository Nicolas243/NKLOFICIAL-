import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const baseURL = `http://localhost:${port}`;
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER !== '0' && !process.env.CI;
const webServerCommand =
  process.env.PLAYWRIGHT_PREBUILT === '1'
    ? `npx next start -p ${port}`
    : port === 3000
      ? 'npm run build && npm run start'
      : `npm run build && npx next start -p ${port}`;

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
  workers: process.env.PLAYWRIGHT_WORKERS ? Number(process.env.PLAYWRIGHT_WORKERS) : undefined,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer,
    timeout: 120_000,
  },
});
