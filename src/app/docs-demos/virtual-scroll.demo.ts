import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { VirtualScrollDirective } from '@quartz-headless/core';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-virtual-scroll-demo',
  imports: [VirtualScrollDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './virtual-scroll.demo.html',
})
export class VirtualScrollDemoComponent {
  readonly users = signal<User[]>(
    Array.from({ length: 10000 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: ['Admin', 'Editor', 'Viewer', 'Developer'][i % 4],
    })),
  );

  readonly itemSize = 56;
}
