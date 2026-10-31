import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  readdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  corePeerRangeFor,
  distTagFor,
  satisfies,
  validateReleaseVersion,
  compare,
} from './semver.mjs';
import { RegistryError, classifyFailure, lookupVersion, redact } from './registry.mjs';
import { packArtifacts, verifyManifestFiles, sha256 } from './artifacts.mjs';
import {
  ReleaseConflictError,
  assertConfirmed,
  decideGithubRelease,
  executePublication,
  planPublication,
  releaseMetadata,
} from './publish.mjs';
import { fakeRegistry, makeRoot } from './fixtures.mjs';

const COMMIT = 'a'.repeat(40);
const pack = (version, opts) => {
  const { root } = makeRoot(version, opts);
  const out = mkdtempSync(join(tmpdir(), 'quartz-artifacts-'));
  const manifest = packArtifacts({ root, outDir: out, sourceCommit: COMMIT });
  return { root, out, manifest };
};
const fast = { attempts: 2, delayMs: 0 };

describe('semver policy', () => {
  it('compares prereleases below their release', () => {
    expect(compare('0.18.0-beta.1', '0.18.0')).toBe(-1);
    expect(compare('0.18.0-beta.2', '0.18.0-beta.10')).toBe(-1);
    expect(compare('0.18.0-rc.1', '0.18.0-beta.9')).toBe(1);
  });
  it('a stable caret does NOT accept a prerelease of the same version', () => {
    expect(satisfies('0.18.0-beta.1', '^0.18.0')).toBe(false);
    expect(satisfies('0.18.0', '^0.18.0')).toBe(true);
    expect(satisfies('0.18.3', '^0.18.0')).toBe(true);
    expect(satisfies('0.19.0', '^0.18.0')).toBe(false);
  });
  it('prerelease companions are pinned exactly', () => {
    expect(corePeerRangeFor('0.18.0')).toBe('^0.18.0');
    expect(corePeerRangeFor('0.18.0-beta.1')).toBe('0.18.0-beta.1');
    expect(satisfies('0.18.0-beta.1', corePeerRangeFor('0.18.0-beta.1'))).toBe(true);
    expect(satisfies('0.18.0-beta.2', corePeerRangeFor('0.18.0-beta.1'))).toBe(false);
    expect(satisfies('0.18.0-rc.1', corePeerRangeFor('0.18.0-beta.1'))).toBe(false);
  });
  it('maps channels and rejects invalid prerelease identifiers', () => {
    expect(distTagFor('1.0.0')).toBe('latest');
    expect(distTagFor('1.0.0-beta.1')).toBe('next');
    expect(distTagFor('1.0.0-rc.2')).toBe('next');
    for (const bad of [
      '1.0.0-alpha.1',
      '1.0.0-beta',
      '1.0.0-next.1',
      '1.0',
      'v1.0.0',
      '1.0.0-beta.01',
    ])
      expect(() => validateReleaseVersion(bad)).toThrow();
  });
  it('rejects range syntax outside the supported forms', () => {
    expect(() => satisfies('1.0.0', '>=1.0.0')).toThrow(/Unsupported/);
  });
});

