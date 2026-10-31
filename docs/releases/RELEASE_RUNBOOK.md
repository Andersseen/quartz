# Release runbook

Executable by a maintainer or coding agent who has not seen this repository before. Every step is tagged:

- **[AUTO]** performed by CI or a script; you only check the result.
- **[MANUAL]** needs a human decision or credential.
- **[IRREVERSIBLE]** publishes to npm or GitHub. npm versions are immutable: there is no rollback, only a new, higher version.

There is exactly one way to publish: the `CI / CD` workflow (`.github/workflows/deploy.yml`) started with `workflow_dispatch`. `pnpm publish:lib` is
disabled on purpose; never run `npm publish` from a workstation.

## How the pipeline guarantees "what was tested is what is published"

```
quality ─┬─ unit-tests
         ├─ e2e-tests
         └─ package ──► release-artifacts (tarballs + release-manifest.json + SHA256SUMS)
                          ├─ consumer-smoke   ┐ install THESE tarballs (re-verified),
                          ├─ consumer-matrix  ├ strict AOT, SSR, hydration, 3 browsers
                          └─ cli-consumer     ┘
all of the above ─► publish (downloads the same artifact; builds nothing) ─► release (GitHub)
```

1. `package` builds once (`pnpm build:lib`), runs `pnpm verify:build` (package contract + public API guard), packs both tarballs and writes
   `release-manifest.json` (package, version, source commit, Node/npm, filename, **sha256**, **npm integrity**, exports, peers). The manifest's own
   sha256 is a job output.
2. Every consumer job downloads the artifact and refuses to continue unless the manifest hash equals that job output and
   `release.mjs verify` re-hashes both tarballs and re-inspects their contents. `QUARTZ_RELEASE_ARTIFACTS` makes the consumer harness install those files
   instead of packing `dist/`.
3. `publish` repeats the verification, checks the source commit is an ancestor of `main`, asks the registry what exists (fail closed), then runs
   `npm publish <tarball> --tag <latest|next> --provenance` on the **downloaded files**. A tarball altered after packing fails the hash check.
4. After publishing, each version is read back from the registry and its `dist.integrity` must equal the manifest value; the dist-tag must be correct
   and a pre-release must not hold `latest`.

## 0. Preconditions [MANUAL]

- `main` is green on the last push (`gh run list --branch main --limit 3`).
- Required gates are accepted in the acceptance record for the version (`docs/releases/<version>-acceptance.md`). Manual gates (screen reader,
  genuine Autofill) are either executed or **explicitly waived in writing by the maintainer** — an agent cannot grant the waiver.
- Repository secrets: `NPM_TOKEN` (an automation token with publish rights on the `@quartz-headless` scope). `GITHUB_TOKEN` is provided by Actions.
  Provenance needs the publish job's `id-token: write` permission, which is already declared. Never print or echo the token; the tooling redacts
  `npm_…`, `_authToken=` and `Bearer …` values from every message.
- Node ≥ 20 locally; CI uses Node 22.

## 1. Prepare the version [MANUAL → PR]

Branch `chore/release-X.Y.Z` from up-to-date `main`.

| Release           | Version example | Core peer written in Primitives |
| ----------------- | --------------- | ------------------------------- |
| stable minor      | `0.19.0`        | `^0.19.0`                       |
| patch             | `0.19.1`        | `^0.19.1`                       |
| beta              | `1.0.0-beta.1`  | `1.0.0-beta.1` (exact)          |
| release candidate | `1.0.0-rc.1`    | `1.0.0-rc.1` (exact)            |

Only `-beta.N` and `-rc.N` pre-release identifiers are accepted. A caret never silently accepts a pre-release companion, so pre-releases pin exactly.

```bash
# set version in BOTH manifests and the Core peer in Primitives (lockstep), then:
node -e "
const fs=require('fs');const v=process.argv[1];
const peer=/-/.test(v)?v:'^'+v;
for (const [f,fn] of [['packages/core/package.json',p=>{}],['packages/primitives/package.json',p=>{p.peerDependencies['@quartz-headless/core']=peer}]]) {
  const p=JSON.parse(fs.readFileSync(f));p.version=v;fn(p);fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
}" 1.0.0-beta.1
pnpm install            # refreshes pnpm-lock.yaml (workspace peer specifiers)
```

Update `CHANGELOG.md` and the acceptance record in the same PR. Open the PR; **do not merge until CI is green**.

## 2. Verify locally before the PR merges [AUTO, run by you]

