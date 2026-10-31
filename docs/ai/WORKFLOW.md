# WORKFLOW — Spec-Driven Development + Checklists

## The SDD loop (for anything bigger than a trivial fix)

```
1. SPEC    → copy docs/ai/specs/_TEMPLATE.md to docs/ai/specs/<feature>.md, fill it in
2. REVIEW  → the milestone prompt or the maintainer approves the spec; when the task itself
             already is the approved milestone, record the spec and proceed — stop and ask only
             for genuinely maintainer-owned decisions (waivers, freeze, publication)
3. BUILD   → implement exactly what the spec says, smallest diff that satisfies it
4. VERIFY  → pnpm typecheck && pnpm test (+ pnpm e2e if user-visible), demo page by hand
5. RECORD  → mark spec status Done; update docs/ai/STATE.md; update CLAUDE.md if
             architecture changed
```

Rules for weaker models, be strict with yourself:

- **Never start coding without reading** `CONTEXT.md`, `STATE.md`, and the relevant part of
  `ARCHITECTURE.md`. It takes 2 minutes and prevents 80% of wasted work.
- **One spec = one branch = one PR.** Branch naming: `feat/…`, `fix/…`, `chore/…` — always branch-first, never develop on `main`.
- **If the spec and reality conflict mid-build**, stop and update the spec — don't
  improvise silently.
- **If you're unsure whether something belongs in the library or the demo app**: styling,
  icons, Tailwind, Volt-UI → demo app. Behaviour, a11y, positioning → library.

## Checklist: add a NEW primitive

Copy this into your working notes and tick every box:

- [ ] Spec written in `docs/ai/specs/<name>.md` and approved (or the milestone prompt is the spec)
- [ ] Decide the layer first: low-level infrastructure → `packages/core/src/<name>/`;
      accessible UI pattern built on Core → `packages/primitives/src/<name>/`. Follow the
      anatomy in ARCHITECTURE.md: `<name>.types.ts` (+ `DEFAULT_<NAME>_CONFIG`),
      service/directives/components, `index.ts` barrel
- [ ] SSR-safe: no `document`/`window` at import time; `inject(DOCUMENT)` +
      `defaultView` guard (copy the overlay pattern)
- [ ] Keyboard support + ARIA roles/attributes implemented (this is the product, not a nice-to-have)
- [ ] Exports added to that package's `src/public-api.ts`
- [ ] If it's a Primitive that needs something from Core, import it as
      `from '@quartz-headless/core'` (a real package import) — never a relative path into
      `packages/core/`
- [ ] Unit tests `*.spec.ts` next to source (host-component pattern, fake timers if needed,
      DOM cleanup in `afterEach`)
- [ ] `cli/registry.js`: entry with `layer`, `files` list (no specs), `deps` if it imports
      another Core sibling (Core only) or `peerDeps: ['@quartz-headless/core']` (Primitives
      only), `docs` URL; remove `soon: true` if present
- [ ] Demo page: `src/app/pages/(docs)/<name>.page.ts` + `.page.html` + `<name>.snippets.ts`
- [ ] Route works on `localhost:5173` — if 404, add to `extraRoutes` in
      `src/app/app.config.ts` (known Vite cache issue)
- [ ] Sidebar/docs navigation updated so the page is reachable
- [ ] README.md primitive table updated (remove "coming soon" if applicable)
- [ ] E2E spec in `e2e/` if there's a meaningful user flow
- [ ] `pnpm lint && pnpm typecheck && pnpm test` all green
- [ ] `docs/ai/STATE.md` updated (matrix row + date)

## Checklist: MODIFY an existing primitive

- [ ] Read the primitive's current source + spec (if one exists in `docs/ai/specs/`)
- [ ] Breaking public API change? → update demo page snippets + README + note in STATE.md
- [ ] Files added/renamed/deleted? → update `cli/registry.js`
- [ ] Tests updated/added for the changed behaviour
- [ ] `pnpm typecheck && pnpm test` green; run the affected spec file directly first:
      `pnpm exec vitest run packages/core/src/<x>/<x>.spec.ts` or
      `packages/primitives/src/<x>/<x>.spec.ts` (if it's a Primitives file and you're
      running its vitest project in isolation, `packages/core` must already be built —
      see ARCHITECTURE.md)

## Checklist: demo/docs app change only

- [ ] No imports from demo app into `packages/core/` or `packages/primitives/` (one-way street)
- [ ] New `(docs)/` page → check the Vite-cache/extraRoutes gotcha
- [ ] `pnpm typecheck` (app tsconfig) + visual check on `localhost:5173` (`pnpm start`)

## Checklist: release / publish

Follow `docs/releases/RELEASE_RUNBOOK.md` — it is the only supported procedure. Summary of the rules:

- [ ] Release PR bumps **both** manifests (lockstep), the Core peer in Primitives (`^X.Y.Z`; exact for `-beta.N`/`-rc.N`), the lockfile, CHANGELOG and the acceptance record
- [ ] CI is green on the merge commit: quality, unit/coverage, E2E, `package`, consumer smoke/matrix, CLI consumer
- [ ] Manual gates (screen reader, genuine Autofill, API freeze) are evidenced or **waived in writing by the maintainer** — an agent cannot grant a waiver
- [ ] Publish with `gh workflow run "CI / CD" --ref main -f source_ref=<full sha> -f publish=true -f confirm_version=<version>` (irreversible); **never** `pnpm publish:lib` or `npm publish` locally
- [ ] Verify npm integrity vs `release-manifest.json`, provenance, GitHub Release at the source SHA, Cloudflare deploy, and a clean consumer install
- [ ] Update `docs/ai/STATE.md` and the acceptance record with actual (not intended) state

## Verification commands (memorize)

```bash
pnpm start          # dev server → http://localhost:5173
pnpm typecheck      # lib + app tsconfigs
pnpm test           # all Vitest workspaces, once
pnpm lint           # eslint over lib + app
pnpm e2e            # Playwright (auto-starts dev server)
```

The pre-commit hook runs lint-staged + typecheck + test. If you skipped them, the commit
fails — so run them yourself first and report real results, never claim "should pass".
