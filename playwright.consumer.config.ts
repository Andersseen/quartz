import { defineConfig, devices } from '@playwright/test';

/**
 * Browser suite for the REAL consumer app (consumer/app, installed from packed tarballs).
 * Started by `scripts/consumer/run.mjs`, which serves the production SSR build and sets
 * CONSUMER_BASE_URL. No retries: a flaky pass is not stability evidence.
 */
export default defineConfig({
  testDir: './consumer/e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['json']],
  outputDir: 'test-results-consumer',
  use: {
    baseURL: process.env.CONSUMER_BASE_URL ?? 'http://localhost:4300',
    trace: 'retain-on-failure',
    reducedMotion: 'no-preference',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
