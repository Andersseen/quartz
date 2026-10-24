---
title: Scroll Lock
description: 'A small Document-scoped foundation for locking body scroll across nested dialogs, drawers and floating workflows.'
group: Core
order: 33
---

## At a glance

- **Nested** — Multiple consumers coordinate through a per-Document lock count
- **SSR** — No DOM work when there is no browser window
- **Cleanup** — destroy releases every outstanding lock for the consumer
- **CLI** — pnpm quartz add scroll-lock

## Live examples

::demo[scroll-lock]

## Code

### Document lock

```ts
import { DOCUMENT } from '@angular/common';
import { inject, signal } from '@angular/core';
import { createScrollLock } from '@quartz-headless/core';

private readonly document = inject(DOCUMENT);
private readonly scrollLock = createScrollLock(this.document);
locked = signal(false);

lock(): void {
  this.scrollLock.lock();
  this.locked.set(true);
}
```
