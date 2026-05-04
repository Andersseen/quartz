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
    command: `pnpm build:demo && pnpm exec vite preview --host 127.0.0.1 --port ${e2ePort} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
