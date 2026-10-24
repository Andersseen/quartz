# Doqs integration feedback (Quartz 0.10)

Quartz adopted `@doqs/analog` as the engine of its official documentation and acted as a real external
consumer. Nothing in the Doqs repository was modified; every item below was reproduced in this
repository. Severity: **P0** blocker, **P1** serious integration defect, **P2** meaningful DX or feature
gap, **P3** polish/documentation. There were **no P0 and no P1** findings.

## 1. Environment

| Item                                | Value                                                                                                                                                    |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------- | ----------------------------------------------------------------------------------------------- |
| `@doqs/analog`                      | **0.10.0** from npm (`npm view @doqs/analog dist-tags` → `latest: 0.10.0`), pinned exactly                                                               |
| Quartz base commit                  | `32c55ab4ab97d7514b0031e2d51f9d64520b5c28` (0.9.0); the integration is in PR "feat: deliver Quartz 0.10 advanced selection and adopt Doqs documentation" |
| Angular                             | 21.2.6 (zoneless, `provideClientHydration(withEventReplay())`)                                                                                           |
| AnalogJS                            | `@analogjs/platform                                                                                                                                      | router | content | vite-plugin-angular`2.9.2 (upgraded from 2.4.8: required by the peer`@analogjs/content ^2.9.0`) |
| Vite / TypeScript / Pagefind / Node | 8.0.8 / 5.9.3 / 1.5.2 / 22.23.1                                                                                                                          |
| Deployment                          | static prerender → `dist/analog/public` → Cloudflare Pages                                                                                               |

Only the host application's Analog packages were upgraded; the headless libraries were untouched
and neither depends on Doqs (`@doqs/analog` is a website dependency only).

## 2. What worked (no action needed)

| Area                                       | Result                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Install / peers                            | Clean. `doq doctor --strict` passes 30 checks; its peer table matched the installed ranges.                                                                                                                                                                                                                                   |
| `doq init --dry-run`                       | Accurate printout of the four connection points; used as the checklist.                                                                                                                                                                                                                                                       |
| Routing (`doqRoutes` in `withExtraRoutes`) | Coexists with Analog's file router and Quartz's own routes (`/`, `/components`, test fixtures) with no duplicate routes.                                                                                                                                                                                                      |
| Prerender                                  | 281 documents + home/catalogue/fixtures prerendered; HTML contains the `<h1>`, description and TOC. Static serving with directory indexes and `_redirects` verified (E2E runs against a Cloudflare-like server, no SPA fallback).                                                                                             |
| Hydration                                  | No mismatch warnings/errors on the checked routes in Chromium, Firefox and WebKit (`e2e/docs.spec.ts › health`).                                                                                                                                                                                                              |
| `doq-api`                                  | 81 / 149 / 7 symbols for Core / Primitives / Forms, matching the export snapshots exactly, including the 0.10 additions; output deterministic; `check` exits 1 after a source change (it caught line-number drift when a comment was added). Three entry points = three `--out` directories, so there are no name collisions. |
| `doq content`                              | `::source{region}`, `::include` and `[[api:Name]]` resolved correctly; sources are read as text from `sourceRoots` only; `check` is stale-aware.                                                                                                                                                                              |
| `::demo` / `::playground`                  | Real Quartz primitives run inside Markdown pages; controls bind signal inputs, outputs show in the event list, usage code copies. Expand/reset/preview widths work.                                                                                                                                                           |
| Search                                     | Pagefind index built from the final prerendered output; dialog opens with button and Ctrl/Cmd+K; results link to valid routes (checked by E2E).                                                                                                                                                                               |
| Mobile                                     | Drawer opens/closes, navigates, no horizontal overflow at 375px.                                                                                                                                                                                                                                                              |
| Accessibility                              | axe scans of guide page, component page, search dialog, playground popup and the open mobile drawer pass after the host fixes below. Manual screen-reader testing was **not** performed.                                                                                                                                      |
| Styling                                    | The documented `--host-docs-*` tokens were enough to apply the Quartz dark palette; no CSS forked.                                                                                                                                                                                                                            |
| Errors                                     | `doq doctor` rejected a file named `0.9-to-0.10.md` with a precise message and fix.                                                                                                                                                                                                                                           |

