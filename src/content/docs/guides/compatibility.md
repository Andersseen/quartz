---
title: Compatibility
description: Verified Angular, TypeScript, Node, browser, SSR and hydration support, and the limits of that evidence.
group: Guides
order: 17
---

Quartz is verified against **installed package tarballs** in a separate Angular application, not against the monorepo. The full statement, with reproduction commands, is in [`docs/compatibility.md`](https://github.com/Andersseen/quartz/blob/main/docs/compatibility.md).

## Supported versions

| Angular          | TypeScript | Node (Angular's table)                | Verified as          |
| ---------------- | ---------- | ------------------------------------- | -------------------- |
| 21.2.0           | 5.9        | `^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0` | declared **minimum** |
| 21.2.x (21.2.25) | 5.9        | same                                  | latest 21.2          |
| 22.x (22.2.4)    | 6.0        | `^22.22.3 \|\| ^24.15.0 \|\| ^26.0.0` | Angular 22           |

Peers: `@angular/core` and `@angular/common` `^21.2.0 || ^22.0.0`, `@angular/forms` the same range and **optional**, `rxjs` `^7.8.0`. Angular 21.0 and 21.1 are not supported: the Toast template uses an arrow function, which needs Angular 21.2.

## What was checked on each version

- Strict AOT (`strictTemplates`, `skipLibCheck: false`) of an app that imports only `@quartz-headless/core`, `@quartz-headless/primitives` and `@quartz-headless/primitives/forms`; a deliberately invalid binding must fail the build.
- Real server rendering: identical requests produce identical HTML, sequentially and concurrently.
- Hydration without errors, replaced server nodes, duplicate ids or dangling ARIA references.
- Keyboard and pointer interaction in Chromium, Firefox and WebKit, and axe on the meaningful states.

## SSR and hydration notes

- Generated ids are scoped to the Angular application (`QzIdGenerator`), so every request numbers from 1 and the server and client agree. Pass your own `id` to `qzFormField`.
- The server has no viewport: responsive primitives render their desktop default and settle after hydration. A hydrated Sidebar on a phone starts closed.
- Set the SSR host allow-list (`security.allowedHosts`, or `NG_ALLOWED_HOSTS`) or Angular silently falls back to client rendering.
- Under zoneless change detection, read non-signal state through a signal (`toSignal(control.valueChanges)`).

## Known limits

- **Genuine browser autofill is not verified** — automation cannot trigger it. `AutofillDirective` is best-effort and depends on the browser exposing `:-webkit-autofill` / `:autofill`; do not assume universal support.
- A physical IME and an OS-clipboard paste in Firefox/WebKit are manual-pending for `qz-input-otp`.
- No real screen-reader pass has been recorded yet; automated checks do not replace it.
