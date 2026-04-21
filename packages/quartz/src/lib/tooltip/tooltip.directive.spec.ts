import { Component, ChangeDetectionStrategy } from '@angular/core';
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
});
