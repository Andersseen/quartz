export const BASIC_SNIPPET = `import { DOCUMENT } from '@angular/common';
import { inject, signal } from '@angular/core';
import { createScrollLock } from '@quartz-headless/core';

private readonly document = inject(DOCUMENT);
private readonly scrollLock = createScrollLock(this.document);
locked = signal(false);

lock(): void {
  this.scrollLock.lock();
  this.locked.set(true);
}`;