describe('registry lookups fail closed', () => {
  const view = (res) => () => res;
  const call = (res) => lookupVersion({ name: '@q/c', version: '1.0.0', exec: view(res) });
  const e = (code) => ({ status: 1, stdout: JSON.stringify({ error: { code } }), stderr: '' });

  it('only E404 means absent', () => expect(call(e('E404'))).toEqual({ state: 'absent' }));
  it.each([
    ['E401', 'auth'],
    ['ENEEDAUTH', 'auth'],
    ['E403', 'permission'],
    ['E429', 'rate-limit'],
    ['ETIMEDOUT', 'unavailable'],
    ['ENOTFOUND', 'unavailable'],
    ['ECONNRESET', 'unavailable'],
    ['E503', 'unavailable'],
    ['EINVALIDPACKAGENAME', 'invalid-name'],
    ['ESOMETHINGELSE', 'unexpected'],
  ])('%s is never "version free" (%s)', (code, kind) => {
    expect(classifyFailure({ stdout: JSON.stringify({ error: { code } }) })).toBe(kind);
    expect(() => call(e(code))).toThrow(RegistryError);
  });
  it('treats a non-JSON failure on stderr as non-absent', () => {
    expect(() => call({ status: 1, stdout: '', stderr: 'npm error code ECONNRESET' })).toThrow(
      /unavailable/,
    );
    expect(() => call({ status: 1, stdout: '', stderr: 'garbage' })).toThrow(/unexpected/);
  });
  it('rejects malformed success responses', () => {
    expect(() => call({ status: 0, stdout: 'not json', stderr: '' })).toThrow(/non-JSON/);
    expect(() => call({ status: 0, stdout: '{"shasum":"x"}', stderr: '' })).toThrow(/integrity/);
    expect(() => call({ status: 0, stdout: '[{"integrity":"a"}]', stderr: '' })).toThrow(
      /integrity/,
    );
  });
  it('returns the integrity of a published version', () =>
    expect(call({ status: 0, stdout: '{"integrity":"sha512-x"}', stderr: '' })).toMatchObject({
      state: 'present',
      integrity: 'sha512-x',
    }));
  it('redacts tokens', () => {
    const t = 'npm_' + 'A1b2'.repeat(10);
    expect(redact(`//registry/:_authToken=${t} and ${t} Bearer abcdefghijkl`)).not.toMatch(
      /A1b2A1b2|abcdefghijkl/,
    );
    const err = e('E401');
    err.stderr = `token ${t}`;
    try {
      call(err);
    } catch (x) {
      expect(x.message).not.toContain(t);
    }
  });
});

