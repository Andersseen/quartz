# Quartz UI

Headless, unstyled Angular 21 UI primitives. You own the styles — Quartz owns the behaviour.

[![npm](https://img.shields.io/npm/v/quartz-ui)](https://www.npmjs.com/package/quartz-ui)
[![license](https://img.shields.io/github/license/Andersseen/quartz)](LICENSE)
[![angular](https://img.shields.io/badge/angular-21-red)](https://angular.dev)

**[Docs & demos →](https://quartz-ui.pages.dev)**

---

## Primitives

| Primitive        | Description                                                             |
| ---------------- | ----------------------------------------------------------------------- |
| `overlay`        | Portal-based positioning system for dropdowns, menus, and popovers      |
| `dialog`         | Service-driven dialog and drawer with backdrop and focus trap           |
| `splitter`       | Resizable panel system with keyboard navigation and touch support       |
| `toast`          | Lightweight notification system with position groups and auto-dismiss   |
| `drag-drop`      | Accessible drag and drop with keyboard support                          |
| `tooltip`        | Accessible tooltip with configurable placement _(coming soon)_          |
| `listbox`        | WAI-ARIA listbox with keyboard navigation and selection _(coming soon)_ |
| `tree`           | Collapsible tree with keyboard navigation and selection                 |
| `virtual-scroll` | Windowed rendering for long lists                                       |
| `viewport`       | Reactive breakpoint service with `ViewportMatchDirective`               |

All primitives are **zoneless** (Angular signals), **standalone**, and **tree-shakeable**.

---

## Getting started

### Option A — npm package

```bash
npm install quartz-ui
```

```ts
// app.config.ts
import { provideZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection()],
};
```

```ts
// your.component.ts
import { OverlayTriggerDirective } from 'quartz-ui';

@Component({
  imports: [OverlayTriggerDirective],
  template: `
    <button qzOverlayTrigger [overlayTemplate]="tpl" placement="bottom-start">Open dropdown</button>

    <ng-template #tpl>
      <ul class="my-menu">
        ...
      </ul>
    </ng-template>
  `,
})
export class MyComponent {}
```

### Option B — copy source with the CLI

The CLI copies the raw TypeScript source into your project so you own the code and can modify it freely. Clone the Quartz repo and run from within it:

```bash
git clone https://github.com/Andersseen/quartz.git
cd quartz && pnpm install

# List available primitives
pnpm quartz list

# Add one or more (transitive deps resolved automatically)
pnpm quartz add overlay
pnpm quartz add overlay dialog splitter

# Custom output directory
pnpm quartz add toast --output src/app/ui
```

Files are copied into your project's `src/lib/components/<name>/` (auto-detected) or the path you specify with `--output`.

---

## Peer requirements

| Dependency        | Version   |
| ----------------- | --------- |
| `@angular/core`   | `^21.0.0` |
| `@angular/common` | `^21.0.0` |
| Node.js           | `>=20`    |

---

## Local development

```bash
# Install dependencies
pnpm install

# Dev server — http://localhost:5173
pnpm start

# Build the library (output: dist/quartz/)
pnpm build:lib

# Unit tests (Vitest)
pnpm test
pnpm test:watch

# E2E tests (Playwright — starts dev server automatically)
pnpm e2e
pnpm e2e:ui

# Type check
pnpm typecheck

# Lint & format
pnpm lint
pnpm format
```

### Adding a new primitive

1. Create `packages/quartz/src/lib/<name>/` following the existing pattern.
2. Export from `packages/quartz/src/public-api.ts`.
3. Register in `cli/registry.js` (name, files, optional `deps`).
4. Add a demo page under `src/app/pages/(docs)/<name>.page.ts`.

### Publishing

```bash
# Ensure you're logged in: npm login
pnpm publish:lib
```

---

## License

[MIT](LICENSE) © Andersseen
