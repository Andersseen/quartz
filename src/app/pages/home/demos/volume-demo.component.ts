import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import {
  SliderDirective,
  SliderRangeDirective,
  SliderThumbDirective,
  SliderTrackDirective,
  SwitchDirective,
} from '@quartz-headless/primitives';

export type VolumeSkin = 'quartz' | 'wireframe' | 'brutal' | 'soft';

type SkinPart =
  | 'card'
  | 'label'
  | 'readout'
  | 'track'
  | 'range'
  | 'thumb'
  | 'divider'
  | 'switch'
  | 'knob';

/**
 * The whole look of this demo. Swap the map and the controls change completely; the behaviour
 * (keyboard, pointer, ARIA, disabled state) comes from Quartz and stays identical.
 */
const SKINS: Record<VolumeSkin, Record<SkinPart, string>> = {
  quartz: {
    card: 'rounded-2xl border border-white/10 bg-surface-2/70 p-6',
    label: 'text-sm font-medium text-fg',
    readout: 'font-mono text-sm text-fg-muted',
    track: 'h-1.5 rounded-full bg-white/15',
    range: 'rounded-full bg-brand',
    thumb: 'size-6 rounded-full border-2 border-brand bg-surface-2',
    divider: 'border-t border-line',
    switch: 'h-7 w-12 rounded-full bg-white/15 data-[qz-state=checked]:bg-accent',
    knob: 'left-1 top-1 size-5 rounded-full bg-white group-data-[qz-state=checked]:translate-x-5',
  },
  wireframe: {
    card: 'border border-dashed border-white/30 p-6 font-mono',
    label: 'text-xs uppercase tracking-widest text-fg-muted',
    readout: 'text-xs text-signal',
    track: 'h-2 border border-dashed border-white/40',
    range: 'bg-[repeating-linear-gradient(135deg,rgb(103_232_249/0.5)_0_2px,transparent_2px_6px)]',
    thumb: 'size-5 border border-signal bg-surface-0',
    divider: 'border-t border-dashed border-white/25',
    switch: 'h-7 w-12 border border-dashed border-white/40 data-[qz-state=checked]:border-signal',
    knob: 'left-1 top-1 size-5 border border-signal group-data-[qz-state=checked]:translate-x-5',
  },
  brutal: {
    card: 'border-[3px] border-black bg-[#ffe14d] p-6 text-black shadow-[6px_6px_0_#000]',
    label: 'text-sm font-black uppercase text-black',
    readout: 'font-mono text-sm font-bold text-black',
    track: 'h-4 border-[3px] border-black bg-white',
    range: 'bg-[#ff5c8a]',
    thumb: 'size-8 border-[3px] border-black bg-white shadow-[3px_3px_0_#000]',
    divider: 'border-t-[3px] border-black',
    switch: 'h-8 w-14 border-[3px] border-black bg-white data-[qz-state=checked]:bg-[#5ce1e6]',
    knob: 'left-0.5 top-0.5 size-5 border-[3px] border-black bg-black group-data-[qz-state=checked]:translate-x-6',
  },
  soft: {
    card: 'rounded-[2rem] bg-gradient-to-br from-violet-200 to-sky-100 p-7 text-slate-800 shadow-[0_20px_60px_rgb(167_139_250/0.35)]',
    label: 'text-sm font-semibold text-slate-700',
    readout: 'rounded-full bg-white/70 px-2.5 py-0.5 text-sm font-semibold text-violet-700',
    track: 'h-3 rounded-full bg-white/70 shadow-inner',
    range: 'rounded-full bg-gradient-to-r from-violet-500 to-sky-500',
    thumb: 'size-7 rounded-full bg-white shadow-[0_4px_14px_rgb(91_33_182/0.35)]',
    divider: 'border-t border-white/70',
    switch: 'h-8 w-14 rounded-full bg-white/70 shadow-inner data-[qz-state=checked]:bg-violet-500',
    knob: 'left-1 top-1 size-6 rounded-full bg-white shadow group-data-[qz-state=checked]:translate-x-6',
  },
};

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
    <div [class]="s().card" class="skin-transition">
      <div class="flex items-baseline justify-between gap-4">
        <span id="volume-label" [class]="s().label">Volume</span>
        <span [class]="s().readout" data-testid="volume-readout">
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
          [class]="s().track"
          class="skin-transition absolute inset-x-0 top-1/2 -translate-y-1/2"
        >
          <div
            qzSliderRange
            [class]="s().range"
            class="h-full"
            [style.width]="'var(--qz-slider-percent)'"
          ></div>
          <button
            qzSliderThumb
            aria-labelledby="volume-label"
            [class]="s().thumb"
            class="skin-transition site-focus absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            [style.left]="'var(--qz-slider-percent)'"
          ></button>
        </div>
      </div>

      <div [class]="s().divider" class="mt-5 flex items-center justify-between gap-4 pt-5">
        <span id="mute-label" [class]="s().label">Mute</span>
        <button
          qzSwitch
          [(checked)]="muted"
          aria-labelledby="mute-label"
          [class]="s().switch"
          class="skin-transition site-focus group relative shrink-0"
        >
          <span
            [class]="s().knob"
            class="motion-safe-transition absolute transition-transform"
          ></span>
        </button>
      </div>
    </div>
  `,
})
export class VolumeDemoComponent {
  readonly skin = input<VolumeSkin>('quartz');
  readonly volume = signal(40);
  readonly muted = signal(false);
  readonly valueText = (value: number) => `${value} percent`;

  protected readonly s = computed(() => SKINS[this.skin()]);
}