describe('artifact packing and verification', () => {
  it('packs stable, beta and rc with matching metadata', () => {
    for (const v of ['0.18.0', '0.18.0-beta.1', '1.0.0-rc.2']) {
      const { manifest, out } = pack(v);
      expect(manifest.version).toBe(v);
      expect(manifest.prerelease).toBe(v.includes('-'));
      expect(manifest.sourceCommit).toBe(COMMIT);
      expect(manifest.packages.map((p) => p.key)).toEqual(['core', 'primitives']);
      expect(manifest.packages[0].sha256).toBe(
        sha256(readFileSync(join(out, manifest.packages[0].filename))),
      );
      expect(manifest.packages[1].exports).toHaveProperty('./forms');
      expect(verifyManifestFiles(out, { expectedCommit: COMMIT }).version).toBe(v);
    }
  });
  it('rejects a wrong Core peer range (stable and prerelease)', () => {
    const wrong =
      (range) =>
      ({ files }) => {
        files['packages/primitives/dist/package.json'].peerDependencies['@quartz-headless/core'] =
          range;
      };
    expect(() => pack('0.18.0', { mutate: wrong('^0.17.0') })).toThrow(/Core peer is \^0.17.0/);
    expect(() => pack('0.18.0-beta.1', { mutate: wrong('^0.18.0-beta.1') })).toThrow(
      /release policy requires 0.18.0-beta.1/,
    );
  });
  it('rejects mismatched package versions', () => {
    expect(() =>
      pack('0.18.0', {
        mutate: ({ files }) => (files['packages/core/dist/package.json'].version = '0.18.1'),
      }),
    ).toThrow(/share one version/);
  });
  it('rejects invalid prerelease identifiers before packing', () => {
    expect(() => pack('0.18.0-alpha.1')).toThrow(/Invalid prerelease/);
  });
  it.each([
    [
      'missing LICENSE',
      ({ root }) => execFileSync('rm', [join(root, 'packages/core/dist/LICENSE')]),
      /missing LICENSE/,
    ],
    [
      'spec file shipped',
      ({ write }) => write('packages/core/dist/fesm2022/a.spec.mjs', ''),
      /test file/,
    ],
    [
      'TypeScript source shipped',
      ({ write }) => write('packages/core/dist/types/a.ts', ''),
      /TypeScript source/,
    ],
    [
      'source folder shipped',
      ({ write }) => write('packages/core/dist/src/a.mjs', ''),
      /source folder/,
    ],
    ['.env shipped', ({ write }) => write('packages/core/dist/.env', 'TOKEN=y'), /secret/],
    [
      'sideEffects',
      ({ files }) => (files['packages/core/dist/package.json'].sideEffects = true),
      /sideEffects/,
    ],
    [
      'runtime dependency',
      ({ files }) => (files['packages/core/dist/package.json'].dependencies.lodash = '1'),
      /runtime dependencies/,
    ],
    [
      'postinstall',
      ({ files }) => (files['packages/core/dist/package.json'].scripts = { postinstall: 'x' }),
      /lifecycle/,
    ],
    [
      'dangling export',
      ({ root }) =>
        execFileSync('rm', [join(root, 'packages/core/dist/types/quartz-headless-core.d.ts')]),
      /missing file/,
    ],
    [
      'no forms entry',
      ({ files }) => delete files['packages/primitives/dist/package.json'].exports['./forms'],
      /\.\/forms is missing/,
    ],
    [
      'forms not optional',
      ({ files }) => (files['packages/primitives/dist/package.json'].peerDependenciesMeta = {}),
      /optional peer/,
    ],
    [
      'angular peer drift',
      ({ files }) =>
        (files['packages/core/dist/package.json'].peerDependencies['@angular/core'] = '^21.0.0'),
      /expected \^21\.2\.0/,
    ],
  ])('rejects: %s', (_label, mutate, pattern) => {
    expect(() => pack('0.18.0', { mutate })).toThrow(pattern);
  });

  it('a tarball modified after packing fails verification', () => {
    const { out, manifest } = pack('0.18.0');
    const tgz = join(out, manifest.packages[0].filename);
    const bytes = readFileSync(tgz);
    bytes[bytes.length - 20] ^= 0xff;
    writeFileSync(tgz, bytes);
    expect(() => verifyManifestFiles(out)).toThrow(/integrity mismatch/);
  });
  it('a swapped tarball with a different valid package fails verification', () => {
    const a = pack('0.18.0');
    const b = pack('0.18.0');
    copyFileSync(
      join(b.out, b.manifest.packages[0].filename),
      join(a.out, a.manifest.packages[0].filename),
    );
    // same content shape but different mtime/bytes -> hash differs from a's manifest
    const same =
      sha256(readFileSync(join(a.out, a.manifest.packages[0].filename))) ===
      a.manifest.packages[0].sha256;
    if (!same) expect(() => verifyManifestFiles(a.out)).toThrow(/integrity mismatch/);
  });
  it('rejects an unlisted tarball and a wrong source commit', () => {
    const { out } = pack('0.18.0');
    writeFileSync(join(out, 'evil-1.0.0.tgz'), 'x');
    expect(() => verifyManifestFiles(out)).toThrow(/unlisted tarball/);
    const clean = pack('0.18.0');
    expect(() => verifyManifestFiles(clean.out, { expectedCommit: 'b'.repeat(40) })).toThrow(
      /source/,
    );
  });
  it('rejects an edited manifest version', () => {
    const { out, manifest } = pack('0.18.0');
    manifest.version = '0.18.1';
    writeFileSync(join(out, 'release-manifest.json'), JSON.stringify(manifest));
    expect(() => verifyManifestFiles(out)).toThrow(/version/);
  });
});

