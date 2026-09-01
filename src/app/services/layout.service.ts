import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly sidebarOpen = signal(false);
  readonly sidebarScrollTop = signal(0);

  toggle(): void {
    this.sidebarOpen.update((v) => !v);
  }

  close(): void {
    this.sidebarOpen.set(false);
  }

  rememberSidebarScroll(scrollTop: number): void {
    this.sidebarScrollTop.set(scrollTop);
  }
}
