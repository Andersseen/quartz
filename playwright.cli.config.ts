import { defineConfig, devices } from '@playwright/test';

/** Browser check for the CLI source-copy consumer (consumer/cli-app). Started by scripts/consumer/cli.mjs. */
export default defineConfig({
  testDir: './consumer/e2e-cli',
  retries: 0,
  forbidOnly: true,
  reporter: [['list']],
  outputDir: 'test-results-consumer',
  use: {
    baseURL: process.env.CONSUMER_BASE_URL ?? 'http://localhost:4300',
    reducedMotion: 'no-preference',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
