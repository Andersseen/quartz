/**
 * Publication planning and execution. Every side effect goes through an injected executor so the
 * rehearsal tests drive the real decision logic against a fake registry — nothing here talks to
 * npm unless the CLI wires in the real `npmExec`.
 *
 * Invariants:
 *  - A version that exists with a DIFFERENT integrity is a conflict: stop, never overwrite.
 *  - A version that exists with the SAME integrity is already done: verify and move on.
 *  - Primitives must never exist on the registry without its companion Core.
 *  - Registry lookups fail closed (see registry.mjs).
 *  - Prereleases are published with `--tag next` and can never occupy `latest`.
 */
import { join } from 'node:path';
import { RegistryError, classifyFailure, lookupVersion, npmExec, redact } from './registry.mjs';
import { distTagFor, parse, validateReleaseVersion } from './semver.mjs';

export class ReleaseConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ReleaseConflictError';
  }
}

/** Validate the operator's confirmation against the manifest before anything else happens. */
export function assertConfirmed(manifest, confirmVersion) {
  validateReleaseVersion(manifest.version);
  if (!confirmVersion || confirmVersion !== manifest.version)
    throw new Error(
      `Refusing publication: confirm_version "${confirmVersion ?? ''}" does not match artifact version ${manifest.version}`,
    );
  const bad = manifest.packages.filter((p) => p.version !== manifest.version);
  if (bad.length)
    throw new Error(
      `Package versions differ from release ${manifest.version}: ${bad.map((p) => p.name).join(', ')}`,
    );
}

/**
 * Decide what to do for each package, in publish order (Core first).
 * @returns {{version:string, tag:string, steps:Array<{name:string, filename:string, action:'publish'|'verified'}>}}
 */
