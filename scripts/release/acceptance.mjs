/**
 * Release acceptance gate (0.24) — pure, fail-closed evaluation.
 *
 * Every input (repository manifests, release manifest, acceptance record, CI job results, GitHub
 * environment protection, deployment approvals, registry plan) is gathered by
 * `scripts/release/preflight.mjs` and passed in, so the rehearsal tests drive the real decision
 * logic with fixtures. Nothing here talks to npm or GitHub.
 *
 * Trust model:
 *  - Text committed to the repository (the acceptance record) can DESCRIBE executed evidence and
 *    REQUEST a waiver. It never authorizes publication on its own: an agent can edit files.
 *  - Human authorization is the approval of THIS workflow run's deployment to the protected
 *    `npm-release` environment, read back from the GitHub API (`/actions/runs/{id}/approvals`)
 *    and required to come from a user listed as a required reviewer of that environment.
 *  - A waiver counts only when the login that signed it approved this run's deployment.
 *  - The run is bound to the confirmed version, the source commit and the manifest sha256 that
 *    every consumer job verified; any mismatch blocks.
 */
import { corePeerRangeFor } from './semver.mjs';

export const PASS = 'PASS';
export const BLOCKED = 'BLOCKED';
export const WAIVED = 'WAIVED';

export const RELEASE_ENVIRONMENT = 'npm-release';
/** Jobs whose success every publication requires (mirrors `publish.needs` in deploy.yml). */
export const REQUIRED_JOBS = [
  'quality',
  'package',
  'unit-tests',
  'e2e-tests',
  'consumer-smoke',
  'consumer-matrix',
  'cli-consumer',
];
export const MODES = ['local', 'pre-approval', 'publish'];

/**
 * Manual gates and the existing evidence record each one is checked against
 * (`docs/releases/0.17-manual-a11y.md` rows).
 */
export const MANUAL_GATES = {
  'manual-screen-reader': {
    label: 'Manual screen-reader matrix',
    rows: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  },
  'autofill-firefox-safari': {
    label: 'Genuine Autofill (Firefox, Safari)',
    rows: [14],
    scope: ['firefox', 'safari'],
  },
};

const SHA = /^[0-9a-f]{40}$/;
const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const RECORD_BLOCK = /```json release-acceptance\n([\s\S]*?)\n```/;

/** Extract and validate the machine-readable block of an acceptance record. Throws on any problem. */
export function parseAcceptanceRecord(markdown) {
  const blocks = String(markdown ?? '').match(new RegExp(RECORD_BLOCK.source, 'g')) ?? [];
  if (blocks.length !== 1)
    throw new Error(
      `expected exactly one \`\`\`json release-acceptance block, found ${blocks.length}`,
    );
  let record;
  try {
    record = JSON.parse(RECORD_BLOCK.exec(blocks[0])[1]);
  } catch (error) {
    throw new Error(`release-acceptance block is not valid JSON (${error.message})`);
  }
  if (!record || record.schema !== 1) throw new Error('release-acceptance schema must be 1');
  if (typeof record.version !== 'string') throw new Error('release-acceptance has no version');
  if (!record.gates || typeof record.gates !== 'object')
    throw new Error('release-acceptance has no gates');
  for (const id of Object.keys(MANUAL_GATES))
    if (!record.gates[id]) throw new Error(`release-acceptance is missing gate "${id}"`);
  for (const id of Object.keys(record.gates))
    if (!MANUAL_GATES[id]) throw new Error(`release-acceptance has unknown gate "${id}"`);
  return record;
}

/** Outcomes of the 0.17 manual matrix rows: `{ [row]: 'PASS' | 'FAIL' | 'PENDING' }`. */
export function matrixOutcomes(markdown) {
  return Object.fromEntries(
    [
      ...String(markdown ?? '').matchAll(
        /^\| (\d+)\s+\|[^|]*\|\s*`\/[a-z]+`[^|]*\|.*\|\s*(PENDING|PASS|FAIL)\s*\|/gm,
      ),
    ].map((m) => [Number(m[1]), m[2]]),
  );
}

