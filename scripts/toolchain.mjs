/**
 * Repository-toolchain vs consumer-runtime boundary (0.24).
 *
 * Quartz runs two kinds of Node processes:
 *
 *  - REPOSITORY TOOLING — Vite/Vitest/Analog, playground fixture generation, release scripts, the
 *    Playwright test driver. It runs on the Node line CI verifies for the repository: 22 (>=22.12)
 *    or >=24. Node 20 is deliberately not a repository toolchain: Node 20.19.0's `require(esm)`
 *    crashes while Vitest loads the CJS-bundled `vitest.app.config.ts` (see
 *    docs/roadmap/0.24-release-readiness.md), and CI never verified repository tooling on Node 20.
 *
 *  - CONSUMER RUNTIME — the disposable Angular application that installs the release tarballs and
 *    runs `npm ci`, `ng build` (strict AOT + SSR) and the SSR server. It runs on the Node version of
 *    its compatibility-matrix cell (e.g. exactly 20.19.0 for the Angular 21.2 minimum fixture).
 *
 * Supporting Node 20 for CONSUMERS is unaffected by this policy.
 */

/** Human-readable range, mirrored in docs/compatibility.md and the workflow. */
export const REPOSITORY_TOOLCHAIN_RANGE = '^22.12.0 || >=24.0.0';

const parts = (version) => {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(String(version));
  if (!m) throw new Error(`not a Node.js version: ${version}`);
  return m.slice(1, 4).map(Number);
};

/** True when `version` may run repository tooling. */
export function isRepositoryToolchain(version) {
  const [major, minor] = parts(version);
  if (major === 22) return minor >= 12;
  return major >= 24;
}

/** Throws with a precise message when tooling is started on an unsupported Node. */
export function assertRepositoryToolchain(what, version = process.version) {
  if (!isRepositoryToolchain(version))
    throw new Error(
      `${what} is repository tooling and must run on Node ${REPOSITORY_TOOLCHAIN_RANGE}; ` +
        `it was started on ${version}. Consumer compatibility cells pass their Node with ` +
        '--consumer-node instead of switching the whole process (docs/compatibility.md).',
    );
}

/**
 * Matrix specs are either exact (`20.19.0`) or a major/minor prefix (`22`, `24.15`).
 * `nodeMatchesSpec('20.19.0', 'v20.19.0') === true`, `nodeMatchesSpec('20.19.0', 'v20.20.2') === false`.
 */
export function nodeMatchesSpec(spec, version) {
  const want = String(spec).replace(/^v/, '').split('.');
  if (!want.length || want.some((p) => !/^\d+$/.test(p))) throw new Error(`bad Node spec ${spec}`);
  const have = parts(version).map(String);
  return want.every((p, i) => p === have[i]);
}
