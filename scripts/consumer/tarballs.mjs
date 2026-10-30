/**
 * Where the consumer harnesses get Quartz tarballs.
 *
 * With `QUARTZ_RELEASE_ARTIFACTS=<dir>` (the release pipeline) they install the EXACT tarballs
 * produced once by `scripts/release/release.mjs pack`, after re-verifying them against the manifest
 * (hash, integrity, package contract). Without it (local development) they pack the built `dist/`.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { stageVerifiedTarballs } from '../release/artifacts.mjs';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);

function packDist(dist, dest) {
  const out = execFileSync('npm', ['pack', '--json', '--pack-destination', dest], {
    cwd: dist,
    encoding: 'utf8',
  });
  return join(dest, JSON.parse(out)[0].filename);
}

/** @returns {{core:string, primitives:string, source:'release-artifacts'|'dist'}} */
export function resolveTarballs(work) {
  const artifacts = process.env['QUARTZ_RELEASE_ARTIFACTS'];
  if (artifacts) {
    const staged = stageVerifiedTarballs(resolve(artifacts), work);
    return { ...staged, source: 'release-artifacts' };
  }
  for (const pkg of ['core', 'primitives'])
    if (!existsSync(join(ROOT, `packages/${pkg}/dist/package.json`)))
      throw new Error('run `pnpm build:lib` first (or set QUARTZ_RELEASE_ARTIFACTS)');
  return {
    core: packDist(join(ROOT, 'packages/core/dist'), work),
    primitives: packDist(join(ROOT, 'packages/primitives/dist'), work),
    source: 'dist',
  };
}
