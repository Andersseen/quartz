#!/usr/bin/env node
'use strict';

/**
 * Declaration-based public API guard.
 *
 * Reads the *built* `.d.ts` entry of each package with the TypeScript compiler (not a text
 * search of the JS bundle) and compares the exported surface — export names, their kind and,
 * for functions, their full call signatures — against a committed snapshot in
 * `docs/api/snapshots/`. Any addition, removal or signature change fails `pnpm verify:build`
 * until the snapshot is regenerated on purpose:
 *
 *   node scripts/api-guard.js --update     (after `pnpm build:lib`)
 *
 * so every public API change shows up in the PR diff and has to be acknowledged.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');
const SNAPSHOT_DIR = path.join(ROOT, 'docs/api/snapshots');

const PACKAGES = {
  core: { dts: 'packages/core/dist/types/quartz-headless-core.d.ts' },
  primitives: { dts: 'packages/primitives/dist/types/quartz-headless-primitives.d.ts' },
};

function describeExports(dtsPath) {
  const program = ts.createProgram([dtsPath], {
    noEmit: true,
    skipLibCheck: true,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    strict: true,
  });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(dtsPath);
  if (!source) throw new Error(`Cannot read declarations: ${dtsPath}`);
  const moduleSymbol = checker.getSymbolAtLocation(source);
  if (!moduleSymbol) throw new Error(`No module exports found in ${dtsPath}`);

  const surface = {};
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    const symbol =
      exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    const decl = symbol.declarations?.[0];
    let kind = 'other';
    let signatures;
    if (symbol.flags & ts.SymbolFlags.Function) {
      kind = 'function';
      const type = checker.getTypeOfSymbolAtLocation(symbol, decl);
      signatures = type
        .getCallSignatures()
        .map((sig) => checker.signatureToString(sig, decl, ts.TypeFormatFlags.NoTruncation));
    } else if (symbol.flags & ts.SymbolFlags.Class) kind = 'class';
    else if (symbol.flags & ts.SymbolFlags.Interface) kind = 'interface';
    else if (symbol.flags & ts.SymbolFlags.TypeAlias) kind = 'type';
    else if (symbol.flags & ts.SymbolFlags.Variable) kind = 'const';
    else if (symbol.flags & ts.SymbolFlags.Enum) kind = 'enum';
    surface[exported.name] = signatures ? { kind, signatures } : { kind };
  }
  return Object.fromEntries(Object.entries(surface).sort(([a], [b]) => a.localeCompare(b)));
}

function snapshotPath(name) {
  return path.join(SNAPSHOT_DIR, `${name}.json`);
}

function checkApiSurface({ update = false } = {}) {
  const problems = [];
  for (const [name, { dts }] of Object.entries(PACKAGES)) {
    const actual = describeExports(path.join(ROOT, dts));
    const file = snapshotPath(name);
    if (update) {
      fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(actual, null, 2) + '\n');
      // Keep the committed snapshot prettier-clean so `pnpm format:check` stays green.
      execFileSync('npx', ['prettier', '--write', file], { cwd: ROOT, stdio: 'ignore' });
      console.log(`✓ Updated ${path.relative(ROOT, file)} (${Object.keys(actual).length} exports)`);
      continue;
    }
    if (!fs.existsSync(file)) {
      problems.push(`${name}: missing API snapshot ${path.relative(ROOT, file)}`);
      continue;
    }
    const expected = JSON.parse(fs.readFileSync(file, 'utf8'));
    const added = Object.keys(actual).filter((key) => !(key in expected));
    const removed = Object.keys(expected).filter((key) => !(key in actual));
    const changed = Object.keys(actual).filter(
      (key) => key in expected && JSON.stringify(actual[key]) !== JSON.stringify(expected[key]),
    );
    if (added.length) problems.push(`${name}: new exports not in snapshot: ${added.join(', ')}`);
    if (removed.length) problems.push(`${name}: exports removed: ${removed.join(', ')}`);
    if (changed.length) problems.push(`${name}: changed export shape: ${changed.join(', ')}`);
  }
  if (problems.length) {
    throw new Error(
      `Public API drifted from docs/api/snapshots:\n  - ${problems.join('\n  - ')}\n` +
        'If intentional, run `node scripts/api-guard.js --update` and document it in the PR.',
    );
  }
  if (!update) console.log('✓ Public API surface matches docs/api/snapshots');
}

module.exports = { checkApiSurface };

if (require.main === module) {
  try {
    checkApiSurface({ update: process.argv.includes('--update') });
  } catch (error) {
    console.error(`\n✗ ${error.message}\n`);
    process.exit(1);
  }
}
