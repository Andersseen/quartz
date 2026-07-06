# STATE — Current Project Status

> **Last updated: 2026-07-06** (P0 fixes in progress)
>
> ⚠️ **Agents: update this file at the end of any session that changes what's true here**
> (new primitive, status change, publish, new known issue). Update the date and commit ref.

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
| toast          | ✅       | ✅         | ✅         | ✅                | Uses `toast.model.ts` (not `.types.ts` — naming deviation)                           |
| drag-drop      | ✅       | ✅         | ✅         | ✅                |                                                                                      |
| tooltip        | ✅       | ✅         | ❌ no page | ✅ deps:[overlay] | Implemented recently; **demo page missing** (`(docs)/tooltip.page.ts` doesn't exist) |
| tree           | ✅       | ✅         | ✅         | ✅                | Needs manual extraRoute (already added)                                              |
| virtual-scroll | ✅       | ✅         | ✅         | ✅                | Has ResizeObserver support                                                           |
| viewport       | ✅       | ✅         | ✅         | ✅                |                                                                                      |

## In progress / next up

- **tooltip demo page**: tooltip is implemented and exported but has no
  `(docs)/tooltip.page.ts` — the docs URL referenced by the CLI (`…/tooltip`) 404s.
- **quartz-web** (`packages/quartz-web/`): experimental framework-agnostic behaviors
  (overlay, dialog, splitter, drag-drop, tooltip as `qz-*` HTML attributes). Not published,
  evolving toward a possible `quartz-core`. Recent work added "web attributes"
  (PR #14 `feature/web-agnostic`) and a demo page `(docs)/web-agnostic.page.ts`.

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
- PR #14 `feature/web-agnostic` — quartz-web attribute API.
- PR #12 `feature/tailiwnd` — Tailwind 4 in the demo app.
- PR #11 `feature/add-volt-ui` — demo app chrome migrated to `@voltui/components`.
