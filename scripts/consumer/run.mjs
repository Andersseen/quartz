#!/usr/bin/env node
/**
 * Real-consumer runtime verification (0.17).
 *
 * Packs the BUILT Core/Primitives packages into tarballs, installs them into a throwaway Angular
 * application OUTSIDE the pnpm workspace (its own dependency tree + lockfile per Angular major),
 * builds it with the Angular application builder (production, strict AOT, SSR), serves the result
 * and runs the Playwright consumer suite against it.
 *
 * Usage: node scripts/consumer/run.mjs --fixture angular-21.2|angular-22 [--stage build|e2e|all]
 *        [--update-lock] [--keep] [--project chromium,firefox,webkit]
 * Prerequisite: `pnpm build:lib`.
 */
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = args[i + 1];
  return v && !v.startsWith('--') ? v : true;
};
const fixture = flag('fixture');
const stage = flag('stage', 'all');
const keep = flag('keep', false) || process.env['KEEP_CONSUMER_WORKDIR'];
const projects = String(flag('project', 'chromium,firefox,webkit')).split(',');
if (!fixture || typeof fixture !== 'string') fail('--fixture is required');

const fixtureDir = join(ROOT, 'consumer/fixtures', fixture);
if (!existsSync(join(fixtureDir, 'package.json'))) fail(`unknown fixture ${fixture}`);

function fail(message) {
  console.error(`\n✗ consumer(${fixture}): ${message}\n`);
  process.exit(1);
}
const run = (cmd, cmdArgs, opts = {}) =>
  execFileSync(cmd, cmdArgs, {
    stdio: 'inherit',
    env: { ...process.env, CI: '1', NG_CLI_ANALYTICS: 'false', NO_COLOR: '1' },
    ...opts,
  });
const sha = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

function pack(distDir, dest) {
  const out = execFileSync('npm', ['pack', '--json', '--pack-destination', dest], {
    cwd: distDir,
    encoding: 'utf8',
  });
  return join(dest, JSON.parse(out)[0].filename);
}

const work = mkdtempSync(join(tmpdir(), `quartz-consumer-${fixture}-`));
const app = join(work, 'app');
const evidence = { fixture, tarballs: {}, versions: {}, node: process.version };
let server;
process.on('exit', () => server?.kill());

try {
  for (const pkg of ['core', 'primitives']) {
    if (!existsSync(join(ROOT, `packages/${pkg}/dist/package.json`)))
      fail('run `pnpm build:lib` first');
  }
  console.log('→ packing tarballs');
  const tarballs = {
    core: pack(join(ROOT, 'packages/core/dist'), work),
    primitives: pack(join(ROOT, 'packages/primitives/dist'), work),
  };
  for (const [k, f] of Object.entries(tarballs))
    evidence.tarballs[k] = { file: f.split('/').pop(), sha256: sha(f) };

  console.log(`→ assembling ${fixture} in ${app}`);
  cpSync(join(ROOT, 'consumer/app'), app, {
    recursive: true,
    filter: (src) => !/node_modules|\/dist(\/|$)|\.angular/.test(src),
  });
  cpSync(join(fixtureDir, 'package.json'), join(app, 'package.json'));
  const lock = join(fixtureDir, 'package-lock.json');
  const hasLock = existsSync(lock);
  if (hasLock) cpSync(lock, join(app, 'package-lock.json'));

  console.log('→ installing Angular toolchain (npm ' + (hasLock ? 'ci' : 'install') + ')');
  run('npm', hasLock ? ['ci', '--no-audit', '--no-fund'] : ['install', '--no-audit', '--no-fund'], {
    cwd: app,
  });
  if (flag('update-lock', false) || !hasLock) cpSync(join(app, 'package-lock.json'), lock);

  console.log('→ installing Quartz tarballs (no workspace link)');
  run(
    'npm',
    ['install', '--no-save', '--no-audit', '--no-fund', tarballs.core, tarballs.primitives],
    { cwd: app },
  );

  const installed = (name) =>
    JSON.parse(readFileSync(join(app, 'node_modules', name, 'package.json'), 'utf8')).version;
  for (const n of [
    '@angular/core',
    '@angular/forms',
    '@angular/build',
    '@angular/ssr',
    'typescript',
    'rxjs',
    '@quartz-headless/core',
    '@quartz-headless/primitives',
  ])
    evidence.versions[n] = installed(n);
  console.log('  versions', evidence.versions);

  if (stage === 'install') process.exit(0);

  console.log('→ ng build (production, AOT, strictTemplates, SSR)');
  run('npx', ['ng', 'build', '--configuration', 'production'], { cwd: app });

  if (stage === 'build') {
    console.log(`\n✓ consumer(${fixture}) build passed`);
  } else {
    const port = 4300 + Math.floor(Math.random() * 500);
    console.log(`→ serving on :${port}`);
    server = spawn('node', ['serve.mjs', 'dist'], {
      cwd: app,
      env: { ...process.env, PORT: String(port) },
      stdio: 'inherit',
    });
    await new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error('server start timeout')), 30000);
      (async function poll() {
        try {
          const r = await fetch(`http://localhost:${port}/forms`);
          if (r.ok) {
            clearTimeout(t);
            res();
            return;
          }
        } catch {
          /* not up yet */
        }
        setTimeout(poll, 250);
      })();
    });

    console.log('→ Playwright consumer suite');
    const resultsFile = join(work, 'e2e.json');
    try {
      run(
        'pnpm',
        [
          'exec',
          'playwright',
          'test',
          '-c',
          'playwright.consumer.config.ts',
          ...projects.flatMap((p) => ['--project', p]),
        ],
        {
          cwd: ROOT,
          env: {
            ...process.env,
            CONSUMER_BASE_URL: `http://localhost:${port}`,
            CONSUMER_FIXTURE: fixture,
            PLAYWRIGHT_JSON_OUTPUT_NAME: resultsFile,
          },
        },
      );
    } finally {
      if (existsSync(resultsFile)) {
        const j = JSON.parse(readFileSync(resultsFile, 'utf8'));
        evidence.e2e = {
          expected: j.stats.expected,
          unexpected: j.stats.unexpected,
          flaky: j.stats.flaky,
          skipped: j.stats.skipped,
        };
      }
    }
  }
  mkdirSync(join(ROOT, 'consumer/results'), { recursive: true });
  writeFileSync(
    join(ROOT, 'consumer/results', `${fixture}.json`),
    JSON.stringify(evidence, null, 2) + '\n',
  );
  console.log(`\n✓ consumer(${fixture}) passed`, JSON.stringify(evidence.e2e ?? {}));
} catch (error) {
  fail(error.message ?? String(error));
} finally {
  server?.kill();
  if (keep) console.log(`(work dir kept: ${work})`);
  else rmSync(work, { recursive: true, force: true });
}
