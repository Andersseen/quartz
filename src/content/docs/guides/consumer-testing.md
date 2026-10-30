---
title: Testing against the installed package
description: Install Quartz in an external Angular app, check SSR, hydration and accessibility, and keep an eye on bundle size.
group: Guides
order: 18
---

The most reliable way to know Quartz works in _your_ app is the same check the project runs on itself: install the packed tarballs into a project outside the workspace and build it for production.

## External installation

```bash
npm install @quartz-headless/core @quartz-headless/primitives
```

```ts
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  ProgressDirective,
  ProgressIndicatorDirective,
  ProgressTrackDirective,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-root',
  imports: [ProgressDirective, ProgressTrackDirective, ProgressIndicatorDirective],
  template: `<div qzProgress [value]="40" aria-label="Load">
    <div qzProgressTrack><div qzProgressIndicator></div></div>
  </div>`,
})
class App {}

bootstrapApplication(App, { providers: [provideZonelessChangeDetection()] });
```

This exact example is built by the bundle-size check (scenario `C-simple-primitive`) against the installed tarballs.

## Catch template mistakes at build time

Use the Angular application builder with `strictTemplates: true` and turn extended diagnostics into errors. The project proves its own setup can fail: its runner injects an invalid binding into a throw-away copy and requires the build to fail before running the real one.

## SSR and hydration checks worth copying

1. Render a route several times, sequentially and concurrently, and compare the HTML. Different output means request-scoped state leaked.
2. Open the server HTML in a browser with `readyState === 'interactive'` hooks and keep references to the interactive nodes; after hydration none of them may be disconnected.
3. Fail on console errors, duplicate ids and ARIA references (`aria-labelledby`, `aria-describedby`, `aria-activedescendant`) that point at nothing.
4. Resize the viewport after hydration to check responsive controls settle.

## Accessibility testing

Run axe on _states_ (dialog open, menu expanded, validation errors, disabled controls), then test keyboard behaviour separately: accessible names, focus order, focus restoration after Escape, disabled semantics and error announcements. Neither replaces a screen-reader pass; the project's manual matrix is `docs/releases/0.17-manual-a11y.md`.

## Bundle-size guidance

Measured with identical production settings against an empty zoneless app (see `docs/releases/0.17-bundle-size.md`):

- Importing one small Core utility adds well under 1 kB gzip.
- A single primitive costs mostly Angular's own directive runtime (signal inputs, host bindings); the report separates that baseline from Quartz's share.
- Unrelated primitives do not appear in a bundle (no Dialog code in a Progress-only app), and Core is never included twice.

Import from the package root; the bundler removes what you do not use.

## Troubleshooting

| Symptom                                                                    | Likely cause                                                                                              |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `Parser Error: Unexpected token )` inside `quartz-headless-primitives.mjs` | Angular older than 21.2; upgrade to `^21.2.0 \|\| ^22.0.0`                                                |
| `ERESOLVE … peer @angular/common`                                          | Angular outside `^21.2.0 \|\| ^22.0.0`                                                                    |
| SSR output is the empty `<app-root></app-root>` shell                      | Host not in `security.allowedHosts` — Angular fell back to client rendering                               |
| Ids differ between requests (older Quartz)                                 | Module-level id counters; upgrade to a version with `QzIdGenerator`                                       |
| "JIT compiler unavailable" in a Vite/Analog app                            | A component skipped AOT; build client and SSR environments sequentially (see the Quartz `vite.config.ts`) |