/** Normalize `GET /repos/{o}/{r}/environments/{name}` (or a 404) for the evaluator. */
export function normalizeEnvironment(response) {
  if (!response) return { exists: false };
  const reviewersRule = (response.protection_rules ?? []).find(
    (r) => r.type === 'required_reviewers',
  );
  const reviewers = reviewersRule?.reviewers ?? [];
  return {
    exists: true,
    name: response.name,
    userReviewers: reviewers
      .filter((r) => r.type === 'User' && r.reviewer?.login)
      .map((r) => r.reviewer.login),
    teamReviewers: reviewers.filter((r) => r.type === 'Team').length,
    preventSelfReview: Boolean(reviewersRule?.prevent_self_review),
    branchPolicy: response.deployment_branch_policy ?? null,
    canAdminsBypass: response.can_admins_bypass !== false,
  };
}

/** Normalize `GET /repos/{o}/{r}/actions/runs/{id}/approvals`. */
export function normalizeApprovals(runId, response) {
  if (!Array.isArray(response)) throw new Error('approvals response is not a list');
  return {
    runId: String(runId),
    items: response.map((a) => ({
      state: a.state,
      login: a.user?.login,
      environments: (a.environments ?? []).map((e) => e.name),
    })),
  };
}

const check = (id, label, status, detail) => ({ id, label, status, detail });

function versionsCheck({ packages, manifest, expected }) {
  const id = 'versions';
  const label = 'Package versions';
  const core = packages?.core?.version;
  const prim = packages?.primitives?.version;
  if (!core || !prim) return check(id, label, BLOCKED, 'package manifests could not be read');
  if (core !== prim)
    return check(id, label, BLOCKED, `Core ${core} and Primitives ${prim} are not lockstep`);
  if (manifest && manifest.version !== core)
    return check(
      id,
      label,
      BLOCKED,
      `release manifest is ${manifest.version}, packages are ${core}`,
    );
  if (expected?.version !== undefined && expected.version !== core)
    return check(
      id,
      label,
      BLOCKED,
      `confirmed version "${expected.version}" does not match the candidate ${core}`,
    );
  return check(
    id,
    label,
    PASS,
    `@quartz-headless/core@${core}, @quartz-headless/primitives@${prim}`,
  );
}

function peerCheck({ packages, manifest }) {
  const id = 'core-peer';
  const label = 'Core peer compatibility';
  const version = packages?.core?.version;
  if (!version) return check(id, label, BLOCKED, 'no candidate version');
  const want = corePeerRangeFor(version);
  const repo = packages?.primitives?.peerDependencies?.['@quartz-headless/core'];
  if (repo !== want)
    return check(id, label, BLOCKED, `Primitives peers Core "${repo}", expected "${want}"`);
  const packed = manifest?.packages?.find((p) => p.key === 'primitives')?.peerDependencies?.[
    '@quartz-headless/core'
  ];
  if (manifest && packed !== want)
    return check(
      id,
      label,
      BLOCKED,
      `packed Primitives peers Core "${packed}", expected "${want}"`,
    );
  return check(id, label, PASS, `Primitives → @quartz-headless/core ${want}`);
}

function commitCheck({ headCommit, manifest, expected }) {
  const id = 'source-commit';
  const label = 'Source commit identity';
  if (!SHA.test(headCommit ?? '')) return check(id, label, BLOCKED, 'HEAD commit unknown');
  if (manifest && manifest.sourceCommit !== headCommit)
    return check(
      id,
      label,
      BLOCKED,
      `artifacts were packed from ${manifest.sourceCommit}, checkout is ${headCommit}`,
    );
  if (expected?.commit !== undefined && expected.commit !== headCommit)
    return check(id, label, BLOCKED, `run validated ${expected.commit}, checkout is ${headCommit}`);
  return check(id, label, PASS, headCommit);
}

function artifactCheck({ manifest, manifestSha256, artifactsError, expected }) {
  const id = 'artifacts';
  const label = 'Release artifact identity';
  if (artifactsError) return check(id, label, BLOCKED, artifactsError);
  if (!manifest || !manifestSha256)
    return check(id, label, BLOCKED, 'no verified release-artifacts (run `pnpm release:pack`)');
  if (expected?.manifestSha256 !== undefined && expected.manifestSha256 !== manifestSha256)
    return check(
      id,
      label,
      BLOCKED,
      `manifest sha256 ${manifestSha256} differs from the validated ${expected.manifestSha256}`,
    );
  return check(
    id,
    label,
    PASS,
    `release-manifest.json sha256 ${manifestSha256}; ${manifest.packages.map((p) => `${p.filename} ${p.sha256.slice(0, 12)}…`).join(', ')}`,
  );
}

