#!/usr/bin/env node
/**
 * CLI source-copy consumer (0.17): a fresh Angular app OUTSIDE the workspace receives Quartz source
 * through the real `quartz add` CLI, compiles with strict AOT against the installed Core peer and
 * is driven in Chromium/Firefox/WebKit.
 *
 * Usage: node scripts/consumer/cli.mjs [--fixture angular-21.2] [--project chromium,...] [--keep]
 * Prerequisite: `pnpm build:lib` (only the Core tarball is installed: copied Primitives import it).
 */
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
};
const fixture = opt('fixture', 'angular-21.2');
const projects = String(opt('project', 'chromium,firefox,webkit')).split(',');
const env = { ...process.env, CI: '1', NG_CLI_ANALYTICS: 'false', NO_COLOR: '1' };
const run = (cmd, a, o = {}) => execFileSync(cmd, a, { stdio: 'inherit', env, ...o });
const work = mkdtempSync(join(tmpdir(), 'quartz-cli-consumer-'));
const app = join(work, 'my app'); // a space in the project path is deliberate
let server;
const fail = (m) => {
  console.error(`\n✗ cli-consumer: ${m}\n`);
  process.exitCode = 1;
  throw new Error(m);
};
const cli = (cliArgs) =>
  spawnSync('node', [join(ROOT, 'cli/bin/quartz.js'), ...cliArgs], { cwd: app, encoding: 'utf8' });

try {
  if (!existsSync(join(ROOT, 'packages/core/dist/package.json')))
    fail('run `pnpm build:lib` first');
  const out = execFileSync('npm', ['pack', '--json', '--pack-destination', work], {
    cwd: join(ROOT, 'packages/core/dist'),
    encoding: 'utf8',
  });
  const coreTarball = join(work, JSON.parse(out)[0].filename);

  mkdirSync(app, { recursive: true });
  cpSync(join(ROOT, 'consumer/cli-app'), app, {
    recursive: true,
    filter: (s) => !/node_modules|\/dist(\/|$)/.test(s),
  });
  const fx = join(ROOT, 'consumer/fixtures', fixture);
  cpSync(join(fx, 'package.json'), join(app, 'package.json'));
  cpSync(join(fx, 'package-lock.json'), join(app, 'package-lock.json'));
  console.log('→ npm ci (Angular toolchain from the fixture lockfile)');
  run('npm', ['ci', '--no-audit', '--no-fund'], { cwd: app });
  console.log('→ install the Core peer from its tarball');
  run('npm', ['install', '--no-save', '--no-audit', '--no-fund', coreTarball], { cwd: app });

  const dest = 'src/app/quartz sources';
  console.log('→ quartz add (fresh directory, path with spaces)');
  let r = cli(['add', 'accordion', 'dialog', 'resizable', '-o', dest]);
  process.stdout.write(r.stdout);
  if (r.status !== 0) fail(`fresh add exited ${r.status}\n${r.stderr}`);
  if (!/npm install @quartz-headless\/core/.test(r.stdout)) fail('missing peer-dependency notice');

  console.log('→ quartz add again (existing directory): must be a clean no-op');
  r = cli(['add', 'accordion', 'dialog', 'resizable', '-o', dest]);
  if (r.status !== 0 || !/already up to date/.test(r.stdout))
    fail(`repeat add was not idempotent (${r.status})\n${r.stderr}`);

  console.log('→ error paths return non-zero');
  const expectExit = (cliArgs, code) => {
    const res = cli(cliArgs);
    if (res.status !== code)
      fail(`quartz ${cliArgs.join(' ')} exited ${res.status}, expected ${code}`);
  };
  expectExit(['add', 'does-not-exist', '-o', dest], 3);
  expectExit(['add', 'accordion', '--output'], 2);
  writeFileSync(join(app, dest, 'accordion/index.ts'), '// local edit\n');
  expectExit(['add', 'accordion', '-o', dest], 4);
  expectExit(['add', 'accordion', '-o', dest, '--force'], 0);

  // Prove nothing resolves through the workspace.
  const copied = readFileSync(join(app, dest, 'dialog/dialog.service.ts'), 'utf8');
  if (/packages\/(core|primitives)\/src|\.\.\/\.\.\/packages/.test(copied))
    fail('copied source references the workspace');

  console.log('→ ng build (AOT, strictTemplates, optimized) against copied source');
  run('npx', ['ng', 'build'], { cwd: app });

  const root = join(app, 'dist/browser');
  const port = 4300 + Math.floor(Math.random() * 500);
  server = spawn('node', [join(ROOT, 'scripts/preview-static.mjs'), root, String(port)], {
    stdio: 'ignore',
  });
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`http://localhost:${port}/`)).ok) break;
    } catch {
      /* not up yet */
    }
    await new Promise((res) => setTimeout(res, 250));
  }

  console.log('→ Playwright: copied components in a real browser');
  run(
    'pnpm',
    [
      'exec',
      'playwright',
      'test',
      '-c',
      'playwright.cli.config.ts',
      ...projects.flatMap((p) => ['--project', p]),
    ],
    {
      cwd: ROOT,
      env: { ...env, CONSUMER_BASE_URL: `http://localhost:${port}` },
    },
  );
  console.log('\n✓ cli-consumer passed');
} catch (error) {
  process.exitCode = 1;
  if (!String(error.message).startsWith('run `pnpm') && !process.exitCode) console.error(error);
} finally {
  server?.kill();
  if (opt('keep', false)) console.log(`(kept ${work})`);
  else rmSync(work, { recursive: true, force: true });
}
