import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BLOCKED,
  PASS,
  RELEASE_ENVIRONMENT,
  REQUIRED_JOBS,
  WAIVED,
  assertPreflightBinding,
  evaluateRelease,
  inspectRegistry,
  normalizeApprovals,
  normalizeEnvironment,
  parseAcceptanceRecord,
} from './acceptance.mjs';
import { packArtifacts, sha256 } from './artifacts.mjs';
import { fakeRegistry, makeRoot } from './fixtures.mjs';
import { executePublication, planPublication } from './publish.mjs';
import { corePeerRangeFor } from './semver.mjs';

/**
 * 0.24 release acceptance gate rehearsal. Synthetic inputs only: no npm, no GitHub writes. The
 * "valid" fixture models what a genuinely accepted release would look like; every test removes
 * or corrupts ONE piece of it and expects BLOCKED.
 */
const ROOT = resolve(import.meta.dirname, '../..');
const VERSION = '0.18.0';
const COMMIT = 'a'.repeat(40);
const TESTED = 'b'.repeat(40);
const RUN = '4242';
const MAINTAINER = 'release-maintainer';

const { root } = makeRoot(VERSION);
const artifactDir = mkdtempSync(join(tmpdir(), 'quartz-acceptance-'));
const manifest = packArtifacts({ root, outDir: artifactDir, sourceCommit: COMMIT });
const manifestSha256 = sha256(readFileSync(join(artifactDir, 'release-manifest.json')));

const row = (n, page, outcome) =>
  `| ${n}   | NVDA 2026.3 / Firefox 140 | \`${page}\` · Control | steps | expected | heard it | ${outcome} | recording-${n}.mp4 |`;
const matrix = (outcome = () => 'PASS') =>
  [
    '| #   | Browser / SR / versions | Page · control | Steps | Expected | Actual | Outcome | Evidence |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...Array.from({ length: 14 }, (_, i) => row(i + 1, '/forms', outcome(i + 1))),
  ].join('\n');

const executed = (extra = {}) => ({
  status: 'executed',
  testedCommit: TESTED,
  date: '2026-12-01',
  tester: MAINTAINER,
  ...extra,
});
const recordText = (gates, version = VERSION) =>
  `# ${version} acceptance\n\n\`\`\`json release-acceptance\n${JSON.stringify(
    {
      schema: 1,
      version,
      gates: {
        'manual-screen-reader': executed(),
        'autofill-firefox-safari': executed({ scope: ['firefox', 'safari'] }),
        ...gates,
      },
    },
    null,
    2,
  )}\n\`\`\`\n`;

const protectedEnvironment = {
  name: RELEASE_ENVIRONMENT,
  can_admins_bypass: false,
  deployment_branch_policy: { protected_branches: false, custom_branch_policies: true },
  protection_rules: [
    { type: 'branch_policy' },
    {
      type: 'required_reviewers',
      prevent_self_review: false,
      reviewers: [{ type: 'User', reviewer: { login: MAINTAINER } }],
    },
  ],
};
const approvalBy = (login, state = 'approved', env = RELEASE_ENVIRONMENT) =>
  normalizeApprovals(RUN, [{ state, user: { login }, environments: [{ name: env }] }]);

const allJobs = Object.fromEntries(
  [...REQUIRED_JOBS, 'release-acceptance'].map((name) => [name, { result: 'success' }]),
);

/** A fully accepted candidate in publish mode. */
const valid = (over = {}) => ({
  mode: 'publish',
  packages: {
    core: { version: VERSION },
    primitives: {
      version: VERSION,
      peerDependencies: { '@quartz-headless/core': corePeerRangeFor(VERSION) },
    },
  },
  headCommit: COMMIT,
  manifest,
  manifestSha256,
  expected: { version: VERSION, commit: COMMIT, manifestSha256 },
  runId: RUN,
  jobs: allJobs,
  recordPath: `docs/releases/${VERSION}-acceptance.md`,
  recordText: recordText({}),
  matrixText: matrix(),
  git: { isAncestor: () => true, changedPaths: () => [] },
  environment: normalizeEnvironment(protectedEnvironment),
  approvals: approvalBy(MAINTAINER),
  registry: inspectRegistry(manifest, (m) => planPublication(m, { exec: fakeRegistry().exec })),
  ...over,
});
const statusOf = (result, id) => result.checks.find((c) => c.id === id)?.status;
const expectBlocked = (result, id, detail) => {
  expect(result.ok).toBe(false);
  expect(statusOf(result, id), JSON.stringify(result.checks, null, 2)).toBe(BLOCKED);
  if (detail) expect(result.checks.find((c) => c.id === id).detail).toMatch(detail);
};

