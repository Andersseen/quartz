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

/** Accessible progress root. A null value represents work with no known completion amount. */
@Directive({
  selector: '[qzProgress]',
  standalone: true,
  exportAs: 'qzProgress',
  host: {
    role: 'progressbar',
    '[attr.aria-valuemin]': 'bounds().min',
    '[attr.aria-valuemax]': 'bounds().max',
    '[attr.aria-valuenow]': 'indeterminate() ? null : normalizedValue()',
    '[attr.aria-valuetext]': 'ariaValueText()',
    '[attr.data-qz-state]': 'indeterminate() ? "indeterminate" : "determinate"',
    '[attr.data-qz-indeterminate]': 'indeterminate() ? "" : null',
    '[attr.data-qz-value]': 'indeterminate() ? null : normalizedValue()',
    '[style.--qz-progress-percent.%]': 'percentage()',
  },
})
export class ProgressDirective {
  readonly value = input<number | null>(null);
  readonly min = input(0);
  readonly max = input(100);
  readonly ariaValueText = input<string | null>(null);
  readonly bounds = computed(() => {
    const min = finite(this.min(), 0);
    const max = finite(this.max(), 100);
    if (max > min) return { min, max };
    const repairedMax = min + 1;
    return Number.isFinite(repairedMax) && repairedMax > min
      ? { min, max: repairedMax }
      : { min: 0, max: 100 };
  });
  readonly indeterminate = computed(() => this.value() === null || !Number.isFinite(this.value()));
  readonly normalizedValue = computed(() => {
    if (this.indeterminate()) return null;
    const { min, max } = this.bounds();
    return Math.min(max, Math.max(min, this.value() as number));
  });
  readonly percentage = computed(() => {
    const value = this.normalizedValue();
    if (value === null) return null;
    const { min, max } = this.bounds();
    return percent(value, min, max);
  });
}
