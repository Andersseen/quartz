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
  core: {
    dts: 'packages/core/dist/types/quartz-headless-core.d.ts',
    fesm: 'packages/core/dist/fesm2022/quartz-headless-core.mjs',
  },
  primitives: {
    dts: 'packages/primitives/dist/types/quartz-headless-primitives.d.ts',
    fesm: 'packages/primitives/dist/fesm2022/quartz-headless-primitives.mjs',
  },
  'primitives-forms': {
    dts: 'packages/primitives/dist/types/quartz-headless-primitives-forms.d.ts',
    fesm: 'packages/primitives/dist/fesm2022/quartz-headless-primitives-forms.mjs',
  },
};

const MODIFIER = ts.ModifierFlags;

function isPublicMember(symbol) {
  if (symbol.name.startsWith('ɵ') || symbol.name.startsWith('__@')) return false;
  const decl = symbol.declarations?.[0];
  if (!decl) return false;
  if (ts.isPrivateIdentifier(decl.name ?? {})) return false;
  const flags = ts.getCombinedModifierFlags(decl);
  return !(flags & (MODIFIER.Private | MODIFIER.Protected));
}

function typeText(checker, type, location) {
  return checker.typeToString(type, location, ts.TypeFormatFlags.NoTruncation);
}

/** Properties/methods of a class or interface, public only, with their rendered types. */
function describeMembers(checker, type, location, staticType) {
  const out = {};
  const add = (prefix, t) => {
    for (const prop of checker.getPropertiesOfType(t)) {
      if (!isPublicMember(prop)) continue;
      const decl = prop.declarations[0];
      const flags = ts.getCombinedModifierFlags(decl);
      const memberType = checker.getTypeOfSymbolAtLocation(prop, decl);
      out[`${prefix}${prop.name}`] =
        (flags & MODIFIER.Readonly ? 'readonly ' : '') + typeText(checker, memberType, location);
    }
  };
  add('', type);
  if (staticType) add('static ', staticType);
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * Angular compiler metadata (selector, exportAs, inputs, outputs) read from the syntax of the
 * `static ɵdir/ɵcmp: ɵɵDirectiveDeclaration<T, selector, exportAs, inputs, outputs, ...>` member.
 * It is read from the AST because Angular declares that type alias as `unknown`.
 */
function describeAngularMetadata(checker, classSymbol, location) {
  const staticType = checker.getTypeOfSymbolAtLocation(classSymbol, location);
  const marker =
    checker.getPropertyOfType(staticType, 'ɵcmp') ?? checker.getPropertyOfType(staticType, 'ɵdir');
  if (!marker) return undefined;
  const node = marker.declarations[0].type;
  const args = node?.typeArguments;
  if (!args || args.length < 5)
    throw new Error(`Cannot read Angular metadata for ${classSymbol.name}`);
  const squash = (n) => n.getText().replace(/\s+/g, ' ');
  const literalText = (n) =>
    ts.isLiteralTypeNode(n) && ts.isStringLiteral(n.literal) ? n.literal.text : squash(n);
  const mapOf = (n) =>
    Object.fromEntries(
      (ts.isTypeLiteralNode(n) ? n.members : [])
        .map((m) => [m.name.getText().replace(/^"|"$/g, ''), squash(m.type)])
        .sort(([x], [y]) => x.localeCompare(y)),
    );
  const exportAsText = squash(args[2]);
  return {
    type: marker.name === 'ɵcmp' ? 'component' : 'directive',
    selector: literalText(args[1]),
    exportAs: exportAsText === 'never' ? null : exportAsText,
    inputs: mapOf(args[3]),
    outputs: mapOf(args[4]),
  };
}

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
    let entry = { kind: 'other' };
    if (symbol.flags & ts.SymbolFlags.Function) {
      const type = checker.getTypeOfSymbolAtLocation(symbol, decl);
      entry = {
        kind: 'function',
        signatures: type
          .getCallSignatures()
          .map((sig) => checker.signatureToString(sig, decl, ts.TypeFormatFlags.NoTruncation)),
      };
    } else if (symbol.flags & ts.SymbolFlags.Class) {
      const instance = checker.getDeclaredTypeOfSymbol(symbol);
      const staticType = checker.getTypeOfSymbolAtLocation(symbol, decl);
      entry = { kind: 'class' };
      const metadata = describeAngularMetadata(checker, symbol, decl);
      if (metadata) entry.angular = metadata;
      entry.members = describeMembers(checker, instance, decl, staticType);
    } else if (symbol.flags & ts.SymbolFlags.Interface) {
      entry = {
        kind: 'interface',
        members: describeMembers(checker, checker.getDeclaredTypeOfSymbol(symbol), decl),
      };
    } else if (symbol.flags & ts.SymbolFlags.TypeAlias) {
      entry = {
        kind: 'type',
        type: typeText(checker, checker.getDeclaredTypeOfSymbol(symbol), decl),
      };
    } else if (symbol.flags & ts.SymbolFlags.Enum) {
      entry = { kind: 'enum', members: checker.getExportsOfModule(symbol).map((m) => m.name) };
    } else if (symbol.flags & ts.SymbolFlags.Variable) {
      entry = {
        kind: 'const',
        type: typeText(checker, checker.getTypeOfSymbolAtLocation(symbol, decl), decl),
      };
    }
    surface[exported.name] = entry;
  }
  return Object.fromEntries(Object.entries(surface).sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * Documented defaults: the VALUES of exported DEFAULT_* constants, read from the built ESM so a
 * changed default fails the guard even though its declared type (`number`, `string`) is unchanged.
 */
function describeDefaults(fesmPath) {
  const script = `
    await import('@angular/compiler'); // JIT fallback so partially compiled Angular libs can load in Node
    const m = await import(${JSON.stringify(require('url').pathToFileURL(fesmPath).href)});
    const out = {};
    for (const [k, v] of Object.entries(m).sort(([a], [b]) => a.localeCompare(b))) {
      if (!/^DEFAULT_/.test(k)) continue;
      try { out[k] = JSON.parse(JSON.stringify(v)); } catch { out[k] = '[unserializable]'; }
    }
    process.stdout.write(JSON.stringify(out));`;
  return JSON.parse(
    execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    }),
  );
}

