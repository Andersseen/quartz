# STATE — Current Project Status

> **Last updated: 2026-07-24** (review-plan remediation — HEAD `1d20b94` + uncommitted work)
>
> ⚠️ **Agents: update this file at the end of any session that changes what's true here**
> (new primitive, status change, publish, new known issue). Update the date and commit ref.

## Review-plan remediation status (see `REVIEW_PLAN.md`)

All P0 items are done. This session additionally completed:

- **P1.1** Tree now follows the WAI-ARIA Tree pattern: roving tabindex, arrow/Home/End
  navigation, type-ahead, and `aria-level`/`aria-setsize`/`aria-posinset` (default template).
- **P1.2** removed the duplicate `TreeComponent` init (`effect` is the single source).
- **P1.3** `markForCheck()` removed from the tooltip. **P1.4** directive specs added for
  overlay-trigger (+ keyboard), splitter container/handle/panel, and drop-zone.
- **P2.1** removed unimplemented `VirtualScrollConfig.itemSizeFn`. **P2.2** `toast.model.ts`
  renamed to `toast.types.ts`. **P2.5** splitter handle ARIA (already present). **P2.6**
  keyboard activation on `OverlayTriggerDirective` (Enter/Space, guarded for native hosts).
- **P3.1** dead exports removed (`TooltipInstance`, `DragDropOrientation`, `animationDuration`).
  **P3.2** dialog snippet uses `inject()`.
- **P2.4** the CLI now scans copied files and auto-resolves any `../x` cross-component import,
  so `quartz add` output stays compilable even if a registry `deps` entry drifts.

Remaining plan items not yet done: **P1.5** (TreeService coverage target), **P2.4** could add
an end-to-end compile test, **P3.3** (AnalogJS route-cache workaround investigation),
**P3.4** (ReplaySubject vs Subject consistency). Tests: 82 passing.

## Version & publish status

- Library `quartz-headless` **v0.0.3** on npm. Root monorepo package stays private.
- Docs site live at <https://quartz-headless.pages.dev> (Cloudflare Pages).
- Pre-1.0: breaking API changes are acceptable but should be deliberate and documented in
  the README/demo pages.

## Primitive status matrix

| Primitive      | Lib code | Unit tests | Demo page  | CLI registry      | Notes                                                                                |
| -------------- | -------- | ---------- | ---------- | ----------------- | ------------------------------------------------------------------------------------ |
| overlay        | ✅       | ✅         | ✅         | ✅                | Foundation for dialog + tooltip                                                      |
| dialog         | ✅       | ✅ (+SSR)  | ✅         | ✅ deps:[overlay] | Includes drawer positioning                                                          |
| splitter       | ✅       | ✅         | ✅         | ✅                | Container-scoped service pattern                                                     |
| toast          | ✅       | ✅         | ✅         | ✅                | Types now in `toast.types.ts` (naming deviation resolved)                            |
| drag-drop      | ✅       | ✅         | ✅         | ✅                |                                                                                      |
| tooltip        | ✅       | ✅         | ❌ no page | ✅ deps:[overlay] | Implemented recently; **demo page missing** (`(docs)/tooltip.page.ts` doesn't exist) |
| tree           | ✅       | ✅         | ✅         | ✅                | WAI-ARIA keyboard nav + roving tabindex (default template). Manual extraRoute        |
| virtual-scroll | ✅       | ✅         | ✅         | ✅                | Has ResizeObserver support                                                           |
| viewport       | ✅       | ✅         | ✅         | ✅                |                                                                                      |

## In progress / next up

- **tooltip demo page**: tooltip is implemented and exported but has no
  `(docs)/tooltip.page.ts` — the docs URL referenced by the CLI (`…/tooltip`) 404s.

## Known issues / gotchas (live)

- **AnalogJS route cache**: new `(docs)/*.page.ts` files sometimes need a manual entry in
  `extraRoutes` (`src/app/app.config.ts`). Currently listed there: tree, virtual-scroll,
  viewport.
- CLAUDE.md may lag reality on small details (it previously claimed tooltip was
  `soon: true` in the CLI — it isn't anymore). When CLAUDE.md and the code disagree,
  **the code wins**; then fix CLAUDE.md.
- `package.json` has a machine-specific script `update-editor` pointing at a local Vertex
  path — ignore it, don't "fix" it, it's the author's local tooling.

## Recent history (context for "why is it like this")

- PR #15 `feature/lib-updates` — dialog + tooltip implementation, signal return types,
  ResizeObserver in virtual scroll, tooltip types.
- PR #12 `feature/tailiwnd` — Tailwind 4 in the demo app.
- PR #11 `feature/add-volt-ui` — demo app chrome migrated to `@voltui/components`.
