const fs = require('fs');
const path = require('path');
const { REGISTRY } = require('../registry');

// Core and Primitives are two separate real packages (@quartz-headless/core,
// @quartz-headless/primitives) — each registry entry's `files` are relative to its own
// package's src/, chosen here by `entry.layer`.
const LAYER_ROOTS = {
  core: path.resolve(__dirname, '../../packages/core/src'),
  primitives: path.resolve(__dirname, '../../packages/primitives/src'),
};

/**
 * Exit codes (stable, documented in docs/guides/cli.md):
 *   0 success · 2 usage error · 3 unknown component · 4 destination conflict ·
 *   5 registry/source file missing · 6 filesystem error (installation rolled back)
 */
const EXIT = { OK: 0, USAGE: 2, UNKNOWN_COMPONENT: 3, CONFLICT: 4, SOURCE_MISSING: 5, IO: 6 };

class CliError extends Error {
  constructor(code, exitCode, message) {
    super(message);
    this.name = 'CliError';
    this.code = code;
    this.exitCode = exitCode;
  }
}

function resolveOutputDir(cwd, outFlag) {
  if (outFlag) return path.resolve(cwd, outFlag);
  // Auto-detect Angular project structure
  const candidates = [
    path.join(cwd, 'src/lib/components'),
    path.join(cwd, 'src/app/lib/components'),
    path.join(cwd, 'src/app/components'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.join(cwd, 'src/lib/components');
}

// Matches cross-component relative imports like `from '../overlay'` — the leading `../`
// means a sibling component folder in the copied output. Only Core components still have
// these (internal cross-imports within Core, e.g. overlay -> dismiss); Primitives depend on
// Core via the real `@quartz-headless/core` package import (a bare specifier, which this
// regex does not match), declared as `peerDeps` instead of copied.
const CROSS_IMPORT_RE = /from\s+['"]\.\.\/([^'"/]+)/g;

function siblingComponentsReferenced(fileContent) {
  const names = new Set();
  CROSS_IMPORT_RE.lastIndex = 0;
  let match;
  while ((match = CROSS_IMPORT_RE.exec(fileContent)) !== null) names.add(match[1]);
  return names;
}

function levenshtein(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

function suggest(name) {
  return Object.keys(REGISTRY)
    .filter((n) => !REGISTRY[n].internal)
    .map((n) => ({ n, d: levenshtein(name, n) }))
    .filter(({ n, d }) => d <= 2 || n.includes(name) || name.includes(n))
    .sort((x, y) => x.d - y.d)
    .slice(0, 3)
    .map(({ n }) => n);
}

/**
 * Builds the complete installation plan WITHOUT touching the filesystem. Everything that can fail
 * predictably (unknown component, missing source, conflicting destination) fails here, so a
 * failed `add` never leaves a half-copied tree behind.
 */
function planInstall(requested, { outputDir, force }) {
  const names = requested.map((name) => REGISTRY[name]?.alias ?? name);

  const unknown = [...new Set(names.filter((n) => !REGISTRY[n] || REGISTRY[n].internal))];
  if (unknown.length) {
    const hints = unknown.map((n) => {
      const close = suggest(n);
      return `  "${n}"${close.length ? ` — did you mean ${close.map((c) => `"${c}"`).join(', ')}?` : ''}`;
    });
    throw new CliError(
      'E_UNKNOWN_COMPONENT',
      EXIT.UNKNOWN_COMPONENT,
      `Unknown component${unknown.length > 1 ? 's' : ''}:\n${hints.join('\n')}\nRun "quartz list" to see what is available.`,
    );
  }

  // Transitive registry deps, dependencies first, deterministic order.
  const ordered = [];
  const seen = new Set();
  const visit = (name) => {
    if (seen.has(name)) return;
    seen.add(name);
    for (const dep of REGISTRY[name].deps ?? []) visit(REGISTRY[dep]?.alias ?? dep);
    ordered.push(name);
  };
  names.forEach(visit);

  // Safety net: a source file may import a sibling folder the registry `deps` forgot. Scan the
  // real sources (not the output) until the set is closed.
  const warnings = [];
  const warned = new Set();
  for (let i = 0; i < ordered.length; i++) {
    const name = ordered[i];
    const entry = REGISTRY[name];
    if (entry.soon) continue;
    for (const relFile of entry.files) {
      const src = path.join(LAYER_ROOTS[entry.layer], relFile);
      if (!relFile.endsWith('.ts') || !fs.existsSync(src)) continue;
      for (const ref of siblingComponentsReferenced(fs.readFileSync(src, 'utf8'))) {
        if (seen.has(ref)) continue;
        if (!REGISTRY[ref]) {
          if (!warned.has(`${name}:${ref}`)) {
            warned.add(`${name}:${ref}`);
            warnings.push(
              `${name}/${path.basename(relFile)} imports "../${ref}" — no such component in the registry`,
            );
          }
          continue;
        }
        seen.add(ref);
        ordered.push(ref);
        warnings.push(`${ref} — pulled in automatically (required by ${name})`);
      }
    }
  }

  const files = [];
  const soon = [];
  const missing = [];
  for (const name of ordered) {
    const entry = REGISTRY[name];
    if (entry.soon) {
      soon.push(name);
      continue;
    }
    for (const relFile of entry.files) {
      const src = path.join(LAYER_ROOTS[entry.layer], relFile);
      if (!fs.existsSync(src)) {
        missing.push(`${name}: ${relFile}`);
        continue;
      }
      files.push({
        component: name,
        src,
        dest: path.join(outputDir, name, path.basename(relFile)),
        content: fs.readFileSync(src),
      });
    }
  }
  if (missing.length) {
    throw new CliError(
      'E_SOURCE_MISSING',
      EXIT.SOURCE_MISSING,
      `Registry points at source files that do not exist (nothing was written):\n  ${missing.join('\n  ')}`,
    );
  }

  const conflicts = [];
  for (const file of files) {
    let stat;
    try {
      stat = fs.statSync(file.dest);
    } catch {
      file.state = 'create';
      continue;
    }
    if (!stat.isFile()) {
      throw new CliError(
        'E_DESTINATION_NOT_FILE',
        EXIT.CONFLICT,
        `Destination exists and is not a file: ${file.dest}`,
      );
    }
    if (fs.readFileSync(file.dest).equals(file.content)) file.state = 'unchanged';
    else if (force) file.state = 'overwrite';
    else {
      file.state = 'conflict';
      conflicts.push(file.dest);
    }
  }
  if (conflicts.length) {
    throw new CliError(
      'E_CONFLICT',
      EXIT.CONFLICT,
      `Refusing to overwrite ${conflicts.length} modified file(s) (nothing was written):\n  ${conflicts
        .map((c) => path.relative(process.cwd(), c) || c)
        .join(
          '\n  ',
        )}\nKeep your edits, or re-run with --force to replace them with the Quartz source.`,
    );
  }

  return { ordered, files, soon, warnings };
}

/** Writes the plan; on any failure restores the previous state so the tree is never half-copied. */
function applyPlan(files) {
  const createdFiles = [];
  const createdDirs = [];
  const backups = [];
  try {
    for (const file of files) {
      if (file.state === 'unchanged') continue;
      const dir = path.dirname(file.dest);
      if (!fs.existsSync(dir)) {
        // mkdir -p, remembering which directories we introduced so rollback can remove them.
        const toCreate = [];
        for (let d = dir; !fs.existsSync(d); d = path.dirname(d)) toCreate.unshift(d);
        fs.mkdirSync(dir, { recursive: true });
        createdDirs.push(...toCreate);
      }
      const tmp = `${file.dest}.quartz-tmp-${process.pid}`;
      fs.writeFileSync(tmp, file.content);
      if (file.state === 'overwrite')
        backups.push({ dest: file.dest, content: fs.readFileSync(file.dest) });
      else createdFiles.push(file.dest);
      fs.renameSync(tmp, file.dest);
    }
  } catch (error) {
    for (const file of files) {
      try {
        fs.rmSync(`${file.dest}.quartz-tmp-${process.pid}`, { force: true });
      } catch {
        /* best effort */
      }
    }
    for (const f of createdFiles) fs.rmSync(f, { force: true });
    for (const b of backups) fs.writeFileSync(b.dest, b.content);
    for (const d of createdDirs.reverse()) {
      try {
        fs.rmdirSync(d);
      } catch {
        /* not empty or already gone */
      }
    }
    throw new CliError(
      'E_IO',
      EXIT.IO,
      `Could not write files (${error.code ?? error.message}); the installation was rolled back.`,
    );
  }
}

function add(
  components,
  { output, verbose, force = false, dryRun = false, cwd = process.cwd() } = {},
) {
  if (!components.length) {
    const lines = ['Usage: quartz add <component> [component2 ...]', '', 'Available components:'];
    for (const [name, entry] of Object.entries(REGISTRY)) {
      if (!entry.internal) lines.push(`  ${name.padEnd(14)} ${entry.description}`);
    }
    throw new CliError('E_USAGE', EXIT.USAGE, lines.join('\n'));
  }

  const outputDir = resolveOutputDir(cwd, output);
  const plan = planInstall(components, { outputDir, force });

  console.log(
    `\nQuartz UI — ${dryRun ? 'would add' : 'adding'} ${plan.ordered.join(', ')} to ${outputDir}\n`,
  );
  for (const w of plan.warnings) console.log(w.includes('pulled in') ? `＋  ${w}` : `  ⚠  ${w}`);

  if (!dryRun) applyPlan(plan.files);

  for (const name of plan.ordered) {
    const entry = REGISTRY[name];
    if (entry.soon) {
      console.log(`⏳  ${name} — not yet available (coming soon)`);
      continue;
    }
    console.log(`→  ${name}`);
    const mine = plan.files.filter((f) => f.component === name);
    const unchanged = mine.filter((f) => f.state === 'unchanged').length;
    const overwritten = mine.filter((f) => f.state === 'overwrite').length;
    const written = mine.length - unchanged;
    console.log(
      `   ${dryRun ? 'Would copy' : 'Copied'} ${written} file(s)${unchanged ? `, ${unchanged} already up to date` : ''}${overwritten ? `, ${overwritten} overwritten (--force)` : ''} → ${path.relative(cwd, path.join(outputDir, name))}`,
    );
    if (verbose)
      for (const f of mine)
        console.log(`  ${f.state === 'unchanged' ? '=' : '✓'}  ${path.basename(f.dest)}`);
    if (entry.docs) console.log(`   Docs: ${entry.docs}`);
    if (entry.peerDeps?.length) console.log(`   Requires: npm install ${entry.peerDeps.join(' ')}`);
    console.log('');
  }

  console.log(
    'Done! Components are unstyled — add your own styles or wrap with your design system.',
  );
  return { outputDir, plan };
}

module.exports = { add, planInstall, CliError, EXIT };
