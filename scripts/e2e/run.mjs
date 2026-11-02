#!/usr/bin/env node
/**
 * Named, reproducible entry points for the docs-site Playwright suite.
 *
 *   node scripts/e2e/run.mjs <profile> [playwright args…]
 *
 *   focused  one browser (chromium unless E2E_BROWSERS says otherwise), reuse an existing build:
 *            the developer loop, e.g. `pnpm e2e:focused e2e/navigation.spec.ts -g Toolbar`.
 *   ci       the CI-equivalent run: all three engines, fresh production build, the pinned worker
 *            and retry settings of playwright.config.ts. This is what must pass before merging.
 *   stress   diagnostic only: same suite at higher parallelism / with --repeat-each. Never a merge
 *            gate; used to expose races (a test that only fails here has a readiness bug).
 *
 * The resolved configuration, tool versions and host conditions are printed first so a result can
 * always be tied to the exact settings that produced it.
 */
import { spawn, spawnSync } from 'node:child_process';
import os from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const [profile, ...rest] = process.argv.slice(2);

const DEFAULTS = {
  focused: { E2E_PROFILE: 'local', E2E_BROWSERS: 'chromium', E2E_BUILD: 'reuse' },
  ci: { E2E_PROFILE: 'ci', E2E_BUILD: 'always' },
  stress: { E2E_PROFILE: 'stress', E2E_BUILD: 'reuse' },
};

if (!profile || !(profile in DEFAULTS)) {
  console.error(
    `usage: node scripts/e2e/run.mjs <${Object.keys(DEFAULTS).join('|')}> [playwright args]`,
  );
  process.exit(2);
}

// Explicit environment always wins over a profile default.
const env = { ...process.env };
for (const [key, value] of Object.entries(DEFAULTS[profile])) env[key] ??= value;

const version = (command, args) => {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8' });
  return (result.stdout || result.stderr || 'unknown').trim().split('\n')[0];
};

const lines = [
  `profile        ${profile}`,
  `commit         ${version('git', ['rev-parse', '--short=12', 'HEAD'])}${version('git', ['status', '--porcelain']) ? ' (dirty)' : ''}`,
  `playwright     ${version('pnpm', ['exec', 'playwright', '--version'])}`,
  `node           ${process.version}`,
  `os             ${os.type()} ${os.release()} ${os.arch()}, ${os.cpus().length} cpus, ${Math.round(os.totalmem() / 2 ** 30)} GiB`,
  `load / free    ${os
    .loadavg()
    .map((n) => n.toFixed(1))
    .join(' ')} / ${Math.round(os.freemem() / 2 ** 20)} MiB`,
  ...[
    'E2E_PROFILE',
    'E2E_WORKERS',
    'E2E_RETRIES',
    'E2E_BROWSERS',
    'E2E_BUILD',
    'E2E_HOST',
    'E2E_PORT',
    'E2E_REUSE_SERVER',
  ].map((key) => `${key.padEnd(14)} ${env[key] ?? '(profile default)'}`),
  `args           ${rest.join(' ') || '(none)'}`,
];
console.log(`[e2e] resolved configuration\n${lines.map((line) => `  ${line}`).join('\n')}`);

const child = spawn('pnpm', ['exec', 'playwright', 'test', ...rest], {
  cwd: ROOT,
  env,
  stdio: 'inherit',
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
