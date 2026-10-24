---
title: Dismiss
description: One layered controller for Escape, outside pointer, focus-outside and scroll dismissal.
group: Core
order: 22
---

`createDismissController` implements the dismissal rules shared by every floating surface. Controllers on one `Document` form a stack: only the top layer reacts, and a single physical event dismisses a single layer.

```ts
import { createDismissController, type DismissReason } from '@quartz-headless/core';

const controller = createDismissController({
  document,
  escape: true,
  outsidePointer: true,
  focusOutside: true,
  scroll: false,
  rootElements: () => [panel], // clicks/focus inside these never dismiss
  excludeElements: () => [trigger], // the trigger handles its own toggle
  onDismiss: (reason: DismissReason, event) => close(reason),
});

// when the surface closes
controller.destroy();
```

| Reason            | Trigger                                              |
| ----------------- | ---------------------------------------------------- |
| `escape`          | Escape key                                           |
| `outside-pointer` | Pointer down outside `rootElements`                  |
| `focus-outside`   | Focus moves outside `rootElements`                   |
| `scroll`          | Scroll on `scrollTargets` (defaults to the document) |

Nested layers (a Select inside a Dialog) work because the top-most registered layer claims the event first.
