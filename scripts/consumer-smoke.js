#!/usr/bin/env node
'use strict';

/**
 * Real-consumer install+compile smoke test.
 *
 * `scripts/verify-build.js` only checks the built dist folders' files/exports directly off
 * disk — it never proves an external project can actually `npm install` and import the
 * packages the way a real consumer would (their `exports` map, peerDependency
 * satisfiability, and whether ng-packagr actually shipped every needed file). This script
 * does that: it `npm pack`s both built packages into real tarballs, installs them into a
 * throwaway fixture project OUTSIDE the pnpm workspace (so nothing resolves via the
 * workspace symlink or a tsconfig path alias), and runs `tsc --noEmit` against a fixture
 * file that imports from the bare `@quartz-headless/core` / `@quartz-headless/primitives`
 * specifiers only.
 *
 * Run after `pnpm build:lib` (via `pnpm verify:consumer`). Not part of the pre-commit hook —
 * this does a real network-touching install and is meaningfully slower than verify-build.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CORE_DIST = path.join(ROOT, 'packages/core/dist');
const PRIMITIVES_DIST = path.join(ROOT, 'packages/primitives/dist');
const FIXTURE_TEMPLATE_DIR = path.join(__dirname, 'consumer-smoke/fixture');

function fail(message) {
  console.error(`\n✗ Consumer smoke test failed: ${message}\n`);
  process.exit(1);
}

function assertBuilt(dir, label) {
  if (!fs.existsSync(dir) || !fs.existsSync(path.join(dir, 'package.json'))) {
    fail(`${label} is not built (${dir} missing). Run \`pnpm build:lib\` first.`);
  }
}

function npmPack(distDir, destDir) {
  const output = execFileSync('npm', ['pack', '--json', '--pack-destination', destDir], {
    cwd: distDir,
    encoding: 'utf8',
  });
  const [{ filename }] = JSON.parse(output);
  return path.join(destDir, filename);
}

function main() {
  assertBuilt(CORE_DIST, '@quartz-headless/core');
  assertBuilt(PRIMITIVES_DIST, '@quartz-headless/primitives');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quartz-consumer-smoke-'));
  const keepFixture = !!process.env.KEEP_CONSUMER_SMOKE_FIXTURE;

  try {
    console.log('→ Packing built packages into real tarballs…');
    const coreTarball = npmPack(CORE_DIST, tmpDir);
    const primitivesTarball = npmPack(PRIMITIVES_DIST, tmpDir);

    console.log('→ Assembling fixture project…');
    for (const file of ['tsconfig.json', 'consumer.ts']) {
      fs.copyFileSync(path.join(FIXTURE_TEMPLATE_DIR, file), path.join(tmpDir, file));
    }
    const pkgTemplate = fs.readFileSync(
      path.join(FIXTURE_TEMPLATE_DIR, 'package.json.template'),
      'utf8',
    );
    const pkgJson = pkgTemplate
      .replace('__CORE_TARBALL__', coreTarball)
      .replace('__PRIMITIVES_TARBALL__', primitivesTarball);
    fs.writeFileSync(path.join(tmpDir, 'package.json'), pkgJson);

    console.log('→ Installing the fixture as a real consumer would (npm install)…');
    execFileSync('npm', ['install', '--no-audit', '--no-fund'], {
      cwd: tmpDir,
      stdio: 'inherit',
    });

    console.log('→ Type-checking against only the installed packages (no workspace aliases)…');
    execFileSync('npx', ['tsc', '--noEmit'], { cwd: tmpDir, stdio: 'inherit' });

    console.log('\n✓ Consumer smoke test passed: a real external install + compile succeeds.\n');
  } catch (error) {
    fail(error.message ?? String(error));
  } finally {
    if (keepFixture) {
      console.log(`(KEEP_CONSUMER_SMOKE_FIXTURE set — fixture left at ${tmpDir})`);
    } else {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}

main();
