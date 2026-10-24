import {
  ChangeDetectionStrategy,
  Component,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import {
  CheckboxDirective,
  RadioDirective,
  RadioGroupDirective,
  RangeSliderDirective,
  RangeSliderRangeDirective,
  RangeSliderThumbDirective,
  RangeSliderTrackDirective,
  type RangeSliderValue,
  SliderDirective,
  SliderRangeDirective,
  SliderThumbDirective,
  SliderTrackDirective,
  SwitchDirective,
  TabDirective,
  TabListDirective,
  TabPanelDirective,
  TabsDirective,
  ToggleDirective,
  ToggleGroupDirective,
  ToggleItemDirective,
} from '@quartz-headless/primitives';

const BTN =
  'rounded-md border border-white/15 px-4 py-2 text-gray-200 data-[qz-disabled]:opacity-50';

@Component({
  selector: 'app-checkbox-playground',
  imports: [CheckboxDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      qzCheckbox
      [(checked)]="checked"
      [disabled]="disabled()"
      (checkedChangeCommitted)="committed.emit(String($event))"
      class="${BTN} data-[qz-state=checked]:bg-emerald-500/20 data-[qz-state=indeterminate]:bg-amber-400/20"
    >
      Accept terms: {{ checked() }}
    </button>
  `,
})
export class CheckboxPlaygroundComponent {
  readonly disabled = input(false);
  readonly committed = output<string>();
  protected readonly String = String;
  protected readonly checked = signal<boolean | 'indeterminate'>('indeterminate');
}

@Component({
  selector: 'app-switch-playground',
  imports: [SwitchDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      qzSwitch
      [(checked)]="checked"
      [disabled]="disabled()"
      (checkedChangeCommitted)="committed.emit(String($event))"
      class="${BTN} data-[qz-state=checked]:bg-emerald-500/20"
    >
      Notifications: {{ checked() ? 'on' : 'off' }}
    </button>
  `,
})
export class SwitchPlaygroundComponent {
  readonly disabled = input(false);
  readonly committed = output<string>();
  protected readonly String = String;
  protected readonly checked = signal(false);
}

@Component({
  selector: 'app-radio-group-playground',
  imports: [RadioGroupDirective, RadioDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzRadioGroup
      aria-label="Plan"
      [(value)]="plan"
      [disabled]="disabled()"
      [orientation]="orientation()"
      [loop]="loop()"
      (valueChangeCommitted)="committed.emit(String($event))"
      class="flex gap-2"
      [class.flex-col]="orientation() === 'vertical'"
    >
      @for (item of plans; track item) {
        <button qzRadio [qzRadio]="item" class="${BTN} data-[qz-state=checked]:bg-emerald-500/20">
          {{ item }}
        </button>
      }
    </div>
  `,
})
export class RadioGroupPlaygroundComponent {
  readonly disabled = input(false);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly loop = input(true);
  readonly committed = output<string>();
  protected readonly String = String;
  protected readonly plans = ['free', 'pro', 'team'];
  protected readonly plan = signal<string | null>('pro');
}

@Component({
  selector: 'app-tabs-playground',
  imports: [TabsDirective, TabListDirective, TabDirective, TabPanelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzTabs
      [(value)]="tab"
      [orientation]="orientation()"
      [activationMode]="activationMode()"
      [disabled]="disabled()"
      class="flex gap-3"
      [class.flex-col]="orientation() === 'horizontal'"
    >
      <div
        qzTabList
        aria-label="Account"
        class="flex gap-2"
        [class.flex-col]="orientation() === 'vertical'"
      >
        @for (item of tabs; track item) {
          <button qzTab [qzTab]="item" class="${BTN} data-[qz-state=active]:bg-emerald-500/20">
            {{ item }}
          </button>
        }
      </div>
      @for (item of tabs; track item) {
        <section [qzTabPanel]="item" class="text-gray-300">{{ item }} panel</section>
      }
    </div>
  `,
})
export class TabsPlaygroundComponent {
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly activationMode = input<'automatic' | 'manual'>('automatic');
  readonly disabled = input(false);
  protected readonly tabs = ['account', 'security', 'billing'];
  protected readonly tab = signal<string | null>('account');
}

@Component({
  selector: 'app-toggle-playground',
  imports: [ToggleDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      qzToggle
      [(pressed)]="current"
      [disabled]="disabled()"
      (pressedChangeCommitted)="committed.emit(String($event))"
      class="${BTN} data-[qz-state=on]:bg-fuchsia-500/20"
    >
      Bold: {{ current() ? 'on' : 'off' }}
    </button>
  `,
})
export class TogglePlaygroundComponent {
  readonly pressed = input(false);
  readonly disabled = input(false);
  readonly committed = output<string>();
  protected readonly String = String;
  /** Follows the `pressed` control; the user's clicks override it until the control changes again. */
  protected readonly current = linkedSignal(() => this.pressed());
}

@Component({
  selector: 'app-toggle-group-playground',
  imports: [ToggleGroupDirective, ToggleItemDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzToggleGroup
      aria-label="Formatting"
      [type]="type()"
      [disabled]="disabled()"
      [allowDeselection]="allowDeselection()"
      [orientation]="orientation()"
      [(value)]="value"
      (valueChangeCommitted)="committed.emit($event)"
      class="flex gap-2"
      [class.flex-col]="orientation() === 'vertical'"
      [class.w-fit]="orientation() === 'vertical'"
    >
      @for (item of items; track item) {
        <button
          qzToggleItem
          [qzToggleItem]="item"
          class="${BTN} data-[qz-state=on]:bg-emerald-500/20"
        >
          {{ item }}
        </button>
      }
    </div>
  `,
})
export class ToggleGroupPlaygroundComponent {
  readonly type = input<'single' | 'multiple'>('single');
  readonly allowDeselection = input(true);
  readonly disabled = input(false);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly committed = output<string | readonly string[] | null>();
  protected readonly items = ['bold', 'italic', 'underline'];
  // Switching between single and multiple changes the value's shape, so it resets with `type`.
  protected readonly value = linkedSignal<'single' | 'multiple', string | readonly string[] | null>(
    {
      source: this.type,
      computation: (type) => (type === 'multiple' ? [] : null),
    },
  );
}

@Component({
  selector: 'app-slider-playground',
  imports: [SliderDirective, SliderTrackDirective, SliderRangeDirective, SliderThumbDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex max-w-md flex-col gap-2">
      <div
        qzSlider
        #slider="qzSlider"
        [(value)]="current"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [disabled]="disabled()"
        [orientation]="orientation()"
        (valueChangeCommitted)="committed.emit(String($event))"
        class="relative touch-none"
        [class.h-8]="orientation() === 'horizontal'"
        [class.w-full]="orientation() === 'horizontal'"
        [class.h-40]="orientation() === 'vertical'"
        [class.w-8]="orientation() === 'vertical'"
      >
        @if (orientation() === 'horizontal') {
          <div
            qzSliderTrack
            class="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 bg-white/10"
          >
            <div
              qzSliderRange
              class="h-full bg-cyan-400"
              [style.width]="'var(--qz-slider-percent)'"
            ></div>
            <button
              qzSliderThumb
              aria-label="Volume"
              class="absolute top-1/2 h-5 w-5 -translate-y-1/2 border border-white bg-[#151923]"
              [style.left]="'calc(var(--qz-slider-percent) - 10px)'"
            ></button>
          </div>
        } @else {
          <div
            qzSliderTrack
            class="absolute bottom-0 left-1/2 top-0 w-2 -translate-x-1/2 bg-white/10"
          >
            <div
              qzSliderRange
              class="absolute bottom-0 w-full bg-cyan-400"
              [style.height]="'var(--qz-slider-percent)'"
            ></div>
            <button
              qzSliderThumb
              aria-label="Volume"
              class="absolute left-1/2 h-5 w-5 -translate-x-1/2 border border-white bg-[#151923]"
              [style.bottom]="'calc(var(--qz-slider-percent) - 10px)'"
            ></button>
          </div>
        }
      </div>
      <p class="text-sm text-gray-400">Value: {{ slider.currentValue() }}</p>
    </div>
  `,
})
export class SliderPlaygroundComponent {
  readonly value = input(40);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(5);
  readonly disabled = input(false);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly committed = output<string>();
  protected readonly String = String;
  /** Follows the `value` control; dragging or keys override it until the control changes again. */
  protected readonly current = linkedSignal(() => this.value());
}

@Component({
  selector: 'app-range-slider-playground',
  imports: [
    RangeSliderDirective,
    RangeSliderTrackDirective,
    RangeSliderRangeDirective,
    RangeSliderThumbDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex max-w-md flex-col gap-2">
      <div
        qzRangeSlider
        #range="qzRangeSlider"
        [(low)]="currentLow"
        [(high)]="currentHigh"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [minDistance]="minDistance()"
        [disabled]="disabled()"
        [orientation]="orientation()"
        (valueChangeCommitted)="committed.emit($event)"
        class="relative touch-none"
        [class.h-8]="orientation() === 'horizontal'"
        [class.w-full]="orientation() === 'horizontal'"
        [class.h-40]="orientation() === 'vertical'"
        [class.w-8]="orientation() === 'vertical'"
      >
        @if (orientation() === 'horizontal') {
          <div
            qzRangeSliderTrack
            class="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 bg-white/10"
          >
            <div
              qzRangeSliderRange
              class="absolute h-full bg-cyan-400"
              [style.left]="'var(--qz-range-low-percent)'"
              [style.width]="'var(--qz-range-size-percent)'"
            ></div>
          </div>
          <button
            qzRangeSliderThumb="low"
            aria-label="Minimum"
            class="absolute top-1/2 h-5 w-5 -translate-y-1/2 border border-white bg-[#151923]"
            [style.left]="'calc(var(--qz-range-thumb-percent) - 10px)'"
          ></button>
          <button
            qzRangeSliderThumb="high"
            aria-label="Maximum"
            class="absolute top-1/2 h-5 w-5 -translate-y-1/2 border border-white bg-[#151923]"
            [style.left]="'calc(var(--qz-range-thumb-percent) - 10px)'"
          ></button>
        } @else {
          <div
            qzRangeSliderTrack
            class="absolute bottom-0 left-1/2 top-0 w-2 -translate-x-1/2 bg-white/10"
          >
            <div
              qzRangeSliderRange
              class="absolute w-full bg-cyan-400"
              [style.bottom]="'var(--qz-range-low-percent)'"
              [style.height]="'var(--qz-range-size-percent)'"
            ></div>
          </div>
          <button
            qzRangeSliderThumb="low"
            aria-label="Minimum"
            class="absolute left-1/2 h-5 w-5 -translate-x-1/2 border border-white bg-[#151923]"
            [style.bottom]="'calc(var(--qz-range-thumb-percent) - 10px)'"
          ></button>
          <button
            qzRangeSliderThumb="high"
            aria-label="Maximum"
            class="absolute left-1/2 h-5 w-5 -translate-x-1/2 border border-white bg-[#151923]"
            [style.bottom]="'calc(var(--qz-range-thumb-percent) - 10px)'"
          ></button>
        }
      </div>
      <p class="text-sm text-gray-400">Range: {{ range.range().low }} – {{ range.range().high }}</p>
    </div>
  `,
})
export class RangeSliderPlaygroundComponent {
  readonly low = input(20);
  readonly high = input(70);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(5);
  readonly minDistance = input(0);
  readonly disabled = input(false);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly committed = output<RangeSliderValue>();
  /** Follow the `low` / `high` controls; user gestures override them until a control changes again. */
  protected readonly currentLow = linkedSignal(() => this.low());
  protected readonly currentHigh = linkedSignal(() => this.high());
}
