import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

/**
 * Docs-site E2E configuration. Everything that influences determinism is explicit and
 * overridable; nothing depends on the machine's core count unless a profile asks for it.
 * `pnpm e2e` keeps working as before; `node scripts/e2e/run.mjs <profile>` is the supported way to
 * run a named profile and prints the resolved settings. See docs/roadmap/0.21-e2e-reliability.md.
 *
 *   E2E_PROFILE  local (default) | ci (default when CI is set) | stress
 *   E2E_WORKERS  parallel workers            E2E_RETRIES  retries per failing test
 *   E2E_BROWSERS comma list of chromium,firefox,webkit (default: all three)
 *   E2E_HOST     host the browsers use       E2E_PORT     port (default 5173)
 *   E2E_BUILD    always | reuse | skip       (see scripts/e2e/serve.mjs)
 *   E2E_REPORT_DIR / E2E_OUTPUT_DIR / E2E_LOG_DIR  where reports, traces and server logs go
 *   E2E_REUSE_SERVER  attach to an already running server instead of starting one
 */
const PROFILES = {
  local: { workers: 4, retries: 0 },
  ci: { workers: 2, retries: 0 },
  stress: { workers: 8, retries: 0 },
} as const;

type ProfileName = keyof typeof PROFILES;

function integer(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0)
    throw new Error(`${name} must be a non-negative integer, got "${raw}"`);
  return value;
}

const requested = process.env.E2E_PROFILE ?? (process.env.CI ? 'ci' : 'local');
if (!(requested in PROFILES)) {
  throw new Error(
    `E2E_PROFILE must be one of ${Object.keys(PROFILES).join(', ')}, got "${requested}"`,
  );
}
const profile = PROFILES[requested as ProfileName];

const e2ePort = process.env.E2E_PORT ?? '5173';
// An IP literal: the preview server binds 127.0.0.1, and resolving "localhost" (IPv6-first, system
// resolver) was measured to stall WebKit navigations before any request was sent.
const e2eHost = process.env.E2E_HOST ?? '127.0.0.1';
const baseURL = `http://${e2eHost}:${e2ePort}`;
const reportDir = process.env.E2E_REPORT_DIR ?? 'playwright-report';
const outputDir = process.env.E2E_OUTPUT_DIR ?? 'test-results';
const logDir = process.env.E2E_LOG_DIR ?? 'e2e-logs';
process.env.E2E_SERVER_LOG ??= `${logDir}/preview-server.log`;

const ALL_BROWSERS: NonNullable<PlaywrightTestConfig['projects']> = [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
];
const selected = (process.env.E2E_BROWSERS ?? ALL_BROWSERS.map((p) => p.name).join(','))
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);
for (const name of selected) {
  if (!ALL_BROWSERS.some((project) => project.name === name)) {
    throw new Error(`E2E_BROWSERS contains unknown browser "${name}"`);
  }
}

export default defineConfig({
  testDir: './e2e',
  outputDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: integer('E2E_RETRIES', profile.retries),
  workers: integer('E2E_WORKERS', profile.workers),
  reporter: [
    ['html', { open: 'never', outputFolder: reportDir }],
    ['json', { outputFile: `${logDir}/results.json` }],
    ['list'],
  ],
  use: {
    baseURL,
    // First-failure evidence without a second run: traces are kept only for failures, even with
    // zero retries (`on-first-retry` would record nothing when retries are 0).
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: ALL_BROWSERS.filter((project) => selected.includes(project.name)),
  webServer: {
    // Production build (prerendered + Pagefind index) served like Cloudflare Pages: directory
    // indexes, `_redirects`, real 404s, no SPA fallback. serve.mjs builds (or validates a reused
    // build), refuses overlapping builds and never serves partially generated output.
    command: 'node scripts/e2e/serve.mjs',
    env: { E2E_PORT: e2ePort, E2E_SERVER_LOG: process.env.E2E_SERVER_LOG },
    url: baseURL,
    reuseExistingServer: !!process.env.E2E_REUSE_SERVER,
    timeout: 240000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
  },
});
