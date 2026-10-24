---
title: Directionality
description: "Resolves LTR/RTL once, then exposes it as a signal plus small, widget-agnostic helpers — logical inline-start/end and the arrow key each one maps to — so Core foundations (and anything built on them) don't each bake in their own left/right assumption."
group: Core
order: 32
---

## At a glance

- **Signal** — direction: `Signal<Direction>`, resolved from the DOM
- **Logical helpers** — inline-start/end <-> left/right conversion
- **Keyboard helpers** — inlineStartKey / inlineEndKey / resolveInlineArrowKey
- **SSR Safe** — Pure attribute resolution, no window access

## Live examples

::demo[directionality]

## Code

### Direction service

```ts
import { Component, inject } from '@angular/core';
import { DirectionalityService } from '@quartz-headless/core';

@Component({
  selector: 'app-example',
  template: `<p>Current direction: {{ dir.direction() }}</p>`,
})
export class ExampleComponent {
  readonly dir = inject(DirectionalityService);
}
```

### Keyboard helpers

```ts
import { inlineStartKey, inlineEndKey, resolveInlineArrowKey } from '@quartz-headless/core';

// ltr: inlineStartKey('ltr') -> 'ArrowLeft', inlineEndKey('ltr') -> 'ArrowRight'
// rtl: inlineStartKey('rtl') -> 'ArrowRight', inlineEndKey('rtl') -> 'ArrowLeft'

function onKeydown(event: KeyboardEvent, direction: Direction) {
  const logical = resolveInlineArrowKey(direction, event.key);
  if (logical === 'inline-end') moveNext();
  if (logical === 'inline-start') movePrevious();
}
```

### Collection integration

```ts
import { CollectionStore } from '@quartz-headless/core';

// direction defaults to 'ltr' — pass 'rtl' to mirror horizontal Arrow keys
const store = new CollectionStore({ orientation: 'horizontal', direction: 'rtl' }, document);

// ArrowLeft now moves "next", ArrowRight moves "previous"
host.addEventListener('keydown', (e) => store.handleKeydown(e));
```

### Overlay integration

```html
<!-- placement 'bottom-start' resolves against the anchor's own dir -->
<button qzOverlayTrigger [overlayTemplate]="menu" placement="bottom-start">Open</button>

<!-- ltr: aligns to the anchor's left edge -->
<!-- rtl (e.g. inside <div dir="rtl">): aligns to the anchor's right edge -->
```
