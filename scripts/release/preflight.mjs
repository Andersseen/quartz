#!/usr/bin/env node
/**
 * Release preflight (0.24): read-only, fail-closed acceptance report for the current candidate.
 *
 *   pnpm release:preflight                       local report (exits 1 while anything is BLOCKED)
 *   node scripts/release/preflight.mjs --mode pre-approval|publish [options]   (CI)
 *
 * Options:
 *   --dir DIR                    release artifacts (default release-artifacts)
 *   --commit SHA                 commit the run validated (default: HEAD)
 *   --confirm-version V          the dispatch's confirm_version
 *   --expect-manifest-sha256 H   the `package` job output every consumer job verified
 *   --run-id ID                  this workflow run (approvals are read for it)
 *   --out FILE                   write the JSON result (consumed by `release.mjs publish --preflight`)
 *   --advisory                   print the report but exit 0 (non-publishing dispatches only)
 *   --offline                    skip GitHub and npm lookups (they are then BLOCKED, not assumed)
 * Env: NEEDS_JSON = `${{ toJSON(needs) }}` (CI job results), GH_TOKEN for `gh api`.
 *
 * It never writes to npm, GitHub or the repository. Statuses: PASS, BLOCKED, WAIVED.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { MANIFEST_FILE, verifyManifestFiles } from './artifacts.mjs';
import {
  RELEASE_ENVIRONMENT,
  evaluateRelease,
  formatReport,
  inspectRegistry,
  normalizeApprovals,
  normalizeEnvironment,
} from './acceptance.mjs';
import { planPublication } from './publish.mjs';
import { redact } from './registry.mjs';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
};

const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
const gitHelpers = {
  isAncestor: (a, b) =>
    spawnSync('git', ['merge-base', '--is-ancestor', a, b], { cwd: ROOT }).status === 0,
  changedPaths: (from, to, paths) =>
    git(['diff', '--name-only', `${from}..${to}`, '--', ...paths])
      .split('\n')
      .filter(Boolean),
};

/** `gh api` GET. Returns parsed JSON, `null` for a definite 404, throws for anything else. */
function ghGet(path) {
  const r = spawnSync('gh', ['api', '-H', 'Accept: application/vnd.github+json', path], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (r.status === 0) return JSON.parse(r.stdout);
  const text = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  if (/HTTP 404|"status":\s*"404"/.test(text)) return null;
  throw new Error(redact(text.trim().split('\n').slice(-1)[0] || `gh exited ${r.status}`));
}

function main() {
  const mode = String(opt('mode', 'local'));
  const offline = Boolean(opt('offline', false));
  const readJson = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
  const packages = {
    core: readJson('packages/core/package.json'),
    primitives: readJson('packages/primitives/package.json'),
  };
  const headCommit = git(['rev-parse', 'HEAD']);
  const input = {
    mode,
    packages,
    headCommit,
    git: gitHelpers,
    expected: {},
    runId: opt('run-id', undefined),
  };
  if (typeof opt('commit') === 'string') input.expected.commit = opt('commit');
  if (typeof opt('confirm-version') === 'string') input.expected.version = opt('confirm-version');
  else if (mode !== 'local') input.expected.version = '';
  if (typeof opt('expect-manifest-sha256') === 'string')
    input.expected.manifestSha256 = opt('expect-manifest-sha256');

  const dir = resolve(String(opt('dir', join(ROOT, 'release-artifacts'))));
  if (existsSync(join(dir, MANIFEST_FILE))) {
    try {
      input.manifest = verifyManifestFiles(dir);
      input.manifestSha256 = createHash('sha256')
        .update(readFileSync(join(dir, MANIFEST_FILE)))
        .digest('hex');
    } catch (error) {
      input.artifactsError = error.message;
    }
  }

  const version = packages.core.version;
  input.recordPath = `docs/releases/${version}-acceptance.md`;
  const recordFile = join(ROOT, input.recordPath);
  if (existsSync(recordFile)) input.recordText = readFileSync(recordFile, 'utf8');
  else input.recordError = 'acceptance record not found';
  input.matrixText = readFileSync(join(ROOT, 'docs/releases/0.17-manual-a11y.md'), 'utf8');

  if (process.env['NEEDS_JSON']) {
    try {
      input.jobs = JSON.parse(process.env['NEEDS_JSON']);
    } catch {
      input.jobs = {};
    }
  }

  if (!offline) {
    try {
      input.environment = normalizeEnvironment(
        ghGet(`repos/{owner}/{repo}/environments/${RELEASE_ENVIRONMENT}`),
      );
    } catch (error) {
      input.environmentError = error.message;
    }
    if (mode === 'publish') {
      if (!input.runId) input.approvalsError = '--run-id is required in publish mode';
      else
        try {
          input.approvals = normalizeApprovals(
            input.runId,
            ghGet(`repos/{owner}/{repo}/actions/runs/${input.runId}/approvals`) ?? [],
          );
        } catch (error) {
          input.approvalsError = error.message;
        }
    }
    if (input.manifest) {
      const state = inspectRegistry(input.manifest, (m) => planPublication(m));
      input.registry = state.error ? { ...state, error: redact(state.error) } : state;
    }
  }

  const result = evaluateRelease(input);
  console.log(formatReport(result));
  if (process.env['GITHUB_STEP_SUMMARY'])
    writeFileSync(
      process.env['GITHUB_STEP_SUMMARY'],
      [
        `### Release preflight (${result.mode}) — ${result.ok ? 'PASS' : 'BLOCKED'}`,
        '',
        `Version \`${result.binding.version}\`, commit \`${result.binding.commit}\`, manifest sha256 \`${result.binding.manifestSha256 ?? 'n/a'}\``,
        '',
        '| Status | Check | Detail |',
        '| --- | --- | --- |',
        ...result.checks.map(
          (c) => `| ${c.status} | ${c.label} | ${c.detail.replace(/\|/g, '\\|')} |`,
        ),
        '',
      ].join('\n'),
      { flag: 'a' },
    );
  if (typeof opt('out') === 'string')
    writeFileSync(resolve(opt('out')), JSON.stringify(result, null, 2) + '\n');
  if (!result.ok && !opt('advisory', false)) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(`\n✗ release preflight: ${redact(error.message)}\n`);
  process.exit(1);
}
