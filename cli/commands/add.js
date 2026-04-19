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

  console.log('Done! Components are unstyled — add your own styles or wrap with your design system.');
}

module.exports = { add };
