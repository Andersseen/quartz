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
 * `--stage serve` builds the same installed-tarball app and keeps serving it for the manual
 * screen-reader matrix (docs/releases/0.17-manual-a11y.md); it runs no automated tests.
 * Set QUARTZ_RELEASE_ARTIFACTS=<dir> to install pre-packed, manifest-verified tarballs.
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
import { resolveTarballs } from './tarballs.mjs';
import { loadScenarios, startReviewServer } from './manual-review.mjs';

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

const work = mkdtempSync(join(tmpdir(), `quartz-consumer-${fixture}-`));
const app = join(work, 'app');
const evidence = { fixture, tarballs: {}, versions: {}, node: process.version };
let server;
process.on('exit', () => server?.kill());

try {
  const tarballs = resolveTarballs(work);
  console.log(`→ tarballs from ${tarballs.source}`);
  evidence.tarballSource = tarballs.source;
  delete tarballs.source;
  for (const [k, f] of Object.entries(tarballs))
    evidence.tarballs[k] = { file: f.split('/').pop(), sha256: sha(f) };

  console.log(`→ assembling ${fixture} in ${app}`);
  cpSync(join(ROOT, 'consumer/app'), app, {
    recursive: true,
    filter: (src) => !/node_modules|\/dist(\/|$)|\.angular/.test(src),
  });
  const generatedDir = join(app, 'src/app/generated-playgrounds');
  console.log('→ generating registered Component examples for strict AOT (' + fixture + ')');
  run(
    'pnpm',
    [
      'exec',
      'vitest',
      'run',
      '--project',
      'quartz-app',
      'src/app/docs-playgrounds/usage-code.spec.ts',
      '-t',
      'generates strict consumer compilation fixtures',
    ],
    {
      cwd: ROOT,
      env: {
        ...process.env,
        QUARTZ_PLAYGROUND_EXAMPLES_DIR: generatedDir,
        CI: '1',
        NO_COLOR: '1',
      },
    },
  );
  const appSource = join(app, 'src/app/app.ts');
  let appText = readFileSync(appSource, 'utf8');
  appText = appText.replace(
    "import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';",
    "import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';\n" +
      "import { GENERATED_PLAYGROUND_HOSTS, GENERATED_PLAYGROUND_TEMPLATE } from './generated-playgrounds';",
  );
  appText = appText.replace(
    'imports: [RouterOutlet, RouterLink, RouterLinkActive],',
    'imports: [RouterOutlet, RouterLink, RouterLinkActive, ...GENERATED_PLAYGROUND_HOSTS],',
  );
  appText = appText.replace(
    '<main><router-outlet /></main>',
    '<main><router-outlet />@if (false) { ${GENERATED_PLAYGROUND_TEMPLATE} }</main>',
  );
  writeFileSync(appSource, appText);
  cpSync(join(fixtureDir, 'package.json'), join(app, 'package.json'));
  const metaFile = join(fixtureDir, 'meta.json');
  if (
    existsSync(metaFile) &&
    JSON.parse(readFileSync(metaFile, 'utf8')).supportsAllowedHosts === false
  ) {
    // Early 21.0 builders predate the SSRF host allow-list option (and its enforcement).
    const angularJson = join(app, 'angular.json');
    const config = JSON.parse(readFileSync(angularJson, 'utf8'));
    delete config.projects.consumer.architect.build.options.security;
    writeFileSync(angularJson, JSON.stringify(config, null, 2));
  }
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

  // Negative proof in one isolated fixture: strict AOT must reject each category of bad public
  // example. All edits live only in this disposable consumer and are restored before the real
  // build. The normal package builds still compile every generated family/variant on each matrix cell.
  if (fixture === 'angular-21.2') {
    const generated = (file) => join(generatedDir, file);
    const rejectBuild = (label, expected) => {
      let output = '';
      try {
        execFileSync('npx', ['ng', 'build', '--configuration', 'production'], {
          cwd: app,
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, CI: '1', NG_CLI_ANALYTICS: 'false', NO_COLOR: '1' },
        });
        fail(`${label}: negative example compiled; strict AOT did not reject it`);
      } catch (error) {
        output = String(error.stdout ?? '') + String(error.stderr ?? '');
      }
      for (const { family, diagnostic } of expected)
        if (!diagnostic.test(output))
          fail(
            `negative example ${family} did not produce the expected compiler diagnostic for ${fixture}:\n${output.slice(0, 3500)}`,
          );
      for (const { family } of expected) console.log(`  ✓ ${family}: expected compiler diagnostic`);
    };
    const missingExport = {
      family: 'Slider / default',
      file: 'slider-default.ts',
      change: (text) => text.replace('SliderDirective', 'QuartzMissingPublicDirective'),
      diagnostic: /TS2305|has no exported member 'QuartzMissingPublicDirective'/,
    };
    const templateMutations = [
      {
        family: 'Toolbar / default',
        file: 'toolbar-default.ts',
        change: (text) =>
          text.replace('qzToolbar aria-label=', 'qzToolbar [qzUnknownInput]="true" aria-label='),
        diagnostic: /NG8002|qzUnknownInput/,
      },
      {
        family: 'Slider / default',
        file: 'slider-default.ts',
        change: (text) => text.replace('[min]="0"', '[min]="\'wrong\'"'),
        diagnostic: /not assignable to type 'number'|NG2.*string.*number/,
      },
      {
        family: 'Toggle / default',
        file: 'toggle-default.ts',
        change: (text) => text.replace('[(pressed)]="bold"', '[(qzUnknownModel)]="bold"'),
        diagnostic: /NG8002|NG8007|qzUnknownModel/,
      },
      {
        family: 'Slider / default',
        file: 'slider-default.ts',
        change: (text) => text.replace(/\s*protected readonly volume = signal\(40\);\n/, '\n'),
        diagnostic: /Property 'volume' does not exist|NG9.*volume/,
      },
    ];
    const originals = new Map();
    try {
      const rememberAndApply = (item) => {
        const path = generated(item.file);
        if (!originals.has(path)) originals.set(path, readFileSync(path, 'utf8'));
        const current = readFileSync(path, 'utf8');
        const mutated = item.change(current);
        if (mutated === current) fail(`negative example mutation did not apply: ${item.family}`);
        writeFileSync(path, mutated);
      };
      console.log(`→ negative generated-example AOT checks (${fixture})`);
      rememberAndApply(missingExport);
      rejectBuild('nonexistent Quartz public export', [missingExport]);
      for (const [path, content] of originals) writeFileSync(path, content);
      originals.clear();
      for (const item of templateMutations) rememberAndApply(item);
      rejectBuild('invalid Angular inputs, bindings, or state', templateMutations);
      evidence.negativeGeneratedExamples = [missingExport, ...templateMutations].map(
        ({ family }) => family,
      );
    } finally {
      for (const [path, content] of originals) writeFileSync(path, content);
    }
  }

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

    if (stage === 'serve') {
      const appUrl = `http://localhost:${port}`;
      const reviewPort = port + 1;
      const review = startReviewServer({
        port: reviewPort,
        scenarios: loadScenarios(),
        baseUrl: appUrl,
        run: {
          fixture,
          source: evidence.tarballSource,
          versions: evidence.versions,
          tarballs: evidence.tarballs,
        },
      });
      process.on('exit', () => review.close());
      console.log(
        `\n✓ consumer(${fixture}) is being served for MANUAL assistive-technology testing`,
      );
      console.log(`\n  Review index (scenarios, expected focus/announcements, results recorder):`);
      console.log(`    http://localhost:${reviewPort}/`);
      console.log('\n  Test pages:');
      for (const page of ['forms', 'overlays', 'navigation', 'parity', 'controls', 'autofill'])
        console.log(`    ${appUrl}/${page}`);
      console.log(
        '\nRecord outcomes in docs/releases/0.17-manual-a11y.md (the index can export rows). Ctrl+C to stop.',
      );
      await new Promise(() => {});
    }

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
            CI: '1',
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
