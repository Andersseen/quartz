---
title: Focus
description: Focusable queries, a focus trap and a safe focus restorer.
group: Core
order: 21
---

Helpers used by Dialog, Popover, Menu and Select to place, contain and restore focus.

```ts
import { createFocusRestorer, createFocusTrap, focusSafely } from '@quartz-headless/core';

const restorer = createFocusRestorer(document); // remembers document.activeElement
const trap = createFocusTrap(panel, document); // Tab/Shift+Tab stay inside `panel`
panel.addEventListener('keydown', (event) => trap.handleKeydown(event));

// later
trap.destroy();
restorer.restore(); // returns focus if the element still exists
```

| Export                                 | Purpose                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `getFocusableElements(container)`      | Tab-reachable descendants in DOM order (excludes disabled, hidden, inert, `aria-hidden` and explicit negative `tabindex`) |
| `isFocusable(element)`                 | Whether `element.focus()` can work now (connected, not disabled/hidden/inert/`display:none`)                              |
| `focusInitialElement(container)`       | Focus the first tabbable descendant, or make the container script-focusable and focus it                                  |
| `focusSafely(element)`                 | Focus only if focusable; returns the element when it took focus, otherwise `null` (never throws)                          |
| `createFocusTrap(container, document)` | Keyboard focus containment                                                                                                |
| `createFocusRestorer(document)`        | Capture now, restore later                                                                                                |

`focusSafely` is what popups call when they return focus to their trigger, so a trigger destroyed during close is not an error.
