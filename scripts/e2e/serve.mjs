#!/usr/bin/env node
/**
 * Playwright `webServer` entry for the docs-site E2E suites: build (or validate) the production
 * output, then serve it exactly like Cloudflare Pages (scripts/preview-static.mjs).
 *
 * Why a wrapper instead of `pnpm build:demo && node preview-static.mjs`:
 *  - the browsers must never see partially generated output. `vite build` empties the output
 *    directory first and `build:demo` finishes with the sitemap and the Pagefind index, so the
 *    served directory is verified complete (`assertComplete`) before the server starts;
 *  - two overlapping builds into one `dist/` corrupt each other, so builds take an exclusive,
 *    liveness-checked lock and a second builder fails fast instead of racing;
 *  - the preview child is always terminated with this process (no orphaned server holding the
 *    port after an interrupted run).
 *
 * Environment:
 *   E2E_PORT        port to serve on (default 5173)
 *   E2E_BUILD       always (default) | reuse (build only when the output is missing/incomplete)
 *                   | skip (never build; fail if the output is incomplete)
 *   E2E_SITE_DIR    output directory (default dist/analog/public)
 *   E2E_SERVER_LOG  JSON-lines server log (failed responses, errors, lifecycle)
 */
import { spawn, spawnSync } from 'node:child_process';
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  writeSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const port = process.env.E2E_PORT ?? '5173';
const mode = process.env.E2E_BUILD ?? 'always';
const siteDir = resolve(ROOT, process.env.E2E_SITE_DIR ?? 'dist/analog/public');
const lockFile = join(ROOT, 'node_modules/.cache/quartz-e2e/build.lock');
const serverLog = process.env.E2E_SERVER_LOG;
if (serverLog) {
  mkdirSync(dirname(resolve(ROOT, serverLog)), { recursive: true });
  rmSync(resolve(ROOT, serverLog), { force: true }); // each run starts with a fresh server log
}
const say = (message) => console.log(`[e2e-serve] ${message}`);

if (!['always', 'reuse', 'skip'].includes(mode)) {
  console.error(`[e2e-serve] E2E_BUILD must be always|reuse|skip, got "${mode}"`);
  process.exit(2);
}

/** Files that only exist once `build:demo` ran to its last step (sitemap + Pagefind index). */
function missingOutputs() {
  return [
    'index.html',
    '_redirects',
    'sitemap.xml',
    'robots.txt',
    'pagefind/pagefind.js',
    'docs/index.html',
  ].filter((file) => !existsSync(join(siteDir, file)));
}

function assertComplete(context) {
  const missing = missingOutputs();
  if (missing.length > 0) {
    console.error(
      `[e2e-serve] ${context}: output ${siteDir} is incomplete (missing: ${missing.join(', ')})`,
    );
    process.exit(1);
  }
}

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

function acquireBuildLock() {
  mkdirSync(dirname(lockFile), { recursive: true });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const fd = openSync(lockFile, 'wx');
      writeSync(fd, String(process.pid));
      closeSync(fd);
      return;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const holder = Number(readFileSync(lockFile, 'utf8'));
      if (holder && alive(holder)) {
        console.error(
          `[e2e-serve] another build (pid ${holder}) owns ${lockFile}; refusing to build into the same output concurrently`,
        );
        process.exit(1);
      }
      rmSync(lockFile, { force: true }); // stale lock from an interrupted run
    }
  }
  console.error('[e2e-serve] could not acquire the build lock');
  process.exit(1);
}

function build() {
  acquireBuildLock();
  const release = () => rmSync(lockFile, { force: true });
  process.on('exit', release);
  say('building production output (pnpm build:demo)');
  const started = Date.now();
  const result = spawnSync('pnpm', ['build:demo'], { cwd: ROOT, stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`[e2e-serve] build failed (status ${result.status ?? result.signal})`);
    process.exit(result.status || 1);
  }
  release();
  say(`build finished in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

if (mode === 'always') build();
else if (missingOutputs().length > 0) {
  if (mode === 'skip') assertComplete('E2E_BUILD=skip');
  say(`output incomplete (${missingOutputs().join(', ')}); building`);
  build();
} else {
  say(`reusing existing output ${siteDir}`);
}
assertComplete('after build');

const server = spawn(process.execPath, [join(ROOT, 'scripts/preview-static.mjs'), siteDir, port], {
  cwd: ROOT,
  stdio: 'inherit',
});
const forward = (signal) => () => server.kill(signal);
process.on('SIGTERM', forward('SIGTERM'));
process.on('SIGINT', forward('SIGINT'));
process.on('exit', () => server.kill('SIGKILL'));
server.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