```bash
pnpm install --frozen-lockfile
pnpm format:check && pnpm lint && pnpm typecheck
pnpm build:lib && pnpm verify:build           # expect: "✓ Public API surface matches docs/api/snapshots"
pnpm release:pack && pnpm release:verify      # expect: "✓ packed X from <sha>" then "✓ artifacts verified"
pnpm release:plan                              # read-only; expect steps "publish" for a new version (see §7 for other outcomes)
QUARTZ_RELEASE_ARTIFACTS=$PWD/release-artifacts pnpm verify:consumer:runtime -- --fixture angular-21.2 --project chromium
pnpm test:coverage                             # includes the release rehearsal suite (scripts/**/*.spec.mjs)
```

The rehearsal suite (`pnpm exec vitest run --project quartz-release`) drives the real planning/publishing code against a fake registry and covers:
stable, beta, RC, version already published, partial publication, wrong peer range, hash mismatch, registry/auth/permission/rate-limit failures,
interrupted publish, concurrent writers (same and different artifact), re-run, and GitHub-release metadata failures. It never contacts npm.

## 3. Merge [MANUAL]

Merge the release PR. The push to `main` runs the full workflow but does **not** publish (publication is dispatch-only). Wait for it to pass, including
`Deploy to Cloudflare Pages`, and verify the site (`https://quartz-headless.pages.dev`).

## 4. Publish [MANUAL start → IRREVERSIBLE]

```bash
SHA=$(git rev-parse origin/main)
gh workflow run "CI / CD" --ref main \
  -f source_ref="$SHA" -f publish=true -f confirm_version="1.0.0-beta.1"
gh run watch $(gh run list --workflow "CI / CD" --limit 1 --json databaseId --jq '.[0].databaseId')
```

- `confirm_version` must equal the artifact version exactly; otherwise `publish` refuses before any registry write.
- Use the full commit SHA, not a branch name: the artifact is bound to that commit.
- The `publish` job has `concurrency: quartz-npm-release` with `cancel-in-progress: false`; a second dispatch waits instead of racing.
- Stable versions publish to `latest`; `-beta.N`/`-rc.N` publish to `next` and are marked **prerelease** on GitHub. Promoting a pre-release to `latest`
  is a separate deliberate act (§9), never an automatic side effect.

## 5. Verify the publication [AUTO + MANUAL check]

```bash
V=1.0.0-beta.1
RUN=<run-id>                                   # from `gh run list --workflow "CI / CD"`
gh run download "$RUN" -n release-artifacts -D qz-art
cat qz-art/SHA256SUMS
node -e "const m=require('./qz-art/release-manifest.json');console.log(m.sourceCommit);for(const p of m.packages)console.log(p.name,p.integrity)"
npm view @quartz-headless/core@$V dist.integrity dist.attestations --json
npm view @quartz-headless/primitives@$V dist.integrity dist.attestations --json
npm view @quartz-headless/core dist-tags --json   # stable: latest=$V; pre-release: next=$V and latest unchanged
gh release view v$V --json tagName,isPrerelease,targetCommitish,assets
```

The `dist.integrity` values must equal the manifest; `dist.attestations.url` must be present (provenance); the release's tag must resolve to the manifest's
`sourceCommit`.

Then install in a clean project: `npm install @quartz-headless/core@$V @quartz-headless/primitives@$V` (always the exact version for a pre-release) and
build it. Record the run id, tarball sha256 values, GitHub Release URL and npm integrity in the acceptance record.

After a verified publication, update `LATEST_NPM_VERSION` in `src/app/site/site-config.ts` so the website's version badge, install section and footer name the new npm release. It is deliberately a constant, not read from the package manifests, so the site never calls an unpublished version released.

## 6. GitHub Release [AUTO]

The `release` job runs after a verified publication (also on a re-run). It creates `vX.Y.Z[-pre]` at the **validated source commit**, uploads both tarballs,
`SHA256SUMS` and `release-manifest.json`, marks pre-releases as such (and only stable releases as `latest`). It refuses to move an existing tag that
points at another commit and refuses a prerelease-flag mismatch. If it fails after a successful publish, see §8-B.

## 7. Registry reconciliation outcomes (what `plan` / `publish` decide)

| Registry state for the validated version                            | Result                                                           |
| ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| both absent                                                         | publish Core, then Primitives                                    |
| both present, integrity equals manifest                             | verify and exit (idempotent re-run)                              |
| Core present (equal), Primitives absent                             | publish only Primitives (resumes a partial release)              |
| Primitives present, Core absent                                     | **stop**: inconsistent pair                                      |
| either present with **different** integrity                         | **stop**: conflict; exit code 3; never overwrite                 |
| `E401`/`ENEEDAUTH`, `E403`, `E429`, 5xx, network, unexpected output | **stop**: the lookup is ambiguous; nothing is assumed to be free |
| only `E404` ("no such version")                                     | treated as absent                                                |