describe('release acceptance gate (fail closed)', () => {
  it('14. a fully accepted fixture with authentic approval and evidence passes', () => {
    const result = evaluateRelease(valid());
    expect(result.blockers).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.checks.every((c) => c.status === PASS)).toBe(true);
    expect(result.binding).toEqual({
      version: VERSION,
      commit: COMMIT,
      manifestSha256,
      runId: RUN,
    });
  });

  it('1. manual screen-reader review pending → BLOCKED', () => {
    expectBlocked(
      evaluateRelease(
        valid({ recordText: recordText({ 'manual-screen-reader': { status: 'pending' } }) }),
      ),
      'gate:manual-screen-reader',
      /PENDING/,
    );
  });

  it('1b. "executed" claimed while the 0.17 matrix still has PENDING rows → BLOCKED', () => {
    expectBlocked(
      evaluateRelease(valid({ matrixText: matrix((n) => (n === 5 ? 'PENDING' : 'PASS')) })),
      'gate:manual-screen-reader',
      /rows 5 are not PASS/,
    );
  });

  it('2. Autofill scope not accepted (Safari missing) → BLOCKED', () => {
    expectBlocked(
      evaluateRelease(
        valid({
          recordText: recordText({ 'autofill-firefox-safari': executed({ scope: ['firefox'] }) }),
        }),
      ),
      'gate:autofill-firefox-safari',
      /scope not accepted for: safari/,
    );
    expectBlocked(
      evaluateRelease(
        valid({
          recordText: recordText({ 'autofill-firefox-safari': { status: 'pending', scope: [] } }),
        }),
      ),
      'gate:autofill-firefox-safari',
    );
  });

  it('3. missing human approval → BLOCKED (and local/pre-approval modes never grant it)', () => {
    expectBlocked(
      evaluateRelease(valid({ approvals: normalizeApprovals(RUN, []) })),
      'maintainer-approval',
    );
    expectBlocked(evaluateRelease(valid({ approvals: undefined })), 'maintainer-approval');
    expectBlocked(evaluateRelease(valid({ mode: 'local' })), 'maintainer-approval', /not granted/);
    // A committed "approved: true" style field has no effect: approval only comes from the API.
    const forged = recordText({}).replace('"schema": 1', '"schema": 1, "approved": true');
    expectBlocked(
      evaluateRelease(valid({ recordText: forged, approvals: undefined })),
      'maintainer-approval',
    );
  });

  it('3b. approval by a non-reviewer, a rejection, or for another environment → BLOCKED', () => {
    expectBlocked(
      evaluateRelease(valid({ approvals: approvalBy('some-agent-bot') })),
      'maintainer-approval',
    );
    expectBlocked(
      evaluateRelease(valid({ approvals: approvalBy(MAINTAINER, 'rejected') })),
      'maintainer-approval',
    );
    expectBlocked(
      evaluateRelease(valid({ approvals: approvalBy(MAINTAINER, 'approved', 'github-pages') })),
      'maintainer-approval',
    );
  });

  it('4. approval / confirmation for the wrong version → BLOCKED', () => {
    expectBlocked(
      evaluateRelease(valid({ expected: { version: '0.18.1', commit: COMMIT, manifestSha256 } })),
      'versions',
    );
    expectBlocked(
      evaluateRelease(valid({ recordText: recordText({}, '0.17.0') })),
      'acceptance-record',
    );
    const waiver = {
      by: MAINTAINER,
      date: '2026-12-01',
      reason: 'Screen reader unavailable; tracked in #99',
      version: '0.17.0',
    };
    expectBlocked(
      evaluateRelease(
        valid({ recordText: recordText({ 'manual-screen-reader': { status: 'waived', waiver } }) }),
      ),
      'gate:manual-screen-reader',
      /waiver is for version "0.17.0"/,
    );
  });

  it('5. approval for the wrong source commit → BLOCKED', () => {
    expectBlocked(
      evaluateRelease(
        valid({ expected: { version: VERSION, commit: 'c'.repeat(40), manifestSha256 } }),
      ),
      'source-commit',
    );
    expectBlocked(evaluateRelease(valid({ headCommit: 'd'.repeat(40) })), 'source-commit');
    // Manual evidence recorded against a commit that is not an ancestor, or before package changes.
    expectBlocked(
      evaluateRelease(valid({ git: { isAncestor: () => false, changedPaths: () => [] } })),
      'gate:manual-screen-reader',
      /not an ancestor/,
    );
    expectBlocked(
      evaluateRelease(
        valid({ git: { isAncestor: () => true, changedPaths: () => ['packages/core/src/x.ts'] } }),
      ),
      'gate:manual-screen-reader',
      /package sources changed/,
    );
  });

  it('6. approval for different artifacts → BLOCKED', () => {
    expectBlocked(
      evaluateRelease(
        valid({ expected: { version: VERSION, commit: COMMIT, manifestSha256: 'e'.repeat(64) } }),
      ),
      'artifacts',
    );
    // Approvals read for another run are not this run's approval.
    expectBlocked(evaluateRelease(valid({ runId: '9999' })), 'maintainer-approval', /not this run/);
    expectBlocked(
      evaluateRelease(valid({ artifactsError: 'sha256 mismatch for core' })),
      'artifacts',
    );
  });

  it('7. unsigned waiver → BLOCKED; signed waiver counts only with the signer’s approval', () => {
    const waiver = (w) => recordText({ 'manual-screen-reader': { status: 'waived', waiver: w } });
    expectBlocked(
      evaluateRelease(valid({ recordText: waiver({ reason: 'no time', version: VERSION }) })),
      'gate:manual-screen-reader',
      /unsigned or invalid waiver/,
    );
    const signed = {
      by: MAINTAINER,
      date: '2026-12-01',
      reason: 'No screen reader available this cycle; tracked for the next patch.',
      version: VERSION,
    };
    // Signed by someone who did not approve this run's deployment.
    expectBlocked(
      evaluateRelease(valid({ recordText: waiver({ ...signed, by: 'other-person' }) })),
      'gate:manual-screen-reader',
      /did not approve/,
    );
    const ok = evaluateRelease(valid({ recordText: waiver(signed) }));
    expect(statusOf(ok, 'gate:manual-screen-reader')).toBe(WAIVED);
    expect(ok.ok).toBe(true);
    // Before approval the waiver is only "requested", and local mode stays blocked overall.
    const local = evaluateRelease(valid({ mode: 'local', recordText: waiver(signed) }));
    expect(local.checks.find((c) => c.id === 'gate:manual-screen-reader').detail).toMatch(
      /not yet verified/,
    );
    expect(local.ok).toBe(false);
  });

  it('8. malformed evidence → BLOCKED', () => {
    for (const text of [
      undefined,
      'no block here',
      '```json release-acceptance\n{ not json\n```',
      '```json release-acceptance\n{"schema":2,"version":"0.18.0","gates":{}}\n```',
      recordText({}).replace('"autofill-firefox-safari"', '"autofill-other"'),
      recordText({}) + recordText({}),
    ])
      expectBlocked(evaluateRelease(valid({ recordText: text })), 'acceptance-record');
    expectBlocked(
      evaluateRelease(
        valid({
          recordText: recordText({ 'manual-screen-reader': executed({ testedCommit: 'abc' }) }),
        }),
      ),
      'gate:manual-screen-reader',
      /full commit SHA/,
    );
    expectBlocked(
      evaluateRelease(
        valid({ recordText: recordText({ 'manual-screen-reader': { status: 'done' } }) }),
      ),
      'gate:manual-screen-reader',
      /unknown status/,
    );
  });

  it('9. skipped consumer-matrix job → BLOCKED', () => {
    expectBlocked(
      evaluateRelease(valid({ jobs: { ...allJobs, 'consumer-matrix': { result: 'skipped' } } })),
      'ci-jobs',
      /consumer-matrix: skipped/,
    );
    const { ['cli-consumer']: _omitted, ...missing } = allJobs;
    expectBlocked(evaluateRelease(valid({ jobs: missing })), 'ci-jobs', /cli-consumer: missing/);
    expectBlocked(evaluateRelease(valid({ jobs: undefined })), 'ci-jobs');
  });

  it('10. failed consumer-matrix job → BLOCKED', () => {
    expectBlocked(
      evaluateRelease(valid({ jobs: { ...allJobs, 'consumer-matrix': { result: 'failure' } } })),
      'ci-jobs',
      /consumer-matrix: failure/,
    );
    expectBlocked(
      evaluateRelease(
        valid({ jobs: { ...allJobs, 'release-acceptance': { result: 'cancelled' } } }),
      ),
      'ci-jobs',
    );
  });

  it('11. invalid Core peer → BLOCKED', () => {
    const packages = valid().packages;
    expectBlocked(
      evaluateRelease(
        valid({
          packages: {
            ...packages,
            primitives: {
              ...packages.primitives,
              peerDependencies: { '@quartz-headless/core': '^0.17.0' },
            },
          },
        }),
      ),
      'core-peer',
    );
    expectBlocked(
      evaluateRelease(
        valid({
          packages: { ...packages, primitives: { ...packages.primitives, version: '0.18.1' } },
        }),
      ),
      'versions',
      /lockstep/,
    );
  });

  it('12. registry integrity mismatch → BLOCKED (conflict), ambiguous registry → BLOCKED', () => {
    const reg = fakeRegistry();
    const core = manifest.packages[0];
    reg.versions[`${core.name}@${core.version}`] = 'sha512-somethingelse';
    const registry = inspectRegistry(manifest, (m) => planPublication(m, { exec: reg.exec }));
    expect(registry.conflict).toBe(true);
    expectBlocked(evaluateRelease(valid({ registry })), 'registry', /different content/);
    const down = fakeRegistry();
    down.fail.view = 'E503';
    expectBlocked(
      evaluateRelease(
        valid({
          registry: inspectRegistry(manifest, (m) => planPublication(m, { exec: down.exec })),
        }),
      ),
      'registry',
    );
    expectBlocked(evaluateRelease(valid({ registry: undefined })), 'registry', /not checked/);
  });

  it('13. missing or weak GitHub environment protection → BLOCKED', () => {
    expectBlocked(
      evaluateRelease(valid({ environment: normalizeEnvironment(null) })),
      'environment-protection',
      /does not exist/,
    );
    const without = (patch) => normalizeEnvironment({ ...protectedEnvironment, ...patch });
    expectBlocked(
      evaluateRelease(valid({ environment: without({ protection_rules: [] }) })),
      'environment-protection',
      /no required user reviewers/,
    );
    expectBlocked(
      evaluateRelease(valid({ environment: without({ can_admins_bypass: true }) })),
      'environment-protection',
      /bypass/,
    );
    expectBlocked(
      evaluateRelease(valid({ environment: without({ deployment_branch_policy: null }) })),
      'environment-protection',
      /branches/,
    );
    expectBlocked(
      evaluateRelease(valid({ environmentError: 'HTTP 403' })),
      'environment-protection',
    );
    // Without a verifiable reviewer list, even a real approval is not accepted.
    expectBlocked(
      evaluateRelease(valid({ environment: without({ protection_rules: [] }) })),
      'maintainer-approval',
    );
  });

  it('the current 0.16.1 record parses and both manual gates are truthfully pending', () => {
    const text = readFileSync(join(ROOT, 'docs/releases/0.16.1-acceptance.md'), 'utf8');
    const record = parseAcceptanceRecord(text);
    expect(record.version).toBe('0.16.1');
    expect(record.gates['manual-screen-reader'].status).toBe('pending');
    expect(record.gates['autofill-firefox-safari'].status).toBe('pending');
  });
});

