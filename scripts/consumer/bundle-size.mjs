#!/usr/bin/env node
/**
 * Bundle-size and tree-shaking measurement (0.17).
 *
 * Builds four scenarios from the INSTALLED tarballs with one toolchain and identical production
 * settings, then reports raw / gzip / brotli JavaScript, the increment over the empty app,
 * duplicate Core inclusion and tree-shaking markers. `--check` compares against
 * consumer/bundle/budgets.json; `--write-budgets` rewrites the budgets from this measurement
 * (rounded up with 10% headroom); `--report` rewrites docs/releases/0.17-bundle-size.md.
 *
 * Usage: node scripts/consumer/bundle-size.mjs [--fixture angular-21.2] [--check|--write-budgets] [--report]
 * Prerequisite: `pnpm build:lib`.
 */
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const has = (n) => args.includes(`--${n}`);
const fixture = args.includes('--fixture') ? args[args.indexOf('--fixture') + 1] : 'angular-21.2';
const scenarios = JSON.parse(readFileSync(join(ROOT, 'consumer/bundle/scenarios.json'), 'utf8'));
const budgetsFile = join(ROOT, 'consumer/bundle/budgets.json');
const env = { ...process.env, CI: '1', NG_CLI_ANALYTICS: 'false', NO_COLOR: '1' };
const run = (cmd, a, o = {}) => execFileSync(cmd, a, { stdio: 'inherit', env, ...o });
const work = mkdtempSync(join(tmpdir(), 'quartz-bundle-'));
const app = join(work, 'app');

function pack(dist) {
  const out = execFileSync('npm', ['pack', '--json', '--pack-destination', work], {
    cwd: dist,
    encoding: 'utf8',
  });
  return join(work, JSON.parse(out)[0].filename);
}

function jsFiles(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => join(dir, f));
}