## 3. Confirmed findings

### P2 — Active navigation link has no `aria-current`

- **Repro:** open `/docs/primitives/select`; inspect the sidebar link for Select.
- **Expected:** `aria-current="page"` on the current document's link.
- **Actual:** `class="doq-nav-link is-active"` only (`routerLinkActive="is-active"`).
- **Workaround:** none needed for axe; assistive technology does not announce the current page.
- **Owner:** Doqs. **Suggestion:** `ariaCurrentWhenActive="page"` on the sidebar links.

### P2 — Document pages have no `<main>` landmark (index page has one)

- **Repro:** axe on `/docs/guides/angular-forms` → `landmark-one-main` and `region` violations; the `/docs` index page does render a `<main>`.
- **Expected:** the document article inside a `<main>` (or a documented host requirement).
- **Actual:** only `<article>`; content sits outside any landmark.
- **Workaround (Quartz):** `role="main"` on the host wrapper for document routes only (`src/app/app.component.ts`); not on `/docs`, which would double the landmark.
- **Owner:** Doqs. **Suggestion:** render `<main>` in the document layout like the index does.

### P2 — Sidebar is re-created on every navigation and loses its scroll position

- **Repro:** at 1280×700 open `/docs/primitives/dialog`, scroll the sidebar until "Slider" is visible (`scrollTop` 436), click it. New page: `nav.doq-sidebar` is a new element with `scrollTop` 0.
- **Expected:** the navigation list keeps its place (the previous Quartz docs preserved it and had a test for it).
- **Workaround (Quartz):** capture/restore `scrollTop` across `NavigationEnd` (`app.component.ts`, covered by `navigation.spec.ts`).
- **Owner:** Doqs. **Suggestion:** keep the sidebar in a parent route component or persist the scroll offset.

### P2 — No per-document search exclusion

- **Repro:** index a site with ~240 generated API pages; search "combobox": the first results are `ComboboxAutocomplete › Overview` etc., not the Combobox guide.
- **Expected:** a way to keep generated pages out of the index (frontmatter such as `search: false`) or to weight guides above them. `doq-search index` only accepts `<siteDir> [--output]`.
- **Workaround (Quartz):** `scripts/prepare-search.mjs` removes `data-pagefind-body` from per-symbol API pages in the prerendered HTML before indexing (index pages stay indexed).
- **Owner:** Doqs.

### P2 — Every page embeds the whole navigation tree

- **Repro:** `dist/analog/public/docs/primitives/select/index.html` is 94 KB (13 KB gzip) of which roughly 60 KB is the sidebar listing all ~285 documents.
- **Impact:** grows linearly with the number of documents (generated API references are the main contributor); fine for a docs site of this size, worth a collapsed-group or lazy option for larger ones.
- **Owner:** Doqs (design trade-off). **Workaround:** none.

### P2 — `demos` accepts eager component classes only

- **Repro:** `defineDoqConfig({ demos: { select: SelectDemoComponent } })` imports every demo (and the Quartz primitives they use) into the initial application chunk.
- **Expected:** a lazy form (`() => import(...)`) so documentation demos can be code-split.
- **Workaround (Quartz):** each id is a tiny wrapper component that renders the real demo inside `@defer (on idle)`; the demo is a lazy chunk and is created in the browser only (`src/app/docs-demos/registry.ts`).
- **Owner:** Doqs (feature gap).

### P3 — Root `index.md` is not a document but is prerendered as `/docs/index`

- **Repro:** `src/content/docs/index.md` + `doqPrerenderRoutes({ contentDirectory: 'docs', basePath: '/docs' })`.
- **Actual:** `/docs/index` is emitted and rendered, while `normalizeDoqDocument` skips the root index (it normalises to an empty slug), so the file is absent from navigation and `/docs` shows the generated index instead.
- **Expected:** either a root `index.md` becomes the `/docs` page, or it is rejected/ignored consistently by prerender.
- **Workaround:** no root `index.md`; copy comes from `presentation`. `/docs/index` redirects to `/docs`.
- **Owner:** Doqs.

### P3 — An unresolved `::demo[…]` silently becomes literal text

