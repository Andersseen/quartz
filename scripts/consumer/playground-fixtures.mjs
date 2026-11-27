#!/usr/bin/env node
/**
 * Strict-AOT playground fixtures for the installed-tarball consumers (0.24).
 *
 * Generates the registered Component examples from the REAL `DOC_PLAYGROUNDS` registry with the
 * repository toolchain (Vite's module runner; no Vitest, no test-name filter), and verifies a
 * generated directory before a consumer compiles it.
 *
 *   node scripts/consumer/playground-fixtures.mjs --out DIR     generate (repository Node only)
 *   node scripts/consumer/playground-fixtures.mjs --verify DIR  re-check hashes + freshness
 *
 * The output directory holds the TypeScript files plus `fixtures-manifest.json`: the sha256 of each
 * file, the variant list and a digest of the playground sources it was generated from. A fixture
 * set generated from other sources (stale), edited after generation, incomplete or carrying extra
 * files fails verification. Output must live outside the repository.
 */
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertRepositoryToolchain } from '../toolchain.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCE_DIR = join(ROOT, 'src/app/docs-playgrounds');
export const FIXTURES_MANIFEST = 'fixtures-manifest.json';
/** 9 families x (default, representative). Changing it is a deliberate, reviewed edit. */
export const EXPECTED_VARIANTS = 18;

const sha256 = (text) => createHash('sha256').update(text).digest('hex');

/** Digest of every non-test source the generators can depend on. */
export function playgroundSourceDigest(dir = SOURCE_DIR) {
  const hash = createHash('sha256');
  for (const name of readdirSync(dir)
    .filter((n) => n.endsWith('.ts') && !n.endsWith('.spec.ts'))
    .sort())
    hash.update(`${name}\0${readFileSync(join(dir, name), 'utf8')}\0`);
  return hash.digest('hex');
}

const insideRepo = (dir) => {
  const real = existsSync(dir) ? realpathSync(dir) : resolve(dir);
  const rel = relative(realpathSync(ROOT), real);
  return rel === '' || (!rel.startsWith('..') && !rel.startsWith(sep) && !/^[A-Za-z]:/.test(rel));
};

/**
 * Playground component modules need the Angular compiler and the primitives; the fixtures only
 * need the registry's code generators. Replace each such module with inert classes named after
 * its own `export class` declarations (derived from the file, not a hand-kept list).
 */
const stubPlaygroundComponents = () => ({
  name: 'quartz-stub-playground-components',
  enforce: 'pre',
  load(id) {
    const file = id.split('?')[0];
    if (!file.startsWith(SOURCE_DIR) || !/-playgrounds?\.ts$/.test(file)) return null;
    const names = [...readFileSync(file, 'utf8').matchAll(/^export class (\w+)/gm)].map(
      (m) => m[1],
    );
    if (!names.length) throw new Error(`${file}: no exported playground components to stub`);
    return names.map((n) => `export class ${n} {}`).join('\n') + '\n';
  },
});

/** Evaluate the real registry + builder with Vite's module runner and return the fixture set. */
export async function buildFromRegistry() {
  assertRepositoryToolchain('Playground fixture generation');
  const { runnerImport } = await import('vite');
  const load = (file) =>
    runnerImport(join(SOURCE_DIR, file), {
      root: ROOT,
      configFile: false,
      logLevel: 'silent',
      plugins: [stubPlaygroundComponents()],
    }).then((r) => r.module);
  const [{ DOC_PLAYGROUNDS }, { buildConsumerFixtures }] = await Promise.all([
    load('registry.ts'),
    load('consumer-fixtures.ts'),
  ]);
  return buildConsumerFixtures(DOC_PLAYGROUNDS);
}