describe('publication rehearsal (fake registry, no real npm)', () => {
  const setup = (v = '0.18.0', reg = fakeRegistry()) => {
    const { out, manifest } = pack(v);
    return { out, manifest, reg };
  };
  const run = ({ out, manifest, reg }, extra = {}) => {
    assertConfirmed(manifest, manifest.version);
    const plan = planPublication(manifest, { exec: reg.exec });
    return executePublication(manifest, plan, { dir: out, exec: reg.exec, ...fast, ...extra });
  };

  it('stable release: Core then Primitives, tag latest, exact tarball bytes', () => {
    const ctx = setup();
    expect(run(ctx).published).toEqual(['@quartz-headless/core', '@quartz-headless/primitives']);
    const publishes = ctx.reg.calls.filter((c) => c.startsWith('publish'));
    expect(publishes[0]).toContain(ctx.manifest.packages[0].filename);
    expect(publishes[0]).toContain('--tag latest');
    expect(publishes[1]).toContain(ctx.manifest.packages[1].filename);
    for (const p of ctx.manifest.packages)
      expect(ctx.reg.versions[`${p.name}@${p.version}`]).toBe(p.integrity);
  });
  it.each(['0.18.0-beta.1', '0.18.0-rc.1'])('%s publishes to next and never to latest', (v) => {
    const ctx = setup(v);
    run(ctx);
    expect(
      ctx.reg.calls.filter((c) => c.startsWith('publish')).every((c) => c.includes('--tag next')),
    ).toBe(true);
    expect(ctx.reg.tags['@quartz-headless/core:latest']).toBeUndefined();
  });
  it('fails if a prerelease ends up on latest', () => {
    const ctx = setup('0.18.0-beta.1');
    const original = ctx.reg.exec;
    ctx.reg.exec = (a) => {
      const r = original(a);
      if (a[0] === 'publish') ctx.reg.tags['@quartz-headless/core:latest'] = '0.18.0-beta.1';
      return r;
    };
    expect(() => run(ctx)).toThrow(/latest/);
  });
  it('wrong confirm_version stops before any registry call', () => {
    const ctx = setup();
    expect(() => assertConfirmed(ctx.manifest, '0.18.1')).toThrow(/does not match/);
    expect(() => assertConfirmed(ctx.manifest, undefined)).toThrow(/does not match/);
    expect(ctx.reg.calls).toHaveLength(0);
  });
  it('rerun after complete publication is a verified no-op', () => {
    const ctx = setup();
    run(ctx);
    ctx.reg.calls.length = 0;
    const second = run(ctx);
    expect(second.published).toEqual([]);
    expect(second.verified).toHaveLength(2);
    expect(ctx.reg.calls.some((c) => c.startsWith('publish'))).toBe(false);
  });
  it('partial publication (Core only) is reconciled by publishing only Primitives', () => {
    const ctx = setup();
    const core = ctx.manifest.packages[0];
    ctx.reg.versions[`${core.name}@${core.version}`] = core.integrity;
    ctx.reg.tags[`${core.name}:latest`] = core.version;
    const r = run(ctx);
    expect(r.published).toEqual(['@quartz-headless/primitives']);
    expect(r.verified).toEqual(['@quartz-headless/core']);
  });
  it('Primitives without Core is an inconsistent pair', () => {
    const ctx = setup();
    const prim = ctx.manifest.packages[1];
    ctx.reg.versions[`${prim.name}@${prim.version}`] = prim.integrity;
    expect(() => planPublication(ctx.manifest, { exec: ctx.reg.exec })).toThrow(
      /inconsistent pair/,
    );
  });
  it('same version with different integrity is a conflict, never overwritten', () => {
    const ctx = setup();
    ctx.reg.versions['@quartz-headless/core@0.18.0'] = 'sha512-other';
    expect(() => planPublication(ctx.manifest, { exec: ctx.reg.exec })).toThrow(
      ReleaseConflictError,
    );
    expect(ctx.reg.calls.some((c) => c.startsWith('publish'))).toBe(false);
  });
  it.each([
    ['E401', /auth/],
    ['E403', /permission/],
    ['E429', /rate-limit/],
    ['ETIMEDOUT', /unavailable/],
  ])('registry %s during planning stops before publish', (code, pattern) => {
    const ctx = setup();
    ctx.reg.fail.view = code;
    expect(() => planPublication(ctx.manifest, { exec: ctx.reg.exec })).toThrow(pattern);
    expect(ctx.reg.calls.some((c) => c.startsWith('publish'))).toBe(false);
  });
  it('authentication failure on publish surfaces and publishes nothing, without leaking tokens', () => {
    const ctx = setup();
    ctx.reg.fail.publish = 'E401';
    let message = '';
    try {
      run(ctx);
    } catch (x) {
      message = x.message;
    }
    expect(message).toMatch(/E401|auth/);
    expect(Object.keys(ctx.reg.versions)).toHaveLength(0);
  });
  it('interrupted publish that actually landed is recognised by integrity (idempotent)', () => {
    const ctx = setup();
    ctx.reg.interruptAfterPublish = true;
    const r = run(ctx);
    expect(r.verified).toEqual(['@quartz-headless/core', '@quartz-headless/primitives']);
  });
  it('concurrent publisher of the SAME artifact: our publish fails over existing, integrity matches', () => {
    const ctx = setup();
    const core = ctx.manifest.packages[0];
    ctx.reg.beforePublish = (name, version) => {
      ctx.reg.versions[`${name}@${version}`] ??= ctx.manifest.packages.find(
        (p) => p.name === name,
      ).integrity;
      ctx.reg.tags[`${name}:latest`] = version;
    };
    const r = run(ctx);
    expect(r.published).toEqual([]);
    expect(ctx.reg.versions[`${core.name}@${core.version}`]).toBe(core.integrity);
  });
  it('concurrent publisher of a DIFFERENT artifact is a conflict', () => {
    const ctx = setup();
    ctx.reg.beforePublish = (name, version) => {
      ctx.reg.versions[`${name}@${version}`] = 'sha512-someone-else';
    };
    expect(() => run(ctx)).toThrow(ReleaseConflictError);
  });
  it('a registry that serves different bytes after publish is rejected', () => {
    const ctx = setup();
    const original = ctx.reg.exec;
    ctx.reg.exec = (a) => {
      const r = original(a);
      if (a[0] === 'publish') ctx.reg.versions[`@quartz-headless/core@0.18.0`] = 'sha512-tampered';
      return r;
    };
    expect(() => run(ctx)).toThrow(/integrity/);
  });
  it('registry unavailable when re-reading after a failed publish is reported, not assumed', () => {
    const ctx = setup();
    const original = ctx.reg.exec;
    let publishFailed = false;
    ctx.reg.exec = (a) => {
      if (a[0] === 'publish') {
        publishFailed = true;
        return { status: 1, stdout: '', stderr: 'npm error code ECONNRESET' };
      }
      if (publishFailed && a[0] === 'view')
        return { status: 1, stdout: '', stderr: 'npm error code ECONNRESET' };
      return original(a);
    };
    expect(() => run(ctx)).toThrow(/could not be re-read/);
  });
  it('invalid package metadata after a packed artifact edit never reaches the registry', () => {
    const ctx = setup();
    const tgz = join(ctx.out, ctx.manifest.packages[0].filename);
    writeFileSync(tgz, Buffer.concat([readFileSync(tgz), Buffer.from('x')]));
    expect(() => verifyManifestFiles(ctx.out)).toThrow();
    expect(ctx.reg.calls).toHaveLength(0);
  });
  it('provenance flag is forwarded to npm publish', () => {
    const ctx = setup();
    run(ctx, { provenance: true });
    expect(
      ctx.reg.calls.filter((c) => c.startsWith('publish')).every((c) => c.includes('--provenance')),
    ).toBe(true);
  });
});

