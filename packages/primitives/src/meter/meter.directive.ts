import { Directive, computed, input } from '@angular/core';
function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function percent(value: number, min: number, max: number): number {
  const range = max - min;
  if (Number.isFinite(range)) return ((value - min) / range) * 100;
  const scale = Math.max(Math.abs(min), Math.abs(max), Math.abs(value));
  return ((value / scale - min / scale) / (max / scale - min / scale)) * 100;
}
/** Accessible meter for a scalar measurement with a known meaningful range. */
@Directive({
  selector: '[qzMeter]',
  standalone: true,
  exportAs: 'qzMeter',
  host: {
    role: 'meter',
    '[attr.aria-valuemin]': 'bounds().min',
    '[attr.aria-valuemax]': 'bounds().max',
    '[attr.aria-valuenow]': 'normalizedValue()',
    '[attr.aria-valuetext]': 'valueText()',
    '[attr.data-qz-state]': '"determinate"',
    '[attr.data-qz-value]': 'normalizedValue()',
    '[style.--qz-meter-percent.%]': 'percentage()',
  },
})
export class MeterDirective {
  readonly value = input(0);
  readonly min = input(0);
  readonly max = input(100);
  readonly valueText = input<string | null>(null);
  readonly bounds = computed(() => {
    const min = finite(this.min(), 0),
      max = finite(this.max(), 100);
    if (max > min) return { min, max };
    const repairedMax = min + 1;
    return Number.isFinite(repairedMax) && repairedMax > min
      ? { min, max: repairedMax }
      : { min: 0, max: 100 };
  });
  readonly normalizedValue = computed(() => {
    const { min, max } = this.bounds();
    return Math.min(max, Math.max(min, finite(this.value(), min)));
  });
  readonly percentage = computed(() => {
    const { min, max } = this.bounds();
    return percent(this.normalizedValue(), min, max);
  });
}