try {
  for (const p of ['core', 'primitives'])
    if (!existsSync(join(ROOT, `packages/${p}/dist/package.json`)))
      throw new Error('run `pnpm build:lib` first');
  const tarballs = [
    pack(join(ROOT, 'packages/core/dist')),
    pack(join(ROOT, 'packages/primitives/dist')),
  ];

  cpSync(join(ROOT, 'consumer/cli-app'), app, {
    recursive: true,
    filter: (s) => !/node_modules|\/dist(\/|$)/.test(s),
  });
  rmSync(join(app, 'src/app'), { recursive: true, force: true });
  const fx = join(ROOT, 'consumer/fixtures', fixture);
  cpSync(join(fx, 'package.json'), join(app, 'package.json'));
  cpSync(join(fx, 'package-lock.json'), join(app, 'package-lock.json'));
  run('npm', ['ci', '--no-audit', '--no-fund'], { cwd: app });
  run('npm', ['install', '--no-save', '--no-audit', '--no-fund', ...tarballs], { cwd: app });

  const results = {};
  for (const [name, scenario] of Object.entries(scenarios)) {
    console.log(`→ building ${name}`);
    writeFileSync(join(app, 'src/main.ts'), scenario.main);
    rmSync(join(app, 'dist'), { recursive: true, force: true });
    run('npx', ['ng', 'build'], { cwd: app, stdio: 'pipe' });
    const files = jsFiles(join(app, 'dist/browser'));
    const sources = files.map((f) => readFileSync(f));
    const all = Buffer.concat(sources);
    const text = all.toString('utf8');
    results[name] = {
      description: scenario.description,
      files: files.length,
      raw: all.length,
      gzip: sources.reduce((n, s) => n + gzipSync(s, { level: 9 }).length, 0),
      brotli: sources.reduce((n, s) => n + brotliCompressSync(s).length, 0),
      // Distinctive Core definitions must appear at most once (no duplicated Core copy).
      duplicateCore: (text.match(/class OverlayService\b/g) ?? []).length > 1,
      leaked: scenario.absent.filter((marker) => text.includes(marker)),
      demoCode: /docs-demos|app-home|voltui|lumen/i.test(text),
      css: existsSyncCss(join(app, 'dist/browser')),
      families: [...new Set([...text.matchAll(/qz-([a-z]+)/g)].map((m) => m[1]))].sort(),
    };
  }
  if (has('families'))
    for (const [k, r] of Object.entries(results)) console.log(k, r.families.join(' '));
  const base = results['A-empty'];
  const local = results['A2-local-directive'];
  for (const r of Object.values(results)) {
    r.incrementRaw = r.raw - base.raw;
    r.incrementGzip = r.gzip - base.gzip;
    r.incrementBrotli = r.brotli - base.brotli;
    r.incrementOverLocal = r.gzip - local.gzip;
  }
  const fmt = (n) => (n / 1024).toFixed(1) + ' kB';
  console.table(
    Object.fromEntries(
      Object.entries(results).map(([k, r]) => [
        k,
        {
          raw: fmt(r.raw),
          gzip: fmt(r.gzip),
          brotli: fmt(r.brotli),
          '+gzip': fmt(r.incrementGzip),
          leaked: r.leaked.join(',') || '-',
          dupCore: r.duplicateCore,
          css: r.css,
        },
      ]),
    ),
  );

  const problems = [];
  for (const [k, r] of Object.entries(results)) {
    if (r.duplicateCore) problems.push(`${k}: duplicate Core inclusion`);
    if (r.leaked.length) problems.push(`${k}: tree-shaking leak (${r.leaked.join(', ')})`);
    if (r.demoCode) problems.push(`${k}: unexpected demo/visual dependency code`);
    if (r.css) problems.push(`${k}: package shipped CSS into the bundle`);
  }

  if (has('write-budgets')) {
    const budgets = Object.fromEntries(
      Object.entries(results).map(([k, r]) => [
        k,
        {
          gzip: Math.ceil((r.gzip * 1.1) / 100) * 100,
          incrementGzip: Math.ceil((Math.max(r.incrementGzip, 0) * 1.1) / 100) * 100,
        },
      ]),
    );
    writeFileSync(
      budgetsFile,
      JSON.stringify(
        { measuredWith: fixture, headroom: '10% over the measured gzip size', budgets },
        null,
        2,
      ) + '\n',
    );
    console.log('budgets written');
  }
  if (has('check')) {
    const { budgets } = JSON.parse(readFileSync(budgetsFile, 'utf8'));
    for (const [k, r] of Object.entries(results)) {
      const b = budgets[k];
      if (!b) problems.push(`${k}: no budget`);
      else if (r.gzip > b.gzip) problems.push(`${k}: gzip ${r.gzip} B exceeds budget ${b.gzip} B`);
      else if (r.incrementGzip > b.incrementGzip)
        problems.push(`${k}: increment ${r.incrementGzip} B exceeds budget ${b.incrementGzip} B`);
    }
  }
  if (has('report')) {
    const versions = (n) =>
      JSON.parse(readFileSync(join(app, 'node_modules', n, 'package.json'), 'utf8')).version;
    const rows = Object.entries(results).map(
      ([k, r]) =>
        `| ${k} | ${fmt(r.raw)} | ${fmt(r.gzip)} | ${fmt(r.brotli)} | +${fmt(r.incrementGzip)} | ${r.incrementOverLocal >= 0 ? '+' : ''}${fmt(r.incrementOverLocal)} | ${r.leaked.length ? r.leaked.join(', ') : 'none'} | ${r.duplicateCore ? 'yes' : 'no'} |`,
    );
    mkdirSync(join(ROOT, 'docs/releases'), { recursive: true });
    writeFileSync(
      join(ROOT, 'docs/releases/0.17-bundle-size.md'),
      `# 0.17 bundle-size and tree-shaking report\n\nGenerated by \`node scripts/consumer/bundle-size.mjs --report\` (do not edit by hand).\n\nToolchain: ${fixture} — Angular ${versions('@angular/core')}, TypeScript ${versions('typescript')}, \`@angular/build\` ${versions('@angular/build')}, Node ${process.version}. Quartz installed from packed tarballs (\`@quartz-headless/core\` ${versions('@quartz-headless/core')}, \`@quartz-headless/primitives\` ${versions('@quartz-headless/primitives')}). Settings: \`@angular/build:application\`, AOT, optimization on, no source maps, zoneless. Sizes sum every emitted \`.js\` file; gzip level 9; brotli default.\n\n| Scenario | Raw JS | gzip | brotli | gzip vs empty app | gzip vs local directive | Tree-shaking leaks | Duplicate Core |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n${rows.join('\n')}\n\n## Scenarios\n\n${Object.entries(
        results,
      )
        .map(([k, r]) => `- **${k}** — ${r.description}.`)
        .join(
          '\n',
        )}\n\n## Checks\n\n- *Tree-shaking leaks* lists marker strings of unrelated primitives that must not appear in a bundle (e.g. the Dialog or Toast implementation in a Progress-only app). \`sideEffects: false\` is not treated as proof; the markers are the proof.\n- *Duplicate Core* counts definitions of a distinctive Core class (\`OverlayService\`); more than one means Core was bundled twice.\n- Demo/visual code and package-shipped CSS are asserted absent.\n- Budgets live in \`consumer/bundle/budgets.json\` and are derived from these measurements with 10% gzip headroom (\`--write-budgets\`); CI runs \`--check\`.\n`,
    );
    console.log('report written');
  }
  if (problems.length) throw new Error('\n  ' + problems.join('\n  '));
  console.log('\n✓ bundle-size checks passed');
} catch (error) {
  console.error(`\n✗ bundle-size: ${error.message}`);
  process.exitCode = 1;
} finally {
  rmSync(work, { recursive: true, force: true });
}

function existsSyncCss(dir) {
  // Only an app-level stylesheet would be legitimate; none of these scenarios has one.
  return readdirSync(dir).some((f) => f.endsWith('.css'));
}