export function planPublication(manifest, { exec = npmExec } = {}) {
  const tag = distTagFor(manifest.version);
  const states = manifest.packages.map((p) => ({
    p,
    remote: lookupVersion({ name: p.name, version: p.version, exec }),
  }));
  const steps = [];
  for (const { p, remote } of states) {
    if (remote.state === 'absent') {
      steps.push({ name: p.name, filename: p.filename, action: 'publish' });
    } else if (remote.integrity === p.integrity) {
      steps.push({ name: p.name, filename: p.filename, action: 'verified' });
    } else {
      throw new ReleaseConflictError(
        `${p.name}@${p.version} already exists on npm with different content ` +
          `(registry ${remote.integrity}, validated artifact ${p.integrity}). ` +
          'Published versions are immutable: do not republish; investigate and cut a new version.',
      );
    }
  }
  const [core, prim] = steps;
  if (core.action === 'publish' && prim.action === 'verified')
    throw new ReleaseConflictError(
      `${manifest.packages[1].name}@${manifest.version} is on npm but ${manifest.packages[0].name}@${manifest.version} is not: inconsistent pair, stop and investigate.`,
    );
  return { version: manifest.version, tag, steps };
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** The registry can lag briefly after publish: poll a bounded number of times, then fail. */
function confirmOnRegistry(p, { exec, attempts, delayMs }) {
  let last;
  for (let i = 0; i < attempts; i++) {
    last = lookupVersion({ name: p.name, version: p.version, exec });
    if (last.state === 'present') break;
    if (i < attempts - 1) sleepSync(delayMs);
  }
  if (last.state !== 'present')
    throw new Error(`${p.name}@${p.version} was published but is not visible on the registry`);
  if (last.integrity !== p.integrity)
    throw new ReleaseConflictError(
      `${p.name}@${p.version} on the registry has integrity ${last.integrity}, expected ${p.integrity}`,
    );
  return last;
}

/** Fail if the dist-tag landed on the wrong channel (a prerelease must never be `latest`). */
function assertChannel(p, tag, { exec }) {
  const r = exec(['view', p.name, 'dist-tags', '--json']);
  if (r.status !== 0)
    throw new RegistryError(classifyFailure(r), `dist-tag lookup for ${p.name} failed`);
  const tags = JSON.parse(r.stdout);
  if (tags[tag] !== p.version)
    throw new Error(`${p.name}: dist-tag ${tag} is ${tags[tag]}, expected ${p.version}`);
  if (parse(p.version).pre.length && tags.latest === p.version)
    throw new Error(`${p.name}@${p.version} is a prerelease but holds the "latest" dist-tag`);
}

/**
 * Execute a plan. Publishes only the exact tarball files named in the manifest.
 * @returns {{published:string[], verified:string[]}}
 */
export function executePublication(
  manifest,
  plan,
  { dir, exec = npmExec, provenance = false, attempts = 6, delayMs = 5000 } = {},
) {
  const published = [];
  const verified = [];
  for (const step of plan.steps) {
    const p = manifest.packages.find((x) => x.name === step.name);
    if (step.action === 'verified') {
      verified.push(p.name);
      continue;
    }
    const args = ['publish', join(dir, p.filename), '--access', 'public', '--tag', plan.tag];
    if (provenance) args.push('--provenance');
    const result = exec(args);
    if (result.status !== 0) {
      // A failed/timed-out publish may still have landed (or a concurrent run won the race):
      // re-read the registry instead of guessing.
      const kind = classifyFailure(result);
      let after;
      try {
        after = lookupVersion({ name: p.name, version: p.version, exec });
      } catch (lookupError) {
        throw new Error(
          `npm publish ${p.name}@${p.version} failed (${kind}) and the registry could not be re-read: ${lookupError.message}`,
        );
      }
      if (after.state === 'present' && after.integrity === p.integrity) {
        verified.push(p.name);
        continue;
      }
      if (after.state === 'present')
        throw new ReleaseConflictError(
          `${p.name}@${p.version} now exists with different content; stopping.`,
        );
      throw new Error(
        `npm publish ${p.name}@${p.version} failed (${kind}): ${redact((result.stderr || result.stdout).trim().split('\n').slice(0, 4).join(' | '))}`,
      );
    }
    confirmOnRegistry(p, { exec, attempts, delayMs });
    published.push(p.name);
  }
  // Pair consistency and channel: both must be visible with the validated integrity.
  for (const p of manifest.packages) {
    confirmOnRegistry(p, { exec, attempts, delayMs });
    assertChannel(p, plan.tag, { exec });
  }
  return { published, verified };
}

/** GitHub Release content derived from the artifact manifest (never from the working tree). */
export function releaseMetadata(manifest) {
  const prerelease = manifest.prerelease === true || parse(manifest.version).pre.length > 0;
  const tag = `v${manifest.version}`;
  const rows = manifest.packages
    .map(
      (p) =>
        `- [\`${p.name}@${p.version}\`](https://www.npmjs.com/package/${p.name}/v/${p.version}) — sha256 \`${p.sha256}\``,
    )
    .join('\n');
  const notes = [
    `Packages in this release (npm dist-tag \`${distTagFor(manifest.version)}\`):`,
    rows,
    '',
    `Source commit: \`${manifest.sourceCommit}\``,
    `Built with Node ${manifest.toolchain.node}, npm ${manifest.toolchain.npm}. The attached tarballs are the exact files published to npm; verify with \`SHA256SUMS\`.`,
    prerelease
      ? '\n**Pre-release** — published under the `next` dist-tag; not the `latest` release.'
      : '',
  ]
    .filter((l) => l !== '')
    .join('\n');
  return {
    tag,
    title: tag,
    prerelease,
    latest: !prerelease,
    target: manifest.sourceCommit,
    notes,
    assets: [...manifest.packages.map((p) => p.filename), 'SHA256SUMS', 'release-manifest.json'],
  };
}

/**
 * @param existing null when the release/tag does not exist, otherwise { commit, prerelease }
 * @returns 'create' | 'update' (notes/assets only; same commit) — throws on a conflicting tag
 */
export function decideGithubRelease(meta, existing) {
  if (!existing) return 'create';
  if (existing.commit !== meta.target)
    throw new ReleaseConflictError(
      `Tag ${meta.tag} already points at ${existing.commit}, not the validated source ${meta.target}. Refusing to move a published tag.`,
    );
  if (existing.prerelease !== meta.prerelease)
    throw new ReleaseConflictError(
      `Release ${meta.tag} prerelease flag (${existing.prerelease}) disagrees with version channel (${meta.prerelease}).`,
    );
  return 'update';
}
