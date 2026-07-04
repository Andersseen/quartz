# @quartz/web

Experimental, framework-agnostic Quartz behaviors for the browser. No Angular runtime required.

This package is a testbed for primitives that may later move into a shared `quartz-core`. It exposes the same interaction patterns as `quartz-headless` (overlay, dialog, splitter, drag-drop, tooltip) as plain HTML attributes and low-level imperative APIs.

## Installation

This package is not published to npm yet. Import it from source or build it locally:

```bash
cd packages/quartz-web
pnpm build
```

Output: `dist/quartz-web/` (ESM + UMD).

## Usage

### Declarative attributes

Call `defineQuartzBehaviors()` once after your DOM is ready. It scans for `[qz-*]` attributes and wires up the corresponding behaviors.

```html
<!doctype html>
<html>
  <body>
    <div qz-splitter="horizontal" qz-splitter-default-position="30">
      <div qz-splitter-panel="primary">Left</div>
      <div qz-splitter-handle></div>
      <div qz-splitter-panel="secondary">Right</div>
    </div>

    <button qz-tooltip="Save changes" qz-tooltip-placement="top">Save</button>

    <button qz-dialog-trigger="my-dialog">Open dialog</button>
    <div id="my-dialog" qz-dialog-position="center">
      <h2>Hello</h2>
    </div>

    <script type="module">
      import { defineQuartzBehaviors } from './dist/quartz-web/quartz-web.es.js';
      const cleanup = defineQuartzBehaviors({ observe: true });
    </script>
  </body>
</html>
```

### Imperative APIs

For advanced use cases you can create and destroy behaviors manually:

```ts
import {
  createSplitter,
  createDraggable,
  createDropZone,
  createTooltip,
  createDialog,
} from '@quartz/web';

const splitter = createSplitter(document.getElementById('splitter')!, { orientation: 'vertical' });
// ...later
splitter.destroy();
```

## Behaviors

| Attribute           | Behavior                          | Imperative API                         |
| ------------------- | --------------------------------- | -------------------------------------- |
| `qz-splitter`       | Resizable panel container         | `createSplitter(container, options)`   |
| `qz-draggable`      | HTML5 drag source                 | `createDraggable(element, config)`     |
| `qz-drop-zone`      | Drop target with optional sorting | `createDropZone(element, config)`      |
| `qz-tooltip`        | Hover/focus tooltip               | `createTooltip(element, options)`      |
| `qz-dialog-trigger` | Modal/drawer trigger              | `createDialog(targetElement, options)` |

## Browser support

All behaviors touch the DOM and are meant for the browser only. `defineQuartzBehaviors()` should be called only after `document.body` is available (for example, inside a `DOMContentLoaded` handler or at the end of `<body>`).

## Development

```bash
# Run tests
pnpm test

# Type check
pnpm typecheck

# Build library
pnpm build
```
