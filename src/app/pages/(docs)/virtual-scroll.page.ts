import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { VirtualScrollDirective } from 'quartz';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { BASIC_SNIPPET, API_SNIPPET } from './virtual-scroll.snippets';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-virtual-scroll-page',
  imports: [VirtualScrollDirective, DemoPageComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './virtual-scroll.page.html',
  styleUrl: './virtual-scroll.page.scss',
})
export default class VirtualScrollPage {
  readonly basicCode = BASIC_SNIPPET;
  readonly apiCode = API_SNIPPET;

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
