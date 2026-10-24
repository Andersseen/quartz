import { defineConfig, devices } from '@playwright/test';

const e2ePort = process.env.E2E_PORT ?? '5173';
const baseURL = `http://localhost:${e2ePort}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    // Production build (prerendered + Pagefind index) served like Cloudflare Pages: directory
    // indexes, `_redirects`, real 404s, no SPA fallback.
    command: `pnpm build:demo && node scripts/preview-static.mjs dist/analog/public ${e2ePort}`,
    url: baseURL,
    reuseExistingServer: !!process.env.E2E_REUSE_SERVER,
    timeout: 120000,
  },
});