Exit codes of `scripts/release/release.mjs`: `0` ok, `1` failure, `3` conflict with immutable published content.

## 8. Partial release recovery [MANUAL decision]

Never "just rerun everything" blindly: re-run the **same** dispatch (same `source_ref`, same `confirm_version`) only after reading the failed step.

| Situation                                    | Action                                                                                                                                                                                                                                                   |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Core published, Primitives failed         | Read the error. If transient (network/rate limit/5xx), re-dispatch with the same inputs: Core is verified and skipped, Primitives is published. If it was auth/permission, fix the token first. If integrity conflict (exit 3), stop and escalate (§12). |
| B. Both published, GitHub Release failed     | Re-dispatch the same inputs (publish verifies/skips, release job retries), or `gh workflow run` again; do not republish npm.                                                                                                                             |
| C. Both published, Cloudflare deploy failed  | Deployment is independent of npm: re-run the failed `deploy` job on the merge commit.                                                                                                                                                                    |
| D. Workflow interrupted mid-publish          | Re-dispatch with identical inputs. The tool re-reads the registry; a publish that landed is recognised by its integrity.                                                                                                                                 |
| E. Re-run of a finished release              | Safe: it verifies both versions and the release, changes nothing.                                                                                                                                                                                        |
| F. Two simultaneous dispatches               | The second waits on the concurrency group; when it runs it finds everything already published and verifies it.                                                                                                                                           |
| G/H. A version exists with different content | Stop. Do not republish. Determine who published it (`npm view <pkg>@<v> --json`), then cut a new patch version (§10).                                                                                                                                    |
| I. A check failed before publish             | Nothing was published. Fix on a branch, merge, dispatch again.                                                                                                                                                                                           |
| J. Registry temporarily unavailable          | The job fails closed. Wait, re-dispatch with identical inputs.                                                                                                                                                                                           |

## 9. Pre-release promotion and rollback alternatives [MANUAL, IRREVERSIBLE]

- Promoting a tested pre-release to `latest` is a **dist-tag** change, not a republish: `npm dist-tag add @quartz-headless/core@1.0.0-rc.2 latest` (and
  Primitives), run by a maintainer with publish rights; record it in the acceptance record. Normally you instead cut the stable `1.0.0` through §1–§6.
- Pointing consumers at a known-good version: `npm dist-tag add @quartz-headless/<pkg>@<good> latest`. This is a mitigation, **not** a rollback: the bad
  version stays installable by exact version.
- `npm deprecate @quartz-headless/<pkg>@<bad> "message"` warns users. `npm unpublish` is not part of this process.

## 10. Hotfix / patch workflow [MANUAL + AUTO]

1. Identify the published version(s) affected (`npm view @quartz-headless/core versions --json`; GitHub Release notes).
2. Reproduce the defect on the published tarballs (a consumer fixture or a minimal repro).
3. Add a regression test that fails before the fix (unit; browser/consumer test if behavior is DOM-dependent).
4. Branch `fix/<topic>` from the tag or `main` commit of the supported release line (never from an unreviewed branch).
5. Implement a **compatible** fix. If it changes a selector, input/output, default, focus/keyboard/ARIA contract or peer range, it is not a patch — see
   `docs/api/FREEZE_POLICY.md` and bump the minor with a migration note.
6. Run `pnpm verify:build` (API guard must pass without `--update`), the affected consumer fixtures and browsers, then the full matrix via CI.
7. Bump both manifests to the next patch (§1), merge, publish (§4). The old tarballs are never modified.
8. Verify with a consumer install of the new version; document the fixed behavior and affected versions in `CHANGELOG.md`.
9. Unsupported Angular/Node versions are not back-supported by a hotfix.

## 11. Audit trail [AUTO + MANUAL]

For every release keep: workflow run URL, source SHA, `release-manifest.json` and `SHA256SUMS` (attached to the GitHub Release and the run artifact for 30
days), npm integrity values and provenance attestation, the acceptance record (`docs/releases/<version>-acceptance.md`) and the `docs/ai/STATE.md` entry.

## 12. Failure escalation

Stop and hand over to the repository owner (do not improvise) if: exit code 3 (immutable content differs), an `E403` on a scope you should be able to
publish to, provenance rejected, a tag that points to another commit, or Core/Primitives on the registry disagree. Include the run URL, the
`plan` output and `npm view <pkg>@<v> --json` for both packages.
