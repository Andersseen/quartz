import { ChangeDetectionStrategy, Component } from '@angular/core';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { ProgressDirective } from './progress.directive';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProgressDirective],
  template: '<div qzProgress aria-label="Upload" [value]="value" [min]="min" [max]="max"></div>',
})
class Host {
  value: number | null = 25;
  min = 0;
  max = 100;
}
describe('ProgressDirective', () => {
  it('exposes clamped determinate values and percentages', async () => {
    const { container } = await render(Host);
    const el = container.querySelector('[role=progressbar]')!;
    expect(el.getAttribute('aria-valuenow')).toBe('25');
    expect((el as HTMLElement).style.getPropertyValue('--qz-progress-percent')).toBe('25%');
  });
  it('clamps external values and repairs a non-increasing dynamic range', async () => {
    const { container, rerender } = await render(Host, {
      componentProperties: { value: 150, min: 5, max: 5 },
    });
    const el = container.querySelector('[role=progressbar]')!;
    expect(el.getAttribute('aria-valuemin')).toBe('5');
    expect(el.getAttribute('aria-valuemax')).toBe('6');
    expect(el.getAttribute('aria-valuenow')).toBe('6');
    await rerender({ componentProperties: { value: Number.NaN, min: 0, max: 100 } });
    expect(el.hasAttribute('aria-valuenow')).toBe(false);
  });
  it('omits the numeric value when indeterminate', async () => {
    const { container } = await render(Host, { componentProperties: { value: null } });
    expect(container.querySelector('[role=progressbar]')?.hasAttribute('aria-valuenow')).toBe(
      false,
    );
  });
  it('falls back to a finite range when incrementing the minimum would overflow', async () => {
    const { container } = await render(Host, {
      componentProperties: { value: 50, min: Number.MAX_VALUE, max: Number.MAX_VALUE },
    });
    const el = container.querySelector('[role=progressbar]')!;
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('100');
    expect(el.getAttribute('aria-valuenow')).toBe('50');
  });
  it('calculates finite percentages when a valid range spans both numeric extremes', async () => {
    const { container, rerender } = await render(Host, {
      componentProperties: { value: 0, min: -Number.MAX_VALUE, max: Number.MAX_VALUE },
    });
    const el = container.querySelector('[role=progressbar]')! as HTMLElement;
    expect(el.style.getPropertyValue('--qz-progress-percent')).toBe('50%');
    await rerender({ componentProperties: { value: Number.MAX_VALUE } });
    expect(el.style.getPropertyValue('--qz-progress-percent')).toBe('100%');
  });
});
