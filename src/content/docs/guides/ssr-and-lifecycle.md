---
title: SSR and lifecycle guarantees
description: What runs on the server, what is deferred to the browser and how primitives clean up.
group: Guides
order: 16
---

## Server rendering

Primitives are standalone directives with no DOM work at import time. Anything that needs layout (overlay positioning, scroll measurement, focus) runs in the browser only, and DOM access is guarded by the injected `DOCUMENT`/platform. Server DOMs without layout APIs (such as `getBoundingClientRect`) are tolerated: Virtual scroll keeps its default viewport height during prerendering.

This documentation site is itself prerendered statically and hydrated; its live examples are lazy `@defer (on idle)` blocks: the examples' code is a separate chunk, the server renders only a placeholder, and the example is created in the browser after hydration. Examples that look up `<ng-template>` queries therefore never take part in hydration.

> [!NOTE]
> Real SSR/hydration of every primitive across an Angular version matrix is scheduled for the 0.17 consumer-compatibility milestone; today's evidence is the prerendered documentation site and the unit suite.

## Lifecycle

- Popups (Select, Combobox, Menu, Popover, Dialog) close and detach their overlay, dismiss controller, subscriptions and timers when the host is destroyed; a destroyed control never emits a spurious `closed`.
- Collections unregister options on destroy; the active item moves to the nearest enabled option.
- `createLatestRequest()` aborts its in-flight request when its injector is destroyed.
- Modal isolation (`inert`, scroll lock) is reference-counted per Document and released on close.

## Modal composition

A Select, Combobox, Menu or Popover opened inside a Dialog renders above it and stays interactive; closing it restores focus to its trigger inside the dialog.