describe('preflight binding and recovery behaviour (fake registry, no real npm)', () => {
  const binding = { version: VERSION, commit: COMMIT, manifestSha256, runId: RUN };
  const passing = evaluateRelease(valid());

  it('publish refuses a preflight that failed, is local, or is bound to anything else', () => {
    expect(() => assertPreflightBinding(passing, binding)).not.toThrow();
    expect(() => assertPreflightBinding(undefined, binding)).toThrow(/no passing/);
    expect(() => assertPreflightBinding({ ...passing, ok: false }, binding)).toThrow(/no passing/);
    expect(() => assertPreflightBinding({ ...passing, mode: 'local' }, binding)).toThrow(
      /no passing/,
    );
    for (const [key, value] of [
      ['version', '0.18.1'],
      ['commit', 'c'.repeat(40)],
      ['manifestSha256', 'e'.repeat(64)],
      ['runId', '1'],
    ])
      expect(() => assertPreflightBinding(passing, { ...binding, [key]: value })).toThrow(
        new RegExp(`different ${key}`),
      );
  });

  it('release.mjs publish without a preflight refuses before contacting the registry', () => {
    // A tripwire `npm` first on PATH records any registry call the CLI attempts.
    const bin = mkdtempSync(join(tmpdir(), 'quartz-npm-tripwire-'));
    const marker = join(bin, 'npm-was-called');
    writeFileSync(join(bin, 'npm'), `#!/bin/sh\ntouch "${marker}"\nexit 1\n`, { mode: 0o755 });
    const tripwireEnv = { ...process.env, PATH: `${bin}:${process.env.PATH}` };
    const r = spawnSync(
      process.execPath,
      [
        join(ROOT, 'scripts/release/release.mjs'),
        'publish',
        '--dir',
        artifactDir,
        '--commit',
        COMMIT,
        '--confirm-version',
        VERSION,
      ],
      { encoding: 'utf8', env: tripwireEnv },
    );
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/--preflight <release-preflight.json> is required/);
    const forged = join(artifactDir, 'forged-preflight.json');
    writeFileSync(
      forged,
      JSON.stringify({ ...passing, binding: { ...passing.binding, commit: 'f'.repeat(40) } }),
    );
    const r2 = spawnSync(
      process.execPath,
      [
        join(ROOT, 'scripts/release/release.mjs'),
        'publish',
        '--dir',
        artifactDir,
        '--commit',
        COMMIT,
        '--confirm-version',
        VERSION,
        '--preflight',
        forged,
      ],
      { encoding: 'utf8', env: tripwireEnv },
    );
    expect(r2.status).toBe(1);
    expect(r2.stderr).toMatch(/bound to a different commit/);
    expect(existsSync(marker)).toBe(false);
  });

  const fast = { attempts: 2, delayMs: 0 };
  const gateThenPublish = (reg) => {
    const registry = inspectRegistry(manifest, (m) => planPublication(m, { exec: reg.exec }));
    const result = evaluateRelease(valid({ registry }));
    expect(result.ok, JSON.stringify(result.blockers)).toBe(true);
    assertPreflightBinding(result, binding);
    return executePublication(manifest, registry.plan, {
      dir: artifactDir,
      exec: reg.exec,
      ...fast,
    });
  };

  it('15. interrupted publication keeps the safe recovery: re-run verifies what landed', () => {
    const reg = fakeRegistry();
    reg.interruptAfterPublish = true;
    expect(gateThenPublish(reg).verified).toEqual([
      '@quartz-headless/core',
      '@quartz-headless/primitives',
    ]);
    reg.interruptAfterPublish = false;
    reg.calls.length = 0;
    const again = gateThenPublish(reg);
    expect(again.published).toEqual([]);
    expect(reg.calls.some((c) => c.startsWith('publish'))).toBe(false);
  });

  it('16. both packages present with matching integrity are idempotently verified', () => {
    const reg = fakeRegistry();
    for (const p of manifest.packages) {
      reg.versions[`${p.name}@${p.version}`] = p.integrity;
      reg.tags[`${p.name}:latest`] = p.version;
    }
    const r = gateThenPublish(reg);
    expect(r.published).toEqual([]);
    expect(r.verified).toEqual(['@quartz-headless/core', '@quartz-headless/primitives']);
  });

  it('17. partial Core-only publication resumes by publishing only Primitives', () => {
    const reg = fakeRegistry();
    const core = manifest.packages[0];
    reg.versions[`${core.name}@${core.version}`] = core.integrity;
    reg.tags[`${core.name}:latest`] = core.version;
    const r = gateThenPublish(reg);
    expect(r.published).toEqual(['@quartz-headless/primitives']);
    expect(r.verified).toEqual(['@quartz-headless/core']);
  });

  it('the local preflight CLI is read-only and exits non-zero while blockers remain', () => {
    const before = execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' });
    const r = spawnSync(
      process.execPath,
      [join(ROOT, 'scripts/release/preflight.mjs'), '--offline', '--dir', artifactDir],
      {
        cwd: ROOT,
        encoding: 'utf8',
      },
    );
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/RESULT: BLOCKED/);
    expect(r.stdout).toMatch(/BLOCKED\s+Maintainer publication approval/);
    expect(execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' })).toBe(
      before,
    );
  });
});
