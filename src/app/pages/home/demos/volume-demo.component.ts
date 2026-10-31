import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  SliderDirective,
  SliderRangeDirective,
  SliderThumbDirective,
  SliderTrackDirective,
  SwitchDirective,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-volume-demo',
  imports: [
    SliderDirective,
    SliderTrackDirective,
    SliderRangeDirective,
    SliderThumbDirective,
    SwitchDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-baseline justify-between gap-4">
      <span id="volume-label" class="text-sm font-medium text-fg">Volume</span>
      <span class="font-mono text-sm text-fg-muted" data-testid="volume-readout">
        {{ muted() ? 'Muted' : volume() + '%' }}
      </span>
    </div>

    <div
      qzSlider
      [(value)]="volume"
      [disabled]="muted()"
      [valueText]="valueText"
      class="relative mt-3 h-10 w-full touch-none data-[qz-disabled]:opacity-40"
    >
      <div
        qzSliderTrack
        class="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/15"
      >
        <div
          qzSliderRange
          class="h-full rounded-full bg-brand"
          [style.width]="'var(--qz-slider-percent)'"
        ></div>
        <button
          qzSliderThumb
          aria-labelledby="volume-label"
          class="site-focus absolute top-1/2 size-6 -translate-y-1/2 rounded-full border-2 border-brand bg-surface-2"
          [style.left]="'calc(var(--qz-slider-percent) - 12px)'"
        ></button>
      </div>
    </div>

    <div class="mt-5 flex items-center justify-between gap-4 border-t border-line pt-5">
      <span id="mute-label" class="text-sm font-medium text-fg">Mute</span>
      <button
        qzSwitch
        [(checked)]="muted"
        aria-labelledby="mute-label"
        class="site-focus group relative h-7 w-12 rounded-full bg-white/15 data-[qz-state=checked]:bg-accent"
      >
        <span
          class="absolute left-1 top-1 size-5 rounded-full bg-white transition-transform group-data-[qz-state=checked]:translate-x-5 motion-safe-transition"
        ></span>
      </button>
    </div>
  `,
})
export class VolumeDemoComponent {
  readonly volume = signal(40);
  readonly muted = signal(false);
  readonly valueText = (value: number) => `${value} percent`;
}
