<div align="center">

# 🪨 Quartz Headless

### Unstyled, accessible Angular 21 UI primitives.

**You own the styles — Quartz owns the behaviour.**

[![npm version](https://img.shields.io/npm/v/quartz-headless?style=flat-square&color=7c3aed&label=npm)](https://www.npmjs.com/package/quartz-headless)
[![npm downloads](https://img.shields.io/npm/dm/quartz-headless?style=flat-square&color=7c3aed)](https://www.npmjs.com/package/quartz-headless)
[![CI/CD](https://img.shields.io/github/actions/workflow/status/Andersseen/quartz/deploy.yml?branch=main&style=flat-square&color=7c3aed&label=ci%2Fcd)](https://github.com/Andersseen/quartz/actions/workflows/deploy.yml)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/quartz-headless?style=flat-square&color=7c3aed&label=min%2Bgzip)](https://bundlephobia.com/package/quartz-headless)
[![Angular](https://img.shields.io/badge/angular-21-dd0031?style=flat-square)](https://angular.dev)
[![license](https://img.shields.io/github/license/Andersseen/quartz?style=flat-square&color=7c3aed)](LICENSE)

**[🌐 Live docs & demos](https://quartz-headless.pages.dev)** · [📦 npm](https://www.npmjs.com/package/quartz-headless) · [🐛 Report a bug](https://github.com/Andersseen/quartz/issues)

</div>

---

Quartz is the **behaviour layer** for Angular design systems — overlay positioning, focus
traps, drag &amp; drop, keyboard navigation and reactive state — with **zero CSS opinions**.
It is Radix UI / Headless UI _for Angular_, combined with the shadcn/ui "copy the source into
your project" distribution model.

Quartz ships as two packages: **`@quartz-headless/core`** (low-level infrastructure — think
Angular CDK) and **`@quartz-headless/primitives`** (accessible UI patterns built on Core).

```ts
// Behaviour in, styling yours.
import { OverlayTriggerDirective } from '@quartz-headless/core';

@Component({
  imports: [OverlayTriggerDirective],
  template: `
    <button qzOverlayTrigger [overlayTemplate]="menu" placement="bottom-start">Open</button>
    <ng-template #menu><div class="your-styles">…</div></ng-template>
  `,
})
export class Demo {}
```

## ✨ Why Quartz

|                         |                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 🎨 **No visual theme**  | No theme or visual design opinions. Structural portal/layout styles only where behaviour requires them; use `data-qz-*` hooks for your UI. |
| ⚡ **Zoneless**         | Built for `provideZonelessChangeDetection()` — signals all the way down.                                                                   |
| ♿ **Accessible**       | WAI-ARIA roles, focus management and full keyboard support baked in.                                                                       |
| 🌳 **Tree-shakeable**   | Standalone directives &amp; services with no import-time side effects.                                                                     |
| 🖥️ **SSR-safe**         | Guards DOM access so it runs cleanly under Angular server rendering.                                                                       |
| 📦 **Two ways to ship** | Install the npm package _or_ copy the raw source with the CLI — your call.                                                                 |

## 🚀 Install

### Option A — npm packages

```bash
npm install @quartz-headless/core @quartz-headless/primitives
# or just the core package if you're building your own patterns on top of it:
npm install @quartz-headless/core
```

```ts
// app.config.ts
import { provideZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection()],
};
```

> The previous unscoped `quartz-headless` package is **frozen** at its last published
> version — new work happens in the two packages above.

### Option B — copy the source (shadcn-style)

The CLI copies raw TypeScript into your project, so you own the code and can modify it freely.

```bash
git clone https://github.com/Andersseen/quartz.git
cd quartz && pnpm install

pnpm quartz list                    # see everything available
pnpm quartz add overlay             # add one Core piece (+ its Core deps)
pnpm quartz add dialog splitter     # add several at once
pnpm quartz add toast --output src/app/ui
```

Files land flat in your project's `src/lib/components/<name>/` (auto-detected) or the
`--output` path. **Core** pieces (overlay, dismiss, focus, collection, viewport, drag-drop,
virtual-scroll, splitter) stay pure copy-source with zero npm dependencies — copying one
pulls in its Core siblings too (e.g. `overlay` also copies `dismiss`). **Primitives**
(dialog, tooltip, toast, tree, listbox) depend on `@quartz-headless/core` as a real npm
package instead of copied source — `pnpm quartz add dialog` copies only `dialog/` and tells
you to `npm install @quartz-headless/core`.

## 🧩 Primitives

| Primitive                                                            | Package                       | What it gives you                                                                  |
| -------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------- |
| [`overlay`](https://quartz-headless.pages.dev/overlay)               | `@quartz-headless/core`       | Portal-based positioning for dropdowns, menus and popovers                         |
| [`dialog`](https://quartz-headless.pages.dev/dialog)                 | `@quartz-headless/primitives` | Service-driven dialog &amp; drawer with backdrop and focus trap                    |
| [`splitter`](https://quartz-headless.pages.dev/splitter)             | `@quartz-headless/core`       | Resizable panels with keyboard, touch and ARIA slider semantics                    |
| [`toast`](https://quartz-headless.pages.dev/toast)                   | `@quartz-headless/primitives` | Notification system with position groups and auto-dismiss                          |
| [`drag-drop`](https://quartz-headless.pages.dev/drag-drop)           | `@quartz-headless/core`       | Native HTML drag &amp; drop with sortable drop zones                               |
| [`tooltip`](https://quartz-headless.pages.dev/tooltip)               | `@quartz-headless/primitives` | Hover/focus tooltip with configurable placement                                    |
| [`tree`](https://quartz-headless.pages.dev/tree)                     | `@quartz-headless/primitives` | Tree view with roving tabindex, WAI-ARIA keyboard nav &amp; lazy per-level loading |
| [`listbox`](https://quartz-headless.pages.dev/listbox)               | `@quartz-headless/primitives` | Single/multi selection with WAI-ARIA keyboard navigation and type-ahead            |
| [`virtual-scroll`](https://quartz-headless.pages.dev/virtual-scroll) | `@quartz-headless/core`       | Windowed rendering for long lists                                                  |
| [`viewport`](https://quartz-headless.pages.dev/viewport)             | `@quartz-headless/core`       | Reactive breakpoint service + `ViewportMatchDirective`                             |

Every primitive is **zoneless**, **standalone** and **tree-shakeable**. Drag &amp; drop follows the browser's native pointer-based HTML DnD model; keyboard drag-and-drop is intentionally deferred to a dedicated future primitive.

## 🛠 Example

```ts
import { Component, inject, ViewContainerRef, TemplateRef, viewChild } from '@angular/core';
import { DialogService } from '@quartz-headless/primitives';

@Component({
  template: `
    <button (click)="open()">Open dialog</button>
    <ng-template #tpl let-ref>
      <div class="your-modal">
        <h2>Delete item?</h2>
        <button (click)="ref.close()">Cancel</button>
      </div>
    </ng-template>
  `,
})
export class Example {
  private dialog = inject(DialogService);
  private vcr = inject(ViewContainerRef);
  private tpl = viewChild.required<TemplateRef<unknown>>('tpl');

  open() {
    this.dialog.open(this.tpl(), this.vcr, { position: 'center' });
  }
}
```

## 📋 Requirements

| Dependency        | Version              |
| ----------------- | -------------------- |
| `@angular/core`   | `^21.0.0` (zoneless) |
| `@angular/common` | `^21.0.0`            |
| Node.js           | `>= 20`              |

No runtime dependencies beyond `@angular/*`, `rxjs` and `tslib`.

## 💻 Local development

```bash
pnpm install
pnpm start          # dev server → http://localhost:5173
pnpm build:lib      # build both libraries → packages/core/dist/, packages/primitives/dist/
pnpm test           # unit tests (Vitest)
pnpm e2e            # end-to-end tests (Playwright)
pnpm typecheck      # type check both libs + app
pnpm lint           # lint
```

The demo/docs site is an [AnalogJS](https://analogjs.org) app deployed to **Cloudflare Pages**
(`pnpm pages:deploy`). See [`docs/ai/`](docs/ai/) for architecture and contribution notes —
in particular, read `docs/ai/ARCHITECTURE.md` before changing how the two packages resolve
each other; the constraints there (why cross-package imports must go through `node_modules`
and not a source-pointing tsconfig path) aren't obvious and are easy to accidentally break.

### Adding a primitive

1. Create `packages/core/src/<name>/` (low-level infrastructure) or
   `packages/primitives/src/<name>/` (accessible UI pattern) following the existing pattern.
2. Export it from that package's `src/public-api.ts`.
3. Register it in `cli/registry.js` (name, `layer`, files, `deps` for Core-internal
   siblings or `peerDeps: ['@quartz-headless/core']` for a new Primitive).
4. Add a demo page at `src/app/pages/(docs)/<name>.page.ts`, importing from
   `@quartz-headless/core` or `@quartz-headless/primitives` as appropriate.

## 🤝 Contributing

Issues and PRs are welcome. Run `pnpm test`, `pnpm lint` and `pnpm typecheck` before opening a
PR — the pre-commit hook and CI enforce all three.

## 📄 License

[MIT](LICENSE) © [Andersseen](https://github.com/Andersseen)
