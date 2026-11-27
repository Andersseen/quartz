import { existsSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertRepositoryToolchain,
  isRepositoryToolchain,
  nodeMatchesSpec,
} from '../toolchain.mjs';
import {
  EXPECTED_VARIANTS,
  FIXTURES_MANIFEST,
  buildFromRegistry,
  playgroundSourceDigest,
  verifyFixtures,
  writeFixtures,
} from './playground-fixtures.mjs';

/**
 * 0.24 regression coverage for the repository-toolchain / consumer-runtime boundary. The weekly
 * matrix failed because repository Vitest was started on the Node 20.19.0 consumer runtime; these
 * tests keep generation on the repository Node and the fixtures honest.
 */
const ROOT = resolve(import.meta.dirname, '../..');
const harness = readFileSync(join(ROOT, 'scripts/consumer/run.mjs'), 'utf8');

describe('repository toolchain policy', () => {
  it.each([
    ['v20.19.0', false],
    ['v20.20.2', false],
    ['v22.11.0', false],
    ['v22.12.0', true],
    ['v22.23.1', true],
    ['v23.11.0', false],
    ['v24.0.0', true],
    ['v26.1.0', true],
  ])('%s is a repository toolchain: %s', (version, ok) => {
    expect(isRepositoryToolchain(version)).toBe(ok);
  });

  it('refuses to run repository tooling on the Node 20 consumer runtime', () => {
    expect(() => assertRepositoryToolchain('Playground fixture generation', 'v20.19.0')).toThrow(
      /repository tooling and must run on Node .*started on v20\.19\.0/,
    );
    expect(() => assertRepositoryToolchain('x', 'v22.23.1')).not.toThrow();
  });

  it('matrix Node specs match exactly or by prefix', () => {
    expect(nodeMatchesSpec('20.19.0', 'v20.19.0')).toBe(true);
    expect(nodeMatchesSpec('20.19.0', 'v20.19.1')).toBe(false);
    expect(nodeMatchesSpec('20.19.0', 'v20.20.2')).toBe(false);
    expect(nodeMatchesSpec('24', 'v24.22.3')).toBe(true);
    expect(nodeMatchesSpec('22', 'v24.22.3')).toBe(false);
    expect(() => nodeMatchesSpec('lts/*', 'v22.1.0')).toThrow();
  });
});

describe('consumer harness keeps tooling off the consumer Node', () => {
  it('never invokes Vitest or a test-name filter to produce fixtures', () => {
    expect(harness).not.toMatch(/vitest/);
    expect(harness).not.toMatch(/'-t'/);
    expect(harness).toMatch(
      /runTooling\(\s*process\.execPath,\s*\[join\(ROOT, 'scripts\/consumer\/playground-fixtures\.mjs'\)/,
    );
  });

  it('asserts its own toolchain and verifies fixtures before the consumer compiles them', () => {
    expect(harness).toContain('assertRepositoryToolchain(');
    expect(harness.indexOf('verifyFixtures(fixturesDir)')).toBeGreaterThan(-1);
    expect(harness.indexOf('verifyFixtures(fixturesDir)')).toBeLessThan(
      harness.indexOf('runConsumer(consumerNode, ngArgs(app)'),
    );
  });

  it('runs every consumer-side command on the consumer Node', () => {
    // npm via the consumer Node's own npm, ng via the consumer install, the SSR server explicitly.
    expect(harness).not.toMatch(/['"]npx['"]/);
    expect(harness).not.toMatch(/spawn\(\s*'node'/);
    expect(harness).toMatch(/spawn\(consumerNode, \['serve\.mjs', 'dist'\]/);
    expect(harness).toMatch(/execFileSync\(consumerNode, ngArgs\(app\)/);
    expect(harness).toMatch(/npm ran on Node v\$\{npmVersions\.node\}/);
    expect(harness).toMatch(/consumer Node is \$\{consumerNodeVersion\}, the matrix cell requires/);
  });
});

describe('playground fixture generation (real DOC_PLAYGROUNDS registry)', () => {
  const fresh = async () => {
    const dir = join(mkdtempSync(join(tmpdir(), 'quartz-fixtures-')), 'out');
    writeFixtures(await buildFromRegistry(), dir);
    return dir;
  };

  it('generates the 18 Component variants deterministically without Vitest', async () => {
    const a = await fresh();
    const b = await fresh();
    const manifest = verifyFixtures(a);
    expect(manifest.variants).toHaveLength(EXPECTED_VARIANTS);
    expect(manifest.sourceDigest).toBe(playgroundSourceDigest());
    for (const name of Object.keys(manifest.files))
      expect(readFileSync(join(a, name), 'utf8')).toBe(readFileSync(join(b, name), 'utf8'));
    expect(readFileSync(join(a, 'slider-default.ts'), 'utf8')).toContain(
      "from '@quartz-headless/primitives'",
    );
  }, 60_000);

  it('rejects missing, edited, extra, incomplete or stale fixtures', async () => {
    const dir = await fresh();
    expect(() => verifyFixtures(dir, { sourceDigest: '0'.repeat(64) })).toThrow(/stale fixtures/);

    const edited = await fresh();
    writeFileSync(join(edited, 'toggle-default.ts'), '// tampered\n', { flag: 'a' });
    expect(() => verifyFixtures(edited)).toThrow(/toggle-default\.ts changed after generation/);

    const extra = await fresh();
    writeFileSync(join(extra, 'sneaky.ts'), 'export {};\n');
    expect(() => verifyFixtures(extra)).toThrow(/unlisted file sneaky\.ts/);

    const removed = await fresh();
    unlinkSync(join(removed, 'select-representative.ts'));
    expect(() => verifyFixtures(removed)).toThrow(
      /select-representative\.ts is listed but missing/,
    );

    const shrunk = await fresh();
    const m = JSON.parse(readFileSync(join(shrunk, FIXTURES_MANIFEST), 'utf8'));
    const dropped = m.variants.pop();
    delete m.files[dropped.file];
    unlinkSync(join(shrunk, dropped.file));
    writeFileSync(join(shrunk, FIXTURES_MANIFEST), JSON.stringify(m));
    expect(() => verifyFixtures(shrunk)).toThrow(/expected 18 Component variants, got 17/);

    const empty = mkdtempSync(join(tmpdir(), 'quartz-fixtures-empty-'));
    expect(() => verifyFixtures(empty)).toThrow(/playground fixtures missing/);
    rmSync(empty, { recursive: true, force: true });
  }, 60_000);

  it('never writes generated fixtures into the repository', async () => {
    const set = await buildFromRegistry();
    const target = join(ROOT, 'consumer/app/src/app/generated-playgrounds');
    expect(() => writeFixtures(set, target)).toThrow(/inside the repository/);
    expect(existsSync(target)).toBe(false);
  }, 60_000);
});