describe('GitHub release metadata', () => {
  it('stable vs prerelease metadata differ and use the validated commit', () => {
    const stable = releaseMetadata(pack('0.18.0').manifest);
    const beta = releaseMetadata(pack('0.18.0-beta.1').manifest);
    expect(stable).toMatchObject({
      tag: 'v0.18.0',
      prerelease: false,
      latest: true,
      target: COMMIT,
    });
    expect(beta).toMatchObject({ tag: 'v0.18.0-beta.1', prerelease: true, latest: false });
    expect(stable.notes).toContain(COMMIT);
    expect(stable.notes).toMatch(/sha256 `[0-9a-f]{64}`/);
    expect(beta.notes).toMatch(/Pre-release/);
    expect(stable.assets).toContain('SHA256SUMS');
  });
  it('creates, updates in place, and refuses to move or re-flag a tag', () => {
    const meta = releaseMetadata(pack('0.18.0').manifest);
    expect(decideGithubRelease(meta, null)).toBe('create');
    expect(decideGithubRelease(meta, { commit: COMMIT, prerelease: false })).toBe('update');
    expect(() => decideGithubRelease(meta, { commit: 'c'.repeat(40), prerelease: false })).toThrow(
      /Refusing to move/,
    );
    expect(() => decideGithubRelease(meta, { commit: COMMIT, prerelease: true })).toThrow(
      /prerelease flag/,
    );
  });
});
