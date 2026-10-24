import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import {
  CheckboxDirective,
  RadioDirective,
  RadioGroupDirective,
  SliderDirective,
  SliderRangeDirective,
  SliderThumbDirective,
  SliderTrackDirective,
  SwitchDirective,
  TabDirective,
  TabListDirective,
  TabPanelDirective,
  TabsDirective,
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
  selector: 'app-toggle-group-playground',
  imports: [ToggleGroupDirective, ToggleItemDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzToggleGroup
      aria-label="Formatting"
      [type]="type()"
      [disabled]="disabled()"
      [orientation]="orientation()"
      [(value)]="value"
      class="flex gap-2"
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
  readonly disabled = input(false);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  protected readonly items = ['bold', 'italic', 'underline'];
  protected readonly value = signal<string | readonly string[] | null>(null);
}

@Component({
  selector: 'app-slider-playground',
  imports: [SliderDirective, SliderTrackDirective, SliderRangeDirective, SliderThumbDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex max-w-md flex-col gap-2">
      <div
        qzSlider
        [(value)]="value"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [disabled]="disabled()"
        class="relative h-8 w-full touch-none"
      >
        <div qzSliderTrack class="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 bg-white/10">
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
      </div>
      <p class="text-sm text-gray-400">Value: {{ value() }}</p>
    </div>
  `,
})
export class SliderPlaygroundComponent {
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(5);
  readonly disabled = input(false);
  protected readonly value = signal(40);
}