function jobsCheck({ jobs, mode }) {
  const id = 'ci-jobs';
  const label = 'Required automated validations';
  if (!jobs)
    return check(
      id,
      label,
      BLOCKED,
      'CI job results exist only inside the release workflow run (local mode cannot prove them)',
    );
  const required = mode === 'publish' ? [...REQUIRED_JOBS, 'release-acceptance'] : REQUIRED_JOBS;
  const bad = required
    .map((name) => [name, jobs[name]?.result ?? 'missing'])
    .filter(([, result]) => result !== 'success');
  if (bad.length)
    return check(id, label, BLOCKED, bad.map(([name, result]) => `${name}: ${result}`).join(', '));
  return check(id, label, PASS, `${required.length} required jobs succeeded`);
}

function evidenceProblems(gateId, gate, ctx) {
  const problems = [];
  if (!SHA.test(gate.testedCommit ?? '')) problems.push('testedCommit must be a full commit SHA');
  if (!DATE.test(gate.date ?? '')) problems.push('date must be YYYY-MM-DD');
  if (!gate.tester || !LOGIN.test(gate.tester)) problems.push('tester must be a GitHub login');
  const outcomes = matrixOutcomes(ctx.matrixText);
  const notPassed = MANUAL_GATES[gateId].rows.filter((row) => outcomes[row] !== 'PASS');
  if (notPassed.length)
    problems.push(
      `0.17-manual-a11y.md rows ${notPassed.join(', ')} are not PASS (${notPassed.map((r) => outcomes[r] ?? 'missing').join(', ')})`,
    );
  if (!problems.length && ctx.headCommit) {
    if (!ctx.git?.isAncestor(gate.testedCommit, ctx.headCommit))
      problems.push(`testedCommit ${gate.testedCommit} is not an ancestor of ${ctx.headCommit}`);
    else {
      const changed = ctx.git.changedPaths(gate.testedCommit, ctx.headCommit, ['packages/']);
      if (changed.length)
        problems.push(
          `package sources changed after the tested commit (${changed.slice(0, 3).join(', ')}${changed.length > 3 ? ', …' : ''})`,
        );
    }
  }
  return problems;
}

function gateCheck(gateId, ctx) {
  const { label, scope } = MANUAL_GATES[gateId];
  const id = `gate:${gateId}`;
  const gate = ctx.record?.gates?.[gateId];
  if (!gate) return check(id, label, BLOCKED, 'no acceptance record entry');
  if (scope && gate.status !== 'pending') {
    const accepted = Array.isArray(gate.scope) ? gate.scope : [];
    const missing = scope.filter((engine) => !accepted.includes(engine));
    if (missing.length)
      return check(id, label, BLOCKED, `scope not accepted for: ${missing.join(', ')}`);
  }
  switch (gate.status) {
    case 'pending':
      return check(id, label, BLOCKED, 'PENDING — not executed and not waived');
    case 'executed': {
      const problems = evidenceProblems(gateId, gate, ctx);
      return problems.length
        ? check(id, label, BLOCKED, `executed evidence rejected: ${problems.join('; ')}`)
        : check(
            id,
            label,
            PASS,
            `executed by ${gate.tester} on ${gate.date} at ${gate.testedCommit.slice(0, 12)}`,
          );
    }
    case 'waived': {
      const w = gate.waiver ?? {};
      const problems = [];
      if (!w.by || !LOGIN.test(w.by)) problems.push('waiver.by must be a GitHub login');
      if (!DATE.test(w.date ?? '')) problems.push('waiver.date must be YYYY-MM-DD');
      if (typeof w.reason !== 'string' || w.reason.trim().length < 20)
        problems.push('waiver.reason must explain the decision');
      if (w.version !== ctx.version)
        problems.push(`waiver is for version "${w.version}", candidate is ${ctx.version}`);
      if (problems.length)
        return check(id, label, BLOCKED, `unsigned or invalid waiver: ${problems.join('; ')}`);
      if (ctx.mode !== 'publish')
        return check(
          id,
          label,
          WAIVED,
          `waiver requested by ${w.by} — not yet verified: it counts only when ${w.by} approves this run's ${RELEASE_ENVIRONMENT} deployment`,
        );
      const approvers = approvedLogins(ctx);
      if (!approvers.includes(w.by))
        return check(
          id,
          label,
          BLOCKED,
          `waiver signed by ${w.by}, but ${w.by} did not approve this run's ${RELEASE_ENVIRONMENT} deployment (approvers: ${approvers.join(', ') || 'none'})`,
        );
      return check(
        id,
        label,
        WAIVED,
        `waived by ${w.by} (${w.date}), confirmed by deployment approval: ${w.reason}`,
      );
    }
    default:
      return check(id, label, BLOCKED, `unknown status "${gate.status}"`);
  }
}

