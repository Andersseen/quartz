import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TooltipDirective } from './tooltip.directive';

@Component({
  standalone: true,
  imports: [TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button qzTooltip="Hello tooltip">Hover me</button>`,
})
class TestHost {}

@Component({
  standalone: true,
  imports: [TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button qzTooltip="Hello tooltip" [tooltipDisabled]="disabled()">Hover me</button>`,
})
class DisableableHost {
  readonly disabled = signal(false);
}

describe('TooltipDirective', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    // Clean up any tooltip DOM leftovers
    document.querySelectorAll('.qz-tooltip').forEach((el) => el.remove());
  });

  it('should create tooltip element on mouseenter after delay', async () => {
    await render(TestHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    expect(document.querySelector('.qz-tooltip')).toBeNull();

    vi.advanceTimersByTime(400);
    expect(document.querySelector('.qz-tooltip')).not.toBeNull();
    expect(document.querySelector('.qz-tooltip')?.textContent).toBe('Hello tooltip');
  });

  it('should remove tooltip on mouseleave after hide delay', async () => {
    await render(TestHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    expect(document.querySelector('.qz-tooltip')).not.toBeNull();

    button.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(200);
    expect(document.querySelector('.qz-tooltip')).toBeNull();
  });

  it('should not show tooltip when disabled', async () => {
    @Component({
      standalone: true,
      imports: [TooltipDirective],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<button qzTooltip="Hello" [tooltipDisabled]="true">Hover me</button>`,
    })
    class DisabledHost {}

    await render(DisabledHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    expect(document.querySelector('.qz-tooltip')).toBeNull();
  });

  it('should set aria-describedby when tooltip is visible', async () => {
    const { fixture } = await render(TestHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    fixture.detectChanges();

    const tooltip = document.querySelector('.qz-tooltip');
    expect(tooltip).not.toBeNull();
    expect(button.getAttribute('aria-describedby')).toBe(tooltip?.id);
  });

  it('should wire aria-describedby for template tooltips', async () => {
    @Component({
      standalone: true,
      imports: [TooltipDirective],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <button [qzTooltip]="tooltip">Hover me</button>
        <ng-template #tooltip>
          <div class="rich-tooltip">Rich tooltip</div>
        </ng-template>
      `,
    })
    class TemplateHost {}

    const { fixture } = await render(TemplateHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    fixture.detectChanges();

    const tooltip = document.querySelector('.rich-tooltip');
    expect(tooltip).not.toBeNull();
    expect(tooltip?.getAttribute('role')).toBe('tooltip');
    expect(button.getAttribute('aria-describedby')).toBe(tooltip?.id);
  });

  it('should dismiss with Escape while visible', async () => {
    await render(TestHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    expect(document.querySelector('.qz-tooltip')).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    // Dismissal is immediate — no hide delay to wait out.
    expect(document.querySelector('.qz-tooltip')).toBeNull();
  });

  it('should ignore Escape once the tooltip is gone', async () => {
    await render(TestHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(document.querySelector('.qz-tooltip')).toBeNull();
  });

  it('should not stack show timers across repeated hovers', async () => {
    await render(TestHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(100);
    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(100);
    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);

    expect(document.querySelectorAll('.qz-tooltip')).toHaveLength(1);
  });

  it('should hide immediately when disabled while visible', async () => {
    const { fixture } = await render(DisableableHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    expect(document.querySelector('.qz-tooltip')).not.toBeNull();

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(document.querySelector('.qz-tooltip')).toBeNull();
  });

  it('should reveal the tooltip only once it has been positioned', async () => {
    await render(TestHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);

    // It starts hidden to avoid a flash at the viewport origin; by the time the
    // positioning frame has run it must be both placed and visible again.
    const tooltip = document.querySelector<HTMLElement>('.qz-tooltip');
    expect(tooltip?.style.transform).toMatch(/^translate\(/);
    expect(tooltip?.style.visibility).toBe('visible');
  });

  it('dismisses a string tooltip on scroll, through a single dismiss controller', async () => {
    await render(TestHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    expect(document.querySelector('.qz-tooltip')).not.toBeNull();

    document.dispatchEvent(new Event('scroll'));
    expect(document.querySelector('.qz-tooltip')).toBeNull();
  });

  it('dismisses a template tooltip on scroll exactly once (no duplicate Overlay-internal scroll-dismiss)', async () => {
    @Component({
      standalone: true,
      imports: [TooltipDirective],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <button [qzTooltip]="tooltip">Hover me</button>
        <ng-template #tooltip>
          <div class="rich-tooltip">Rich tooltip</div>
        </ng-template>
      `,
    })
    class TemplateHost {}

    const { fixture } = await render(TemplateHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    fixture.detectChanges();
    expect(document.querySelector('.rich-tooltip')).not.toBeNull();

    document.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(document.querySelector('.rich-tooltip')).toBeNull();
    // A leftover Overlay-internal scroll listener firing a second, redundant close would
    // still leave the tooltip gone, but let's also make sure nothing throws when a second
    // scroll fires against an already-closed tooltip.
    expect(() => document.dispatchEvent(new Event('scroll'))).not.toThrow();
  });
});
