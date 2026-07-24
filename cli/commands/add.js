const fs = require('fs');
const path = require('path');
const { REGISTRY } = require('../registry');

const QUARTZ_LIB_ROOT = path.resolve(__dirname, '../../packages/quartz/src/lib');

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

// Matches cross-component relative imports like `from '../overlay'` or
// `from '../overlay/overlay-position'` — the leading `../` means a sibling
// component folder in the copied output.
const CROSS_IMPORT_RE = /from\s+['"]\.\.\/([^'"/]+)/g;

function siblingComponentsReferenced(fileContent) {
  const names = new Set();
  let match;
  while ((match = CROSS_IMPORT_RE.exec(fileContent)) !== null) {
    names.add(match[1]);
  }
  return names;
}

/**
 * Guarantees every cross-component `../x` import in the copied files resolves.
 * Declared `deps` in the registry normally cover this, but scanning the actual
 * source keeps the output compilable even if a `deps` entry drifts out of sync
 * — and surfaces a clear warning when an import points at something unknown.
 */
function ensureCrossImportsResolved(outputDir, done, verbose) {
  const warned = new Set();
  let changed = true;
  while (changed) {
    changed = false;
    for (const name of [...done]) {
      const dir = path.join(outputDir, name);
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith('.ts')) continue;
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        for (const ref of siblingComponentsReferenced(content)) {
          if (done.has(ref)) continue;
          const entry = REGISTRY[ref];
          if (!entry) {
            if (!warned.has(ref)) {
              console.warn(`  ⚠  ${name}/${file} imports "../${ref}" — no such component in the registry`);
              warned.add(ref);
            }
            continue;
          }
          console.log(`＋  ${ref} — pulled in automatically (required by ${name})`);
          copyFiles(ref, entry, outputDir, verbose);
          done.add(ref);
          changed = true;
        }
      }
    }
  }
}

function copyFiles(component, entry, outputDir, verbose) {
  const destDir = path.join(outputDir, component);
  fs.mkdirSync(destDir, { recursive: true });

  const copied = [];
  for (const relFile of entry.files) {
    const src = path.join(QUARTZ_LIB_ROOT, relFile);
    if (!fs.existsSync(src)) {
      console.warn(`  ⚠  Source not found: ${src}`);
      continue;
    }
    const fileName = path.basename(relFile);
    const dest = path.join(destDir, fileName);
    fs.copyFileSync(src, dest);
    copied.push(fileName);
    if (verbose) console.log(`  ✓  ${fileName}`);
  }
  return { destDir, copied };
}

function add(components, { output, verbose, cwd = process.cwd() } = {}) {
  if (!components.length) {
    console.error('Usage: quartz add <component> [component2 ...]');
    console.error('\nAvailable components:');
    for (const [name, entry] of Object.entries(REGISTRY)) {
      console.error(`  ${name.padEnd(14)} ${entry.description}`);
    }
    process.exit(1);
  }

  const outputDir = resolveOutputDir(cwd, output);
  const queue = [...new Set(components)];
  const done = new Set();

  // Resolve transitive deps
  function enqueue(name) {
    if (done.has(name)) return;
    const entry = REGISTRY[name];
    if (!entry) {
      console.error(`✗  Unknown component: "${name}"`);
      process.exit(1);
    }
    if (entry.deps) entry.deps.forEach(enqueue);
    queue.push(name);
  }
  components.forEach(enqueue);

  const ordered = [...new Set(queue)];
  console.log(`\nQuartz UI — adding ${ordered.join(', ')} to ${outputDir}\n`);

  for (const name of ordered) {
    if (done.has(name)) continue;
    const entry = REGISTRY[name];
    if (entry.soon) {
      console.log(`⏳  ${name} — not yet available (coming soon)`);
      done.add(name);
      continue;
    }
    console.log(`→  ${name}`);

    const { destDir, copied } = copyFiles(name, entry, outputDir, verbose);
    done.add(name);

    console.log(`   Copied ${copied.length} file(s) → ${path.relative(cwd, destDir)}`);
    if (entry.docs) console.log(`   Docs: ${entry.docs}`);

    if (entry.peerDeps?.length) {
      console.log(`   Peer deps needed: ${entry.peerDeps.join(', ')}`);
    }
    console.log('');
  }

  // Safety net: make sure every cross-component import in the copied files
  // resolves to a sibling folder that was actually copied.
  ensureCrossImportsResolved(outputDir, done, verbose);

  console.log('Done! Components are unstyled — add your own styles or wrap with your design system.');
}

module.exports = { add };
