import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { createScrollLock } from '@quartz-headless/core';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { BASIC_SNIPPET } from './scroll-lock.snippets';

@Component({
  selector: 'app-scroll-lock-page',
  imports: [DemoPageComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scroll-lock.page.html',
})
export default class ScrollLockPage implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly scrollLock = createScrollLock(this.document);

  readonly locked = signal(false);
  readonly code = BASIC_SNIPPET;

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
