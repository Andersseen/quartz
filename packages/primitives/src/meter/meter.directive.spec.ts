import { ChangeDetectionStrategy, Component } from '@angular/core';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { MeterDirective } from './meter.directive';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeterDirective],
  template: '<div qzMeter aria-label="Storage" [value]="value" [min]="min" [max]="max"></div>',
})
class Host {
  value = 120;
  min = 0;
  max = 100;
}
describe('MeterDirective', () => {
  it('uses meter semantics and clamps its accessible value', async () => {
    const { container } = await render(Host);
    expect(container.querySelector('[role=meter]')?.getAttribute('aria-valuenow')).toBe('100');
  });
  it('uses the minimum for non-finite values and a safe repaired range', async () => {
    const { container, rerender } = await render(Host, {
      componentProperties: { value: Number.POSITIVE_INFINITY },
    });
    const meter = container.querySelector('[role=meter]')!;
    expect(meter.getAttribute('aria-valuenow')).toBe('0');
    await rerender({ componentProperties: { value: Number.NaN } });
    expect(meter.getAttribute('aria-valuenow')).toBe('0');
  });
  it('calculates finite percentages when a valid range spans both numeric extremes', async () => {
    const { container, rerender } = await render(Host, {
      componentProperties: { value: 0, min: -Number.MAX_VALUE, max: Number.MAX_VALUE },
    });
    const meter = container.querySelector('[role=meter]') as HTMLElement;
    expect(meter.style.getPropertyValue('--qz-meter-percent')).toBe('50%');
    await rerender({ componentProperties: { value: Number.MAX_VALUE } });
    expect(meter.style.getPropertyValue('--qz-meter-percent')).toBe('100%');
  });
});