function describePackage(name) {
  const { dts, fesm } = PACKAGES[name];
  return {
    exports: describeExports(path.join(ROOT, dts)),
    defaults: describeDefaults(path.join(ROOT, fesm)),
  };
}

function snapshotPath(name, dir = SNAPSHOT_DIR) {
  return path.join(dir, `${name}.json`);
}

/**
 * Structural diff of two JSON values into readable, path-addressed changes. A removed or changed
 * entry is BREAKING for consumers (it can invalidate a template, a call or a type); an added one is
 * additive. The guard still fails on additive drift so the snapshot is updated on purpose.
 */
function diffValues(before, after, at, out) {
  if (JSON.stringify(before) === JSON.stringify(after)) return;
  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  if (isObj(before) && isObj(after)) {
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      const here = at ? `${at}.${key}` : key;
      if (!(key in after))
        out.push({ severity: 'breaking', change: 'removed', at: here, before: before[key] });
      else if (!(key in before))
        out.push({ severity: 'additive', change: 'added', at: here, after: after[key] });
      else diffValues(before[key], after[key], here, out);
    }
    return;
  }
  out.push({ severity: 'breaking', change: 'changed', at, before, after });
}

function compareSurface(expected, actual) {
  const changes = [];
  diffValues(expected, actual, '', changes);
  return changes;
}

const short = (v) => {
  const t = typeof v === 'string' ? v : JSON.stringify(v);
  return t.length > 140 ? `${t.slice(0, 137)}...` : t;
};

function formatChanges(name, changes) {
  const lines = [];
  for (const sev of ['breaking', 'additive']) {
    const group = changes.filter((c) => c.severity === sev);
    if (!group.length) continue;
    lines.push(`${name}: ${group.length} ${sev.toUpperCase()} change(s)`);
    for (const c of group.slice(0, 60)) {
      if (c.change === 'removed') lines.push(`    - removed  ${c.at}   (was ${short(c.before)})`);
      else if (c.change === 'added') lines.push(`    + added    ${c.at}   (${short(c.after)})`);
      else
        lines.push(
          `    ~ changed  ${c.at}\n        was: ${short(c.before)}\n        now: ${short(c.after)}`,
        );
    }
    if (group.length > 60) lines.push(`    … ${group.length - 60} more`);
  }
  return lines.join('\n');
}

/**
 * @param {{update?:boolean, baselineDir?:string}} options `baselineDir` compares against another
 * snapshot directory (for example the snapshots of the last published release) instead of the
 * committed ones, and never writes.
 */
function checkApiSurface({ update = false, baselineDir } = {}) {
  const problems = [];
  const dir = baselineDir ? path.resolve(baselineDir) : SNAPSHOT_DIR;
  for (const name of Object.keys(PACKAGES)) {
    const actual = describePackage(name);
    const file = snapshotPath(name, dir);
    if (update && !baselineDir) {
      fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(actual, null, 2) + '\n');
      // Keep the committed snapshot prettier-clean so `pnpm format:check` stays green.
      execFileSync('npx', ['prettier', '--write', file], { cwd: ROOT, stdio: 'ignore' });
      console.log(
        `✓ Updated ${path.relative(ROOT, file)} (${Object.keys(actual.exports).length} exports)`,
      );
      continue;
    }
    if (!fs.existsSync(file)) {
      problems.push(`${name}: missing API snapshot ${path.relative(ROOT, file)}`);
      continue;
    }
    const expected = JSON.parse(fs.readFileSync(file, 'utf8'));
    const changes = compareSurface(expected, actual);
    if (changes.length) problems.push(formatChanges(name, changes));
  }
  if (problems.length) {
    throw new Error(
      `Public API drifted from ${path.relative(ROOT, dir)}:\n${problems.join('\n')}\n` +
        'If intentional, run `node scripts/api-guard.js --update`, review the snapshot diff and follow the freeze policy in docs/api/FREEZE_POLICY.md.',
    );
  }
  if (!update) console.log(`✓ Public API surface matches ${path.relative(ROOT, dir)}`);
}

module.exports = { checkApiSurface, compareSurface, formatChanges };

if (require.main === module) {
  try {
    const baseline = process.argv.indexOf('--baseline');
    checkApiSurface({
      update: process.argv.includes('--update'),
      baselineDir: baseline === -1 ? undefined : process.argv[baseline + 1],
    });
  } catch (error) {
    console.error(`\n✗ ${error.message}\n`);
    process.exit(1);
  }
}