function recordCheck(ctx) {
  const id = 'acceptance-record';
  const label = 'Acceptance record';
  if (ctx.recordError) return check(id, label, BLOCKED, `${ctx.recordPath}: ${ctx.recordError}`);
  if (ctx.record.version !== ctx.version)
    return check(
      id,
      label,
      BLOCKED,
      `${ctx.recordPath} describes ${ctx.record.version}, candidate is ${ctx.version}`,
    );
  return check(id, label, PASS, ctx.recordPath);
}

function environmentCheck({ environment, environmentError }) {
  const id = 'environment-protection';
  const label = `GitHub environment "${RELEASE_ENVIRONMENT}" protection`;
  if (environmentError)
    return check(id, label, BLOCKED, `cannot read settings: ${environmentError}`);
  if (!environment) return check(id, label, BLOCKED, 'not checked (no GitHub access)');
  if (!environment.exists)
    return check(id, label, BLOCKED, 'environment does not exist (see RELEASE_RUNBOOK §0.1)');
  const problems = [];
  if (!environment.userReviewers?.length)
    problems.push('no required user reviewers (team-only or none cannot be verified)');
  if (environment.canAdminsBypass) problems.push('administrators can bypass the protection');
  const policy = environment.branchPolicy;
  if (!policy || (!policy.protected_branches && !policy.custom_branch_policies))
    problems.push('deployments are not restricted to selected branches');
  if (problems.length) return check(id, label, BLOCKED, problems.join('; '));
  return check(
    id,
    label,
    PASS,
    `required reviewers: ${environment.userReviewers.join(', ')}; admin bypass off; branch-restricted`,
  );
}

function approvedLogins(ctx) {
  const { approvals, environment, runId } = ctx;
  if (!approvals || String(approvals.runId) !== String(runId ?? '')) return [];
  const reviewers = environment?.userReviewers ?? [];
  return approvals.items
    .filter(
      (a) =>
        a.state === 'approved' &&
        a.environments.includes(RELEASE_ENVIRONMENT) &&
        reviewers.includes(a.login),
    )
    .map((a) => a.login);
}

function approvalCheck(ctx) {
  const id = 'maintainer-approval';
  const label = 'Maintainer publication approval';
  if (ctx.mode !== 'publish')
    return check(
      id,
      label,
      BLOCKED,
      `not granted: approval exists only as a required-reviewer approval of a workflow run's ${RELEASE_ENVIRONMENT} deployment`,
    );
  if (ctx.approvalsError)
    return check(id, label, BLOCKED, `cannot read approvals: ${ctx.approvalsError}`);
  if (!ctx.approvals) return check(id, label, BLOCKED, 'no approvals recorded for this run');
  if (String(ctx.approvals.runId) !== String(ctx.runId ?? ''))
    return check(
      id,
      label,
      BLOCKED,
      `approvals belong to run ${ctx.approvals.runId}, not this run ${ctx.runId}`,
    );
  if (ctx.approvals.items.some((a) => a.state === 'rejected'))
    return check(id, label, BLOCKED, 'a reviewer rejected this deployment');
  const logins = approvedLogins(ctx);
  if (!logins.length)
    return check(
      id,
      label,
      BLOCKED,
      `no approval of the ${RELEASE_ENVIRONMENT} deployment by a required reviewer`,
    );
  return check(id, label, PASS, `approved by ${logins.join(', ')} (run ${ctx.runId})`);
}

