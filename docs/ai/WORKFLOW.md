# WORKFLOW — Spec-Driven Development + Checklists

## The SDD loop (for anything bigger than a trivial fix)

```
1. SPEC    → copy docs/ai/specs/_TEMPLATE.md to docs/ai/specs/<feature>.md, fill it in
2. REVIEW  → the user approves/edits the spec (STOP and show it before coding)
3. BUILD   → implement exactly what the spec says, smallest diff that satisfies it
4. VERIFY  → pnpm typecheck && pnpm test (+ pnpm e2e if user-visible), demo page by hand
5. RECORD  → mark spec status Done; update docs/ai/STATE.md; update CLAUDE.md if
             architecture changed
```

Rules for weaker models, be strict with yourself:

- **Never start coding without reading** `CONTEXT.md`, `STATE.md`, and the relevant part of
  `ARCHITECTURE.md`. It takes 2 minutes and prevents 80% of wasted work.
- **One spec = one branch = one PR.** Branch naming: `feature/<topic>`.
- **If the spec and reality conflict mid-build**, stop and update the spec — don't
  improvise silently.
- **If you're unsure whether something belongs in the library or the demo app**: styling,
  icons, Tailwind, Volt-UI → demo app. Behaviour, a11y, positioning → library.

## Checklist: add a NEW primitive

Copy this into your working notes and tick every box:

- [ ] Spec written in `docs/ai/specs/<name>.md` and approved
- [ ] Folder `packages/quartz/src/lib/<name>/` following the anatomy in ARCHITECTURE.md:
      `<name>.types.ts` (+ `DEFAULT_<NAME>_CONFIG`), service/directives/components,
      `index.ts` barrel
- [ ] SSR-safe: no `document`/`window` at import time; `inject(DOCUMENT)` +
      `defaultView` guard (copy the overlay pattern)
- [ ] Keyboard support + ARIA roles/attributes implemented (this is the product, not a nice-to-have)
- [ ] Exports added to `packages/quartz/src/public-api.ts`
- [ ] Unit tests `*.spec.ts` next to source (host-component pattern, fake timers if needed,
      DOM cleanup in `afterEach`)
- [ ] `cli/registry.js`: entry with `files` list (no specs), `deps` if it imports another
      primitive, `docs` URL; remove `soon: true` if present
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
      `pnpm exec vitest run packages/quartz/src/lib/<x>/<x>.spec.ts`

## Checklist: demo/docs app change only

- [ ] No imports from demo app into `packages/quartz/` (one-way street)
- [ ] New `(docs)/` page → check the Vite-cache/extraRoutes gotcha
- [ ] `pnpm typecheck` (app tsconfig) + visual check on `localhost:5173` (`pnpm start`)

## Checklist: release / publish

- [ ] All tests green on `main`
- [ ] Bump `version` in `packages/quartz/package.json` (NOT the root package.json)
- [ ] `pnpm publish:lib` (runs `build:lib`, copies README/LICENSE, publishes `dist/quartz/`)
      — requires `npm login`
- [ ] Deploy docs if demo changed: `pnpm pages:deploy`
- [ ] Update version in `docs/ai/STATE.md`

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
