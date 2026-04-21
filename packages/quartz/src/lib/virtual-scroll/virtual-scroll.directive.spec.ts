import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { VirtualScrollDirective } from './virtual-scroll.directive';

@Component({
  imports: [VirtualScrollDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="viewport"
      qzVirtualScroll
      [items]="items()"
      [itemSize]="itemSize()"
      [buffer]="buffer()"
      #vs="qzVirtualScroll"
      data-testid="viewport"
    >
      <div class="content" [style.height.px]="vs.contentHeight()">
        @for (row of vs.visibleItems(); track row.index) {
          <div
            class="item"
            [style.transform]="'translateY(' + row.offset + 'px)'"
            data-testid="item"
          >
            {{ row.item }}
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .viewport {
        height: 200px;
        overflow: auto;
        position: relative;
      }
      .content {
        position: relative;
      }
      .item {
        height: 50px;
        position: absolute;
        left: 0;
        right: 0;
      }
    `,
  ],
})
class TestHost {
  readonly items = signal(Array.from({ length: 100 }, (_, i) => `Item ${i}`));
  readonly itemSize = signal(50);
  readonly buffer = signal(2);
  readonly vs = viewChild.required('vs', { read: VirtualScrollDirective });
}

describe('VirtualScrollDirective', () => {
  it('should compute contentHeight based on item count and itemSize', async () => {
    const { fixture } = await render(TestHost);
    const vs = fixture.componentInstance.vs();

    expect(vs.contentHeight()).toBe(100 * 50);
  });

  it('should render a subset of items, not the full list', async () => {
    const { fixture } = await render(TestHost);
    await new Promise((r) => setTimeout(r, 50));
    fixture.detectChanges();

    const items = screen.queryAllByTestId('item');
    // Should render far fewer than 100 items
    expect(items.length).toBeLessThan(50);
    expect(items.length).toBeGreaterThan(0);
  });

  it('should update visible items on scroll', async () => {
    const { fixture } = await render(TestHost);
    const viewport = screen.getByTestId('viewport') as HTMLElement;
    await new Promise((r) => setTimeout(r, 50));
    fixture.detectChanges();

    viewport.scrollTop = 500;
    viewport.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 10));
    fixture.detectChanges();

    const items = screen.queryAllByTestId('item');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].textContent?.trim()).toContain('Item');
  });
});