function registryCheck({ registry }) {
  const id = 'registry';
  const label = 'Published registry state';
  if (!registry) return check(id, label, BLOCKED, 'not checked');
  if (registry.error) return check(id, label, BLOCKED, registry.error);
  const steps = registry.plan.steps.map((s) => `${s.name}: ${s.action}`).join(', ');
  return check(id, label, PASS, `dist-tag ${registry.plan.tag}; ${steps}`);
}

/** Registry reconciliation for the report; any failure (conflict, auth, network) blocks. */
export function inspectRegistry(manifest, plan) {
  try {
    return { plan: plan(manifest) };
  } catch (error) {
    return { error: error.message, conflict: error.name === 'ReleaseConflictError' };
  }
}

/**
 * Evaluate every acceptance check. `ok` is true only when no check is BLOCKED.
 * @returns {{mode:string, binding:object, checks:Array<{id,label,status,detail}>, ok:boolean, blockers:Array}}
 */
export function evaluateRelease(input) {
  const mode = input.mode ?? 'local';
  if (!MODES.includes(mode)) throw new Error(`unknown preflight mode ${mode}`);
  const version = input.packages?.core?.version;
  let record;
  let recordError = input.recordError;
  if (!recordError) {
    try {
      record = parseAcceptanceRecord(input.recordText);
    } catch (error) {
      recordError = error.message;
    }
  }
  const ctx = { ...input, mode, version, record, recordError };
  const checks = [
    versionsCheck(ctx),
    peerCheck(ctx),
    commitCheck(ctx),
    artifactCheck(ctx),
    jobsCheck(ctx),
    recordCheck(ctx),
    ...Object.keys(MANUAL_GATES).map((gateId) =>
      record
        ? gateCheck(gateId, ctx)
        : check(`gate:${gateId}`, MANUAL_GATES[gateId].label, BLOCKED, 'acceptance record invalid'),
    ),
    environmentCheck(ctx),
    // Before the environment review there is no approval to read yet; the publish job re-runs
    // the preflight in publish mode, where a missing approval blocks.
    ...(mode === 'pre-approval' ? [] : [approvalCheck(ctx)]),
    registryCheck(ctx),
  ];
  const blockers = checks.filter((c) => c.status === BLOCKED);
  return {
    mode,
    binding: {
      version,
      commit: input.headCommit,
      manifestSha256: input.manifestSha256,
      runId: input.runId === undefined ? undefined : String(input.runId),
    },
    checks,
    ok: blockers.length === 0,
    blockers,
  };
}

/**
 * Refuse publication unless a passing publish-mode preflight is bound to exactly this artifact.
 * Called by `release.mjs publish` (defense in depth behind the workflow's job ordering).
 */
export function assertPreflightBinding(preflight, { version, commit, manifestSha256, runId }) {
  if (!preflight || preflight.mode !== 'publish' || preflight.ok !== true)
    throw new Error('Refusing publication: no passing publish-mode release preflight');
  const b = preflight.binding ?? {};
  const mismatched = [
    ['version', b.version, version],
    ['commit', b.commit, commit],
    ['manifestSha256', b.manifestSha256, manifestSha256],
    ...(runId === undefined ? [] : [['runId', b.runId, String(runId)]]),
  ].filter(([, got, want]) => got !== want);
  if (mismatched.length)
    throw new Error(
      `Refusing publication: preflight is bound to a different ${mismatched.map(([k]) => k).join(', ')}`,
    );
}

export function formatReport(result) {
  const width = Math.max(...result.checks.map((c) => c.label.length));
  const lines = [
    `Release preflight (${result.mode}) — ${result.binding.version ?? '?'} @ ${result.binding.commit ?? '?'}`,
    '',
    ...result.checks.map((c) => `${c.status.padEnd(7)}  ${c.label.padEnd(width)}  ${c.detail}`),
    ...(result.mode === 'pre-approval'
      ? [
          '',
          `NEXT     Maintainer approval: the publish job waits for a required reviewer of "${RELEASE_ENVIRONMENT}" and re-checks everything in publish mode`,
        ]
      : []),
    '',
    result.ok
      ? 'RESULT: PASS — no blockers'
      : `RESULT: BLOCKED — ${result.blockers.length} blocker(s): ${result.blockers.map((b) => b.id).join(', ')}`,
  ];
  return lines.join('\n');
}
