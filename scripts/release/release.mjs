#!/usr/bin/env node
/**
 * Release CLI. Subcommands (all take the artifact directory produced by `pack`):
 *
 *   pack            --out DIR [--commit SHA]     build outputs -> tarballs + release-manifest.json
 *   verify          --dir DIR [--commit SHA]     re-hash + re-inspect tarballs against the manifest
 *   plan            --dir DIR                    read-only registry reconciliation (fails closed)
 *   publish         --dir DIR --commit SHA --confirm-version V --preflight FILE [--run-id ID]
 *                   [--provenance] [--dry-run]
 *   github-release  --dir DIR --commit SHA [--dry-run]
 *
 * `publish` and `github-release` are the only commands with external side effects; both
 * re-verify the artifact first and refuse to run for any other commit or version.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { assertPreflightBinding } from './acceptance.mjs';
import { MANIFEST_FILE, packArtifacts, readManifest, verifyManifestFiles } from './artifacts.mjs';
import {
  ReleaseConflictError,
  assertConfirmed,
  decideGithubRelease,
  executePublication,
  planPublication,
  releaseMetadata,
} from './publish.mjs';
import { redact } from './registry.mjs';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const [command, ...rest] = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = rest[i + 1];
  return v && !v.startsWith('--') ? v : true;
};

function gh(args) {
  const r = spawnSync('gh', args, { encoding: 'utf8' });
  return { status: r.status ?? 1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

function existingRelease(tag) {
  const view = gh(['release', 'view', tag, '--json', 'isPrerelease']);
  const ref = gh(['api', `repos/{owner}/{repo}/git/ref/tags/${tag}`]);
  if (view.status !== 0 && ref.status !== 0) {
    if (/not found|404/i.test(view.stderr + ref.stderr)) return null;
    throw new Error(`Cannot determine whether ${tag} exists: ${redact(view.stderr || ref.stderr)}`);
  }
  if (ref.status !== 0)
    throw new Error(`Release ${tag} exists but its tag cannot be read: ${redact(ref.stderr)}`);
  let obj = JSON.parse(ref.stdout).object;
  if (obj.type === 'tag')
    obj = JSON.parse(gh(['api', `repos/{owner}/{repo}/git/tags/${obj.sha}`]).stdout).object;
  return {
    commit: obj.sha,
    prerelease: view.status === 0 ? JSON.parse(view.stdout).isPrerelease : undefined,
    hasRelease: view.status === 0,
  };
}

function main() {
  switch (command) {
    case 'pack': {
      const out = resolve(opt('out', 'release-artifacts'));
      const m = packArtifacts({
        root: ROOT,
        outDir: out,
        sourceCommit: opt('commit') || undefined,
      });
      console.log(`✓ packed ${m.version} from ${m.sourceCommit}`);
      for (const p of m.packages)
        console.log(`  ${p.filename}\n    sha256    ${p.sha256}\n    integrity ${p.integrity}`);
      return;
    }
    case 'verify': {
      const m = verifyManifestFiles(resolve(opt('dir', 'release-artifacts')), {
        expectedCommit: opt('commit') || undefined,
      });
      console.log(
        `✓ artifacts verified: ${m.packages.map((p) => `${p.name}@${p.version}`).join(', ')} (${m.sourceCommit})`,
      );
      return;
    }
    case 'plan': {
      const dir = resolve(opt('dir', 'release-artifacts'));
      const m = verifyManifestFiles(dir);
      const plan = planPublication(m);
      console.log(JSON.stringify(plan, null, 2));
      return;
    }
    case 'publish': {
      const dir = resolve(opt('dir', 'release-artifacts'));
      const m = verifyManifestFiles(dir, { expectedCommit: opt('commit') || undefined });
      if (!opt('commit')) throw new Error('--commit is required');
      assertConfirmed(m, opt('confirm-version'));
      // 0.24: a real publication needs a passing publish-mode preflight (acceptance gates,
      // environment protection, maintainer approval) bound to exactly this artifact and run.
      // Checked BEFORE any registry call; a dry run (no side effects) does not need it.
      const preflightFile = opt('preflight');
      if (!opt('dry-run', false) && typeof preflightFile !== 'string')
        throw new Error('Refusing publication: --preflight <release-preflight.json> is required');
      if (!opt('dry-run', false))
        assertPreflightBinding(JSON.parse(readFileSync(resolve(preflightFile), 'utf8')), {
          version: m.version,
          commit: opt('commit'),
          manifestSha256: createHash('sha256')
            .update(readFileSync(join(dir, MANIFEST_FILE)))
            .digest('hex'),
          runId: typeof opt('run-id') === 'string' ? opt('run-id') : undefined,
        });
      const plan = planPublication(m);
      console.log(`plan (dist-tag ${plan.tag}):`);
      for (const s of plan.steps) console.log(`  ${s.action.padEnd(9)} ${s.name}@${m.version}`);
      if (opt('dry-run', false)) {
        console.log('dry run: nothing published');
        return;
      }
      const result = executePublication(m, plan, {
        dir,
        provenance: Boolean(opt('provenance', false)),
      });
      console.log(
        `✓ published: [${result.published.join(', ')}] already-present+verified: [${result.verified.join(', ')}]`,
      );
      return;
    }
    case 'github-release': {
      const dir = resolve(opt('dir', 'release-artifacts'));
      const m = verifyManifestFiles(dir, { expectedCommit: opt('commit') || undefined });
      const meta = releaseMetadata(m);
      const existing = existingRelease(meta.tag);
      const action = decideGithubRelease(meta, existing);
      console.log(
        `github release ${meta.tag}: ${existing?.hasRelease ? 'update' : 'create'} (prerelease=${meta.prerelease})`,
      );
      if (opt('dry-run', false)) return;
      const files = meta.assets.map((a) => resolve(dir, a));
      const flags = meta.prerelease ? ['--prerelease'] : ['--latest'];
      const run = (a) => {
        const r = gh(a);
        if (r.status !== 0) throw new Error(`gh ${a[0]} ${a[1]} failed: ${redact(r.stderr)}`);
      };
      if (action === 'update' && existing.hasRelease) {
        run(['release', 'edit', meta.tag, '--title', meta.title, '--notes', meta.notes, ...flags]);
        run(['release', 'upload', meta.tag, '--clobber', ...files]);
      } else {
        run([
          'release',
          'create',
          meta.tag,
          ...files,
          '--target',
          meta.target,
          '--title',
          meta.title,
          '--notes',
          meta.notes,
          ...flags,
        ]);
      }
      console.log(`✓ release ${meta.tag} @ ${meta.target}`);
      return;
    }
    case 'manifest-field': {
      const m = readManifest(resolve(opt('dir', 'release-artifacts')));
      console.log(m[opt('name')]);
      return;
    }
    default:
      throw new Error(
        `unknown command "${command ?? ''}" (pack|verify|plan|publish|github-release|manifest-field)`,
      );
  }
}

try {
  main();
} catch (error) {
  console.error(`\n✗ release ${command}: ${redact(error.message)}\n`);
  process.exit(error instanceof ReleaseConflictError ? 3 : 1);
}
