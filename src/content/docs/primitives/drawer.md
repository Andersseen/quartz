---
title: Drawer
description: 'A modal panel anchored to a viewport edge, built on Dialog: physical and writing-direction-aware sides, focus management, inert background, scroll lock and an exit-presence lifecycle for CSS transitions.'
group: Primitives
order: 101
---

A Drawer is a [Dialog](/docs/primitives/dialog) anchored to an edge. It uses the same focus trap, focus restoration, background inertness, scroll lock and Escape/backdrop dismissal; it adds a side model, exit presence and lifecycle state hooks. Quartz ships no styling: you own width, height, background and motion.

## Live demo

::demo[drawer]

::playground[quartz-drawer]

## Installation and imports

```sh
pnpm quartz add drawer
```

`quartz add drawer` copies the `drawer` folder and the `dialog` folder it builds on; `@quartz-headless/core` is a peer dependency.

```ts
import { DrawerService, type DrawerSide } from '@quartz-headless/primitives';
```

## Accessible usage

```ts
private readonly drawers = inject(DrawerService);
private readonly vcr = inject(ViewContainerRef);

open(template: TemplateRef<unknown>): void {
  const ref = this.drawers.open(template, this.vcr, { side: 'inline-end' });
  ref.closed$.subscribe(() => this.refresh());
}
```

```html
<ng-template #panel let-ref let-labelledBy="ariaLabelledBy" let-describedBy="ariaDescribedBy">
  <h2 [id]="labelledBy">Account</h2>
  <p [id]="describedBy">Update your profile.</p>
  <button type="button" (click)="ref.close()">Close</button>
</ng-template>
```

The panel has `role="dialog"` and `aria-modal="true"`. Bind the template context's `ariaLabelledBy` / `ariaDescribedBy` to a title and a description, or pass `ariaLabel` in the config. A drawer without an accessible name logs a development warning.

## Configuration

`DrawerConfig` is `DialogConfig` without `position`, plus:

| Option                                           | Default        | Meaning                                                        |
| ------------------------------------------------ | -------------- | -------------------------------------------------------------- |
| `side`                                           | `'inline-end'` | `left`, `right`, `top`, `bottom`, `inline-start`, `inline-end` |
| `closeOnEscape`                                  | `true`         | Escape closes the topmost layer only                           |
| `closeOnBackdropClick`                           | `true`         | A pointer press on the backdrop closes it                      |
| `backdrop`                                       | `true`         | Render a backdrop element                                      |
| `presence`                                       | `true`         | Keep the panel mounted during a CSS exit transition            |
| `width`, `height`, `panelClass`, `backdropClass` | —              | Consumer-owned sizing and appearance                           |

`open()` returns a `DialogRef`: `close()` is idempotent, `closed$` emits exactly once after the panel is removed, and `state()` is a signal (`opening`, `open`, `closing`, `closed`).

## Sides and RTL

`left`, `right`, `top` and `bottom` are physical edges and never mirror. `inline-start` and `inline-end` follow the writing direction resolved from the host element: in LTR `inline-start` is the left edge and `inline-end` the right; in RTL they swap. The resolved physical edge is written to the panel as `data-side`. The side is fixed for one `open()` call; open a new drawer to change it. `DialogPosition` `left`/`right` on `DialogService` stay physical — drawers do not reinterpret them.

## Exit presence and state hooks

The panel, its wrapper and the backdrop carry `data-state`:

- `opening` — mounted for one frame, so a transition can start from enter styles;
- `open` — settled;
- `closing` — close was requested; the nodes stay mounted while your CSS runs;
- removed — after `transitionend`/`animationend` (or, as a safety net, shortly after the longest computed duration).

```css
.drawer {
  transition:
    transform 200ms,
    opacity 200ms;
}
.drawer[data-state='opening'],
.drawer[data-state='closing'] {
  opacity: 0;
  transform: translateX(24px);
}
```

Quartz never sets a duration. If nothing on the panel, wrapper or backdrop has a transition or animation, the drawer is removed synchronously. With `prefers-reduced-motion: reduce`, with `presence: false`, and when the host view is destroyed (for example a route change), removal and cleanup are immediate. While `closing`, the background stays inert and scroll stays locked; Escape, backdrop clicks and repeated `close()` calls are ignored, and `closed$` fires once. Focus returns to the opener when the exit completes.

## Keyboard and focus

Focus moves into the panel on open (a panel with no focusable content takes focus itself). Tab and Shift+Tab are trapped. Escape closes the topmost layer: a Popover, Menu, Select or Tooltip opened inside the drawer closes first, then the drawer on the next press. Nested Drawers and Dialogs stack; only the topmost one reacts.

## Drawer vs Dialog

Use `DialogService` for a centered modal; use `DrawerService` when the surface is attached to an edge or needs an exit transition. A Drawer does not replace Dialog and `DialogService.open` keeps its behavior.

## SSR

`open()` returns an already-closed `DialogRef` on the server and renders nothing. Open drawers from user interaction in the browser.

## Differences from Volt and limitations

Quartz does not implement swipe or gesture-to-dismiss, nor Volt's visual styles. The side is not reactive after open. Width and height are consumer concerns; the panel only applies `max-width`/`max-height: 100%` and `overflow: auto`.
