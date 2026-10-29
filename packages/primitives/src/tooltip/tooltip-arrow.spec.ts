import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { render, screen } from '@testing-library/angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipDirective } from './tooltip.directive';

@Component({
  standalone: true,
  imports: [TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      qzTooltip="Hello"
      aria-describedby="existing"
      [tooltipPlacement]="placement()"
      [tooltipArrowSize]="size()"
      [tooltipArrowPadding]="padding()"
    >
      Anchor
    </button>
    <span id="existing">pre</span>
  `,
})
class TextHost {
  readonly placement = signal<'top' | 'bottom' | 'left' | 'right' | 'top-start'>('top');
  readonly size = signal<number | undefined>(8);
  readonly padding = signal(0);
}

@Component({
  standalone: true,
  imports: [TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button [qzTooltip]="tpl" tooltipPlacement="top" [tooltipArrowSize]="8">Anchor</button>
    <ng-template #tpl let-arrow="arrow" let-placement="placement">
      <div data-testid="tip" [attr.data-ctx-placement]="placement()">
        @if (arrow()?.available) {
          <i data-testid="arrow" [style.left.px]="arrow()!.offset"></i>
        }
      </div>
    </ng-template>
  `,
})
class TemplateHost {}

let anchorRect = { left: 200, top: 300, width: 40, height: 20 };

function mockLayout(): void {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get: () => 100,
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get: () => 40,
  });
  vi.spyOn(HTMLButtonElement.prototype, 'getBoundingClientRect').mockImplementation(
    () =>
      ({
        ...anchorRect,
        right: anchorRect.left + anchorRect.width,
        bottom: anchorRect.top + anchorRect.height,
      }) as DOMRect,
  );
}

async function showTooltip(fixtureHost: typeof TextHost | typeof TemplateHost) {
  const result = await render(fixtureHost as typeof TextHost);
  const button = screen.getByText('Anchor');
  button.dispatchEvent(new MouseEvent('mouseenter'));
  vi.advanceTimersByTime(400);
  vi.advanceTimersByTime(50);
  const directive = result.fixture.debugElement
    .query(By.directive(TooltipDirective))
    .injector.get(TooltipDirective);
  return { ...result, button, directive };
}

describe('Tooltip arrow geometry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    anchorRect = { left: 200, top: 300, width: 40, height: 20 };
    mockLayout();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete (HTMLElement.prototype as unknown as Record<string, unknown>)['offsetWidth'];
    delete (HTMLElement.prototype as unknown as Record<string, unknown>)['offsetHeight'];
    document.querySelectorAll('.qz-tooltip').forEach((el) => el.remove());
    document.querySelectorAll('[data-qz-overlay-container]').forEach((el) => el.remove());
  });

  it('exposes resolved placement, edge and CSS variables for a string tooltip', async () => {
    const { directive } = await showTooltip(TextHost);
    const tip = document.querySelector<HTMLElement>('.qz-tooltip')!;
    const arrow = directive.arrow()!;
    expect(arrow).toMatchObject({ side: 'top', edge: 'bottom', axis: 'x', available: true });
    // anchor center 220; tooltip left = 220 - 50 = 170 → arrow start = 50 - 4
    expect(arrow.offset).toBe(46);
    expect(tip.getAttribute('data-side')).toBe('top');
    expect(tip.getAttribute('data-placement')).toBe('top');
    expect(tip.style.getPropertyValue('--qz-arrow-x')).toBe('46px');
    expect(directive.resolvedPlacement()).toBe('top');
  });

  it('follows the tooltip after a flip near the viewport edge', async () => {
    anchorRect = { left: 200, top: 4, width: 40, height: 20 };
    const { directive } = await showTooltip(TextHost);
    expect(directive.resolvedPlacement()).toBe('bottom');
    expect(directive.arrow()).toMatchObject({ side: 'bottom', edge: 'top' });
    expect(document.querySelector('.qz-tooltip')!.getAttribute('data-side')).toBe('bottom');
  });

  it('applies padding and clamps for start alignment', async () => {
    const { directive, fixture } = await showTooltip(TextHost);
    directive.hide();
    vi.advanceTimersByTime(200);
    fixture.componentInstance.placement.set('top-start');
    fixture.componentInstance.padding.set(12);
    fixture.detectChanges();
    directive.show();
    vi.advanceTimersByTime(450);
    // left-aligned: anchor center is 20px into a surface starting at 200 → within padding track
    expect(directive.arrow()!.offset).toBe(16);
    expect(directive.arrow()!.alignment).toBe('start');
  });

  it('re-measures when the viewport or anchor changes', async () => {
    const { directive } = await showTooltip(TextHost);
    expect(directive.arrow()!.offset).toBe(46);
    anchorRect = { left: 230, top: 300, width: 40, height: 20 };
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(50);
    expect(directive.arrow()!.offset).toBe(46); // surface re-centers on the moved anchor
    expect(document.querySelector<HTMLElement>('.qz-tooltip')!.style.transform).toContain('200px');
  });

  it('hides the arrow when it cannot fit the tooltip edge', async () => {
    const { directive, fixture } = await showTooltip(TextHost);
    directive.hide();
    vi.advanceTimersByTime(200);
    fixture.componentInstance.size.set(150);
    fixture.detectChanges();
    directive.show();
    vi.advanceTimersByTime(450);
    expect(directive.arrow()!.available).toBe(false);
    const tip = document.querySelector<HTMLElement>('.qz-tooltip')!;
    expect(tip.getAttribute('data-qz-arrow')).toBe('hidden');
    expect(tip.style.getPropertyValue('--qz-arrow-x')).toBe('');
  });

  it('adds no arrow data when no arrow size is configured', async () => {
    const { directive, fixture } = await showTooltip(TextHost);
    directive.hide();
    vi.advanceTimersByTime(200);
    fixture.componentInstance.size.set(undefined);
    fixture.detectChanges();
    directive.show();
    vi.advanceTimersByTime(450);
    expect(directive.arrow()).toBeNull();
    expect(document.querySelector('.qz-tooltip')!.hasAttribute('data-side')).toBe(false);
    expect(directive.resolvedPlacement()).toBe('top');
  });

  it('preserves existing aria-describedby and clears arrow state on hide', async () => {
    const { directive, button } = await showTooltip(TextHost);
    const tokens = button.getAttribute('aria-describedby')!.split(' ');
    expect(tokens[0]).toBe('existing');
    expect(tokens).toHaveLength(2);
    directive.hide();
    vi.advanceTimersByTime(200);
    expect(button.getAttribute('aria-describedby')).toBe('existing');
    expect(directive.arrow()).toBeNull();
    expect(directive.resolvedPlacement()).toBeNull();
  });

  it('gives template content a reactive positioning context', async () => {
    const { directive } = await showTooltip(TemplateHost);
    vi.advanceTimersByTime(50);
    const tip = screen.getByTestId('tip');
    expect(directive.arrow()?.available).toBe(true);
    expect(tip).toHaveAttribute('data-ctx-placement', 'top');
  });

  it('stops tracking after destroy', async () => {
    const { fixture, directive } = await showTooltip(TextHost);
    fixture.destroy();
    expect(directive.arrow()).toBeNull();
    expect(document.querySelector('.qz-tooltip')).toBeNull();
    expect(() => {
      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(100);
    }).not.toThrow();
  });
});
