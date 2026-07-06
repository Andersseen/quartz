# CONTEXT — What Quartz Is and Why It Exists

## One-sentence pitch

**Quartz Headless** is a library of unstyled, accessible Angular 21 UI primitives —
"you own the styles, Quartz owns the behaviour."

## The problem it solves

Angular teams that want full design control have two bad options: heavy styled component
libraries (Material, PrimeNG) that fight custom design systems, or writing overlay
positioning, focus traps, drag-and-drop, and keyboard navigation from scratch every time.
Quartz provides only the hard behavioural part — positioning, a11y, keyboard support,
state management — with **zero CSS opinions**, so consumers style everything themselves
(typically with Tailwind or their own design system).

It is the Angular equivalent of what Radix UI / Headless UI are for React, combined with
the shadcn/ui distribution model (copy the source into your project).

## What success looks like

- A small, tree-shakeable set of primitives that work in **zoneless, signals-first
  Angular 21+** apps, including SSR.
- Two consumption paths that both stay first-class:
  1. **npm package** `quartz-headless` (built from `packages/quartz/` → `dist/quartz/`).
  2. **Copy-source CLI** — `pnpm quartz add <component>` copies raw `.ts` files into a
     consumer project (registry: `cli/registry.js`).
- A live docs/demo site — <https://quartz-headless.pages.dev> — built with AnalogJS and
  deployed to Cloudflare Pages, where every primitive has an interactive demo page with
  code snippets.
- Long-term (experimental): framework-agnostic versions of the same behaviours in
  `packages/quartz-web/` (plain DOM attributes, no Angular), possibly converging into a
  shared `quartz-core` someday.

## Non-goals (do NOT drift here)

- **No visual styling** in the library. No themes, no CSS files, no Tailwind classes in
  `packages/quartz/`. Data attributes (`data-qz-*`) and minimal structural inline styles
  (e.g. `position: fixed` for overlays) are the only allowed DOM styling.
- **No dependencies** beyond `@angular/*` peer deps, `rxjs`, `tslib`.
- **Not a component kit.** No buttons, inputs, cards. Only behavioural primitives.
- **No Zone.js support paths.** The library assumes `provideZonelessChangeDetection()`.

## Audience

- Angular developers building custom design systems.
- The author's own projects (the demo app itself uses `@voltui/components` from the
  sibling **Volt-UI** project, and the broader **Vertex** ecosystem consumes Quartz).

## Ecosystem / sibling projects

- **Volt-UI** (`@voltui/components`) — the author's _styled_ component library; used in
  the demo app for chrome (theming, layout). Quartz stays headless; Volt is the styled layer.
- **lumen-icons** — the author's icon set, used in the demo app only.
- **Vertex** — a larger project of the author that consumes these libraries.

## Key identifiers

| Thing           | Value                                          |
| --------------- | ---------------------------------------------- |
| npm package     | `quartz-headless`                              |
| GitHub          | `Andersseen/quartz`                            |
| Docs site       | https://quartz-headless.pages.dev              |
| License         | MIT                                            |
| Angular target  | ^21.0.0 (peer), zoneless, standalone           |
| Selector prefix | `qz-` / `qzCamelCase` (lib), `app-` (demo app) |
