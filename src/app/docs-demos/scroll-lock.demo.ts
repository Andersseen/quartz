import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { createScrollLock } from '@quartz-headless/core';

@Component({
  selector: 'app-scroll-lock-demo',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scroll-lock.demo.html',
})
export class ScrollLockDemoComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly scrollLock = createScrollLock(this.document);

  readonly locked = signal(false);
  lock(): void {
    this.scrollLock.lock();
    this.locked.set(this.scrollLock.locked);
  }

  unlock(): void {
    this.scrollLock.unlock();
    this.locked.set(this.scrollLock.locked);
  }

  ngOnDestroy(): void {
    this.scrollLock.destroy();
  }
}