- **Repro:** put an unclosed HTML-looking token such as `Signal<Direction>` in a list item above `::demo[id]` in the same document: the raw tag swallows the following content and the page shows `::demo[id]` as a paragraph.
- **Expected:** a build-time warning that a directive-looking line was left unresolved (Doctor could detect `^::(demo|playground)\[` in rendered output).
- **Owner:** shared (Markdown semantics + Doqs diagnostics). **Workaround:** backticks around generics.

### P3 — Dots are not allowed in document file names

- A natural name such as `0.9-to-0.10.md` fails `doq doctor` with the `slug` rule (clear message). Allowing `.` or offering automatic slugification would help release-note style pages. **Owner:** Doqs (suggestion). **Workaround:** `upgrading-to-0-10.md`.

### P3 — Formatters rewrite `::include` paths

- Running Prettier over `src/authoring` escaped `/_partials/…` to `/\_partials/…`; `doq content check` then failed with `missing-source`. The error is correct, but a note in the authoring guide ("exclude `src/authoring` from Markdown formatters") would save time. **Owner:** Doqs docs. **Workaround:** `.prettierignore`.

### P3 — `doq-api` shows `unknown` for transformed inputs

- `readonly multiple = input(false, { transform: booleanAttribute })` is listed as type `unknown`, with "reads as `boolean`" only in the description. Showing `boolean` (the accepted input type is wider, the read type is `boolean`) would be clearer. **Owner:** Doqs.

### P3 — No canonical link

- Prerendered pages carry no `<link rel="canonical">`. Not a defect against the requirement (no duplicates) but useful for the legacy-URL redirects. **Owner:** Doqs (feature suggestion; needs a `siteUrl` option).

### Not attributed to Doqs (recorded to avoid false reports)

- Angular SSR/hydration: `viewChild(…, { read: ViewContainerRef })` on an element, and `viewChild.required('tpl')` for `<ng-template>` queried inside SSR-rendered content, throw during hydration (`ASSERTION ERROR … no hydration info`, `NG0951`). Behaviour fixtures use `ngSkipHydration`; documentation demos are created client-side in `@defer`.
- During Analog prerendering `afterNextRender` callbacks ran (a Virtual-scroll measurement hit `getBoundingClientRect is not a function`, and `requestAnimationFrame is not defined` appeared in host code). Quartz fixed its own library code; whether Angular or Analog should skip these on the server was not investigated further.
- Early interactions immediately after `goto` can be lost before hydration completes; E2E waits for network idle.

## 4. Ready-to-file issue drafts

**Doqs issue 1 — Add `aria-current="page"` to the active sidebar link**
Environment: `@doqs/analog@0.10.0`, Angular 21.2.6. Repro: open any document; the current link has `class="doq-nav-link is-active"` and no `aria-current`. Expected `aria-current="page"` (e.g. `ariaCurrentWhenActive="page"` on `routerLinkActive`). Impact: screen-reader users are not told which page is current.

**Doqs issue 2 — Wrap the document page in `<main>`**
Repro: axe (`@axe-core/playwright`) on any document page: `landmark-one-main`, `region`. The index page renders `<main>`; documents render `<article>` only. Expected a single `<main>` landmark on both.

**Doqs issue 3 — Preserve sidebar scroll across document navigation**
Repro: scroll the sidebar, click a link lower in the list; the new `nav.doq-sidebar` starts at `scrollTop` 0. Suggest keeping the sidebar in the parent route or restoring the offset.

**Doqs issue 4 — Allow excluding documents from the Pagefind index**
Large generated API sections dominate results. Suggest `search: false` frontmatter (omit `data-pagefind-body`) or a `doq-search --exclude <glob>` option.

**Doqs issue 5 — Lazy `demos` registry entries**
`DoqDemoRegistry = Record<string, Type<unknown>>` forces eager imports. Suggest `Type | (() => Promise<Type>)`.

**Doqs issue 6 — Root `index.md` handling**
`doqPrerenderRoutes` emits `/docs/index` for `src/content/docs/index.md` while `normalizeDoqDocument` ignores it. Make them agree (render it at the base path, or skip it in prerender).

**Doqs issue 7 — Warn about unresolved `::demo` / `::playground` directives**
A directive line that survives Markdown rendering as literal text should produce a build/doctor warning.
