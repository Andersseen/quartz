import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PopoverDirective } from './popover.directive';
import { PopoverTriggerDirective } from './popover-trigger.directive';
import type { OverlayPlacement } from '@quartz-headless/core';

@Component({
  standalone: true,
  imports: [PopoverDirective, PopoverTriggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      qzPopoverTrigger
      [popover]="tpl"
      [placement]="placement()"
      [arrowSize]="size()"
      [arrowPadding]="padding()"
    >
      Trigger
    </button>
    <ng-template #tpl let-arrow="arrow" let-placement="placement" let-open="open">
      <div qzPopover data-testid="panel" [attr.data-ctx]="placement() + ':' + open()">
        @if (arrow()?.available) {
          <i data-testid="arrow" [style.left.px]="arrow()!.offset"></i>
        }
        <button>Inside</button>
      </div>
    </ng-template>
  `,
})
class Host {
  readonly placement = signal<OverlayPlacement>('bottom');
  readonly size = signal<number | undefined>(8);
  readonly padding = signal(0);
}

let rect = { left: 200, top: 100, width: 40, height: 20 };

describe('Popover arrow geometry', () => {
  beforeEach(() => {
    rect = { left: 200, top: 100, width: 40, height: 20 };
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get: () => 120,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get: () => 60,
    });
    vi.spyOn(HTMLButtonElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => ({ ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height }) as DOMRect,
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete (HTMLElement.prototype as unknown as Record<string, unknown>)['offsetWidth'];
    delete (HTMLElement.prototype as unknown as Record<string, unknown>)['offsetHeight'];
    document.querySelectorAll('[data-qz-overlay-container]').forEach((el) => el.remove());
  });

  async function open() {
    const result = await render(Host);
    const trigger = screen.getByText('Trigger');
    const directive = result.fixture.debugElement
      .query(By.directive(PopoverTriggerDirective))
      .injector.get(PopoverTriggerDirective);
    fireEvent.click(trigger);
    await screen.findByTestId('panel');
    await waitFor(() => expect(directive.arrow()).not.toBeNull());
    return { ...result, trigger, directive };
  }

  it('exposes arrow geometry on the directive, the surface and the template context', async () => {
    const { directive } = await open();
    // surface left = 220 - 60 = 160; arrow start = 60 - 4
    expect(directive.arrow()).toMatchObject({
      side: 'bottom',
      edge: 'top',
      axis: 'x',
      available: true,
      offset: 56,
    });
    const panel = screen.getByTestId('panel');
    expect(panel.getAttribute('data-side')).toBe('bottom');
    expect(panel.style.getPropertyValue('--qz-arrow-x')).toBe('56px');
    expect(panel.getAttribute('data-ctx')).toBe('bottom:true');
    await waitFor(() => expect(screen.getByTestId('arrow').style.left).toBe('56px'));
  });

  it('reports the resolved placement after a flip, in the state and on the surface', async () => {
    rect = { left: 200, top: 580, width: 40, height: 20 };
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 640 });
    const { directive } = await open();
    expect(directive.resolvedPlacement()).toBe('top');
    expect(directive.arrow()).toMatchObject({ side: 'top', edge: 'bottom' });
    expect(screen.getByTestId('panel').getAttribute('data-placement')).toBe('top');
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
  });

  it('keeps the arrow on the anchor when the surface is shifted into the viewport', async () => {
    rect = { left: 10, top: 100, width: 20, height: 20 };
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    const { directive } = await open();
    // centered surface would start at -40 → clamped to 8; anchor center 20 → 12px in
    expect(directive.arrow()!.offset).toBe(12 - 4);
    expect(directive.arrow()!.available).toBe(true);
  });

  it('hides the arrow when the surface cannot hold it plus padding', async () => {
    const { directive, fixture, trigger } = await open();
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.queryByTestId('panel')).toBeNull());
    fixture.componentInstance.padding.set(60);
    fixture.detectChanges();
    fireEvent.click(trigger);
    await screen.findByTestId('panel');
    await waitFor(() => expect(directive.arrow()).not.toBeNull());
    expect(directive.arrow()!.available).toBe(false);
    expect(screen.getByTestId('panel').getAttribute('data-qz-arrow')).toBe('hidden');
    expect(screen.queryByTestId('arrow')).toBeNull();
  });

  it('clears arrow state and stale references on close, then recomputes on reopen', async () => {
    const { directive, trigger } = await open();
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.queryByTestId('panel')).toBeNull());
    expect(directive.arrow()).toBeNull();
    expect(directive.resolvedPlacement()).toBeNull();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger.hasAttribute('aria-controls')).toBe(false);
    fireEvent.click(trigger);
    await screen.findByTestId('panel');
    await waitFor(() => expect(directive.arrow()?.available).toBe(true));
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger.getAttribute('aria-controls')).toBe(screen.getByTestId('panel').id);
  });

  it('gives no arrow data without arrowSize', async () => {
    const result = await render(Host);
    result.fixture.componentInstance.size.set(undefined);
    result.fixture.detectChanges();
    fireEvent.click(screen.getByText('Trigger'));
    const panel = await screen.findByTestId('panel');
    await waitFor(() => expect(panel.getAttribute('data-ctx')).toBe('bottom:true'));
    expect(panel.hasAttribute('data-side')).toBe(false);
  });

  it('never leaves non-finite offsets when the anchor has no geometry', async () => {
    rect = { left: NaN, top: 100, width: 40, height: 20 };
    const result = await render(Host);
    const directive = result.fixture.debugElement
      .query(By.directive(PopoverTriggerDirective))
      .injector.get(PopoverTriggerDirective);
    fireEvent.click(screen.getByText('Trigger'));
    await screen.findByTestId('panel');
    await waitFor(() => expect(directive.arrow()).not.toBeNull());
    expect(directive.arrow()!.available).toBe(false);
    expect(directive.arrow()!.offset).toBeNull();
  });
});