/** Validate a fixture set's shape (shared by generate and verify). */
export function validateFixtureSet(set) {
  const problems = [];
  if (!set || typeof set.files !== 'object' || !Array.isArray(set.variants))
    return ['fixture set has an unexpected shape'];
  if (set.variants.length !== EXPECTED_VARIANTS)
    problems.push(`expected ${EXPECTED_VARIANTS} Component variants, got ${set.variants.length}`);
  if (typeof set.files['index.ts'] !== 'string') problems.push('index.ts is missing');
  for (const v of set.variants) {
    const source = set.files[v.file];
    if (typeof source !== 'string') problems.push(`${v.file} is missing`);
    else if (!source.includes(`export class ${v.className}`))
      problems.push(`${v.file} does not declare ${v.className}`);
    if (!/^[a-z][a-z0-9-]*$/.test(v.selector ?? '')) problems.push(`${v.file}: bad selector`);
  }
  const expectedFiles = new Set(['index.ts', ...set.variants.map((v) => v.file)]);
  for (const name of Object.keys(set.files))
    if (!expectedFiles.has(name)) problems.push(`unexpected generated file ${name}`);
  return problems;
}

export function writeFixtures(set, out, { sourceDigest = playgroundSourceDigest() } = {}) {
  if (insideRepo(out))
    throw new Error(`refusing to write generated fixtures inside the repository: ${out}`);
  const problems = validateFixtureSet(set);
  if (problems.length) throw new Error(`invalid fixture set:\n  - ${problems.join('\n  - ')}`);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const [name, text] of Object.entries(set.files)) writeFileSync(join(out, name), text);
  const manifest = {
    schema: 1,
    generator: 'scripts/consumer/playground-fixtures.mjs',
    node: process.version,
    sourceDigest,
    variants: set.variants,
    files: Object.fromEntries(Object.entries(set.files).map(([n, t]) => [n, sha256(t)])),
  };
  writeFileSync(join(out, FIXTURES_MANIFEST), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

/**
 * Re-verify a generated directory. Throws listing every problem: missing manifest, missing,
 * extra or edited files, wrong variant count, or sources changed since generation (stale).
 */
export function verifyFixtures(dir, { sourceDigest = playgroundSourceDigest() } = {}) {
  const manifestFile = join(dir, FIXTURES_MANIFEST);
  if (!existsSync(manifestFile))
    throw new Error(`playground fixtures missing: ${manifestFile} not found`);
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
  } catch {
    throw new Error(`${FIXTURES_MANIFEST} is not valid JSON`);
  }
  const problems = [];
  if (manifest.schema !== 1 || typeof manifest.files !== 'object' || !manifest.files)
    throw new Error(`${FIXTURES_MANIFEST} has an unexpected shape`);
  if (manifest.sourceDigest !== sourceDigest)
    problems.push(
      'stale fixtures: src/app/docs-playgrounds changed since they were generated; regenerate them',
    );
  const files = {};
  for (const [name, digest] of Object.entries(manifest.files)) {
    const file = join(dir, name);
    if (!existsSync(file)) {
      problems.push(`${name} is listed but missing`);
      continue;
    }
    files[name] = readFileSync(file, 'utf8');
    if (sha256(files[name]) !== digest) problems.push(`${name} changed after generation`);
  }
  for (const name of readdirSync(dir))
    if (name !== FIXTURES_MANIFEST && !(name in manifest.files))
      problems.push(`unlisted file ${name}`);
  problems.push(...validateFixtureSet({ files, variants: manifest.variants }));
  if (problems.length)
    throw new Error(`playground fixtures rejected:\n  - ${[...new Set(problems)].join('\n  - ')}`);
  return manifest;
}

async function main(argv) {
  const at = (name) => {
    const i = argv.indexOf(`--${name}`);
    return i === -1 ? undefined : argv[i + 1];
  };
  if (at('verify')) {
    const m = verifyFixtures(resolve(at('verify')));
    console.log(`✓ ${m.variants.length} playground fixtures verified (sources ${m.sourceDigest})`);
    return;
  }
  const out = at('out');
  if (!out) throw new Error('usage: playground-fixtures.mjs --out DIR | --verify DIR');
  const set = await buildFromRegistry();
  const manifest = writeFixtures(set, resolve(out));
  verifyFixtures(resolve(out));
  console.log(
    `✓ generated ${manifest.variants.length} Component variants from DOC_PLAYGROUNDS on ${process.version} → ${out}`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`\n✗ playground fixtures: ${error.message}\n`);
    process.exit(1);
  });
}
