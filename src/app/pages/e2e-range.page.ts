import { ChangeDetectionStrategy, Component, afterNextRender, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  RangeSliderDirective,
  RangeSliderRangeDirective,
  RangeSliderThumbDirective,
  RangeSliderTrackDirective,
  SliderDirective,
  SliderRangeDirective,
  SliderThumbDirective,
  SliderTrackDirective,
  ToggleDirective,
  ToggleGroupDirective,
  ToggleItemDirective,
  type RangeSliderValue,
} from '@quartz-headless/primitives';
import { QUARTZ_FORMS } from '@quartz-headless/primitives/forms';

/**
 * Browser-contract fixture for the Quartz 0.11 range & toggle controls: real pointer geometry,
 * RTL/vertical, committed events, Forms and cleanup. Not documentation; Playwright drives it.
 * Geometry is fixed inline (200px tracks) so pointer coordinates are deterministic. Unstyled
 * otherwise. `?dir=rtl` makes the whole page right-to-left.
 */
@Component({
  selector: 'app-e2e-range',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    SliderDirective,
    SliderTrackDirective,
    SliderRangeDirective,
    SliderThumbDirective,
    RangeSliderDirective,
    RangeSliderTrackDirective,
    RangeSliderRangeDirective,
    RangeSliderThumbDirective,
    ToggleDirective,
    ToggleGroupDirective,
    ToggleItemDirective,
    ...QUARTZ_FORMS,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { ngSkipHydration: 'true' },
  styles: `
    .s {
      position: relative;
      width: 200px;
      height: 24px;
      margin: 12px 0;
    }
    .s[data-qz-orientation='vertical'] {
      width: 24px;
      height: 200px;
    }
    .track {
      position: absolute;
      inset: 10px 0;
      background: #ddd;
    }
    [data-qz-orientation='vertical'] > .track {
      inset: 0 10px;
    }
    .thumb {
      position: absolute;
      top: 0;
      width: 16px;
      height: 24px;
      padding: 0;
      background: #333;
      inset-inline-start: calc(var(--qz-slider-percent, var(--qz-range-thumb-percent)) - 8px);
    }
    [data-qz-orientation='vertical'] .thumb {
      inset-inline-start: 0;
      top: auto;
      width: 24px;
      height: 16px;
      bottom: calc(var(--qz-slider-percent, var(--qz-range-thumb-percent)) - 8px);
    }
    .fill {
      position: absolute;
      top: 0;
      bottom: 0;
      background: #69f;
      inset-inline-start: 0;
      width: var(--qz-slider-percent);
    }
    .rfill {
      position: absolute;
      top: 0;
      bottom: 0;
      background: #69f;
      inset-inline-start: var(--qz-range-low-percent);
      width: var(--qz-range-size-percent);
    }
    [data-qz-orientation='vertical'] .rfill {
      inset: auto 0 var(--qz-range-low-percent) 0;
      height: var(--qz-range-size-percent);
      width: auto;
    }
    [data-qz-orientation='vertical'] .fill {
      inset: auto 0 0 0;
      height: var(--qz-slider-percent);
      width: auto;
    }
    .thumb:focus-visible,
    [qzToggle]:focus-visible,
    [qzToggleItem]:focus-visible {
      outline: 2px solid #f60;
    }
    [aria-pressed='true'] {
      background: #cfe;
    }
  `,
  template: `
    <main
      id="app"
      style="padding: 24px; background: #fff; color: #000"
      [attr.dir]="dir"
      [attr.data-ready]="ready() ? '' : null"
    >
      <h1>Range &amp; toggle controls</h1>
      <a id="leave" routerLink="/">Leave</a>

      <section aria-label="Sliders">
        <h2>Slider</h2>
        <div
          id="s-basic"
          class="s"
          qzSlider
          [(value)]="basic"
          (valueChangeCommitted)="log('basic', $event)"
        >
          <div class="track" qzSliderTrack>
            <div class="fill" qzSliderRange></div>
          </div>
          <button class="thumb" qzSliderThumb aria-label="Basic"></button>
        </div>
        <p id="s-basic-out">{{ basic() }}</p>
        <p id="s-basic-log">{{ logs()['basic'] ?? '' }}</p>
        <button id="s-basic-set" type="button" (click)="basic.set(70)">Set 70</button>
        <button id="s-basic-disable" type="button" (click)="basicDisabled.set(!basicDisabled())">
          Toggle disabled
        </button>

        <div id="s-decimal" class="s" qzSlider [(value)]="decimal" [max]="1" [step]="0.1">
          <div class="track" qzSliderTrack><div class="fill" qzSliderRange></div></div>
          <button class="thumb" qzSliderThumb aria-label="Decimal"></button>
        </div>
        <p id="s-decimal-out">{{ decimal() }}</p>

        <div id="s-vertical" class="s" qzSlider [(value)]="vertical" orientation="vertical">
          <div class="track" qzSliderTrack><div class="fill" qzSliderRange></div></div>
          <button class="thumb" qzSliderThumb aria-label="Vertical"></button>
        </div>
        <p id="s-vertical-out">{{ vertical() }}</p>

        <div dir="rtl">
          <div id="s-rtl" class="s" qzSlider [(value)]="rtlValue">
            <div class="track" qzSliderTrack><div class="fill" qzSliderRange></div></div>
            <button class="thumb" qzSliderThumb aria-label="Right to left"></button>
          </div>
        </div>
        <p id="s-rtl-out">{{ rtlValue() }}</p>

        <div id="s-disabled" class="s" qzSlider [value]="30" [disabled]="true">
          <div class="track" qzSliderTrack><div class="fill" qzSliderRange></div></div>
          <button class="thumb" qzSliderThumb aria-label="Disabled"></button>
        </div>

        <div
          id="s-dragdisable"
          class="s"
          qzSlider
          [(value)]="dragDisable"
          [disabled]="basicDisabled()"
        >
          <div class="track" qzSliderTrack><div class="fill" qzSliderRange></div></div>
          <button class="thumb" qzSliderThumb aria-label="Drag disable"></button>
        </div>
        <p id="s-dragdisable-out">{{ dragDisable() }}</p>
      </section>

      <section aria-label="Range sliders">
        <h2>RangeSlider</h2>
        <div
          id="r-basic"
          class="s"
          qzRangeSlider
          [(low)]="low"
          [(high)]="high"
          (valueChangeCommitted)="log('range', $event)"
        >
          <div class="track" qzRangeSliderTrack><div class="rfill" qzRangeSliderRange></div></div>
          <button class="thumb" qzRangeSliderThumb="low" aria-label="Minimum price"></button>
          <button class="thumb" qzRangeSliderThumb="high" aria-label="Maximum price"></button>
        </div>
        <p id="r-basic-out">{{ low() }}-{{ high() }}</p>
        <p id="r-basic-log">{{ logs()['range'] ?? '' }}</p>
        <button id="r-basic-set" type="button" (click)="setRange()">Set 10-90</button>

        <div
          id="r-distance"
          class="s"
          qzRangeSlider
          [(low)]="dLow"
          [(high)]="dHigh"
          [minDistance]="20"
        >
          <div class="track" qzRangeSliderTrack><div class="rfill" qzRangeSliderRange></div></div>
          <button class="thumb" qzRangeSliderThumb="low" aria-label="Distance low"></button>
          <button class="thumb" qzRangeSliderThumb="high" aria-label="Distance high"></button>
        </div>
        <p id="r-distance-out">{{ dLow() }}-{{ dHigh() }}</p>

        <div
          id="r-vertical"
          class="s"
          qzRangeSlider
          [(low)]="vLow"
          [(high)]="vHigh"
          orientation="vertical"
        >
          <div class="track" qzRangeSliderTrack><div class="rfill" qzRangeSliderRange></div></div>
          <button class="thumb" qzRangeSliderThumb="low" aria-label="Vertical low"></button>
          <button class="thumb" qzRangeSliderThumb="high" aria-label="Vertical high"></button>
        </div>
        <p id="r-vertical-out">{{ vLow() }}-{{ vHigh() }}</p>

        <div dir="rtl">
          <div id="r-rtl" class="s" qzRangeSlider [(low)]="rLow" [(high)]="rHigh">
            <div class="track" qzRangeSliderTrack><div class="rfill" qzRangeSliderRange></div></div>
            <button class="thumb" qzRangeSliderThumb="low" aria-label="RTL low"></button>
            <button class="thumb" qzRangeSliderThumb="high" aria-label="RTL high"></button>
          </div>
        </div>
        <p id="r-rtl-out">{{ rLow() }}-{{ rHigh() }}</p>

        @if (showTemp()) {
          <div id="r-temp" class="s" qzRangeSlider [(low)]="tLow" [(high)]="tHigh">
            <div class="track" qzRangeSliderTrack></div>
            <button class="thumb" qzRangeSliderThumb="low" aria-label="Temp low"></button>
            <button class="thumb" qzRangeSliderThumb="high" aria-label="Temp high"></button>
          </div>
        }
        <button id="r-temp-remove" type="button" (click)="showTemp.set(false)">Remove</button>
      </section>

      <section aria-label="Toggles">
        <h2>Toggle</h2>
        <button
          id="t-bold"
          qzToggle
          [(pressed)]="bold"
          (pressedChangeCommitted)="log('bold', $event)"
        >
          Bold
        </button>
        <p id="t-bold-out">{{ bold() }}</p>
        <p id="t-bold-log">{{ logs()['bold'] ?? '' }}</p>
        <button id="t-bold-set" type="button" (click)="bold.set(true)">Press externally</button>

        <h2>ToggleGroup</h2>
        <div
          id="g-single"
          qzToggleGroup
          [(value)]="single"
          aria-label="Alignment"
          (valueChangeCommitted)="log('single', $event)"
        >
          <button qzToggleItem="left">Left</button>
          <button qzToggleItem="center">Center</button>
          <button qzToggleItem="right" [qzToggleItemDisabled]="true">Right</button>
          <button qzToggleItem="justify">Justify</button>
        </div>
        <p id="g-single-out">{{ single() === null ? 'none' : single() }}</p>
        <p id="g-single-log">{{ logs()['single'] ?? '' }}</p>

        <div
          id="g-nodeselect"
          qzToggleGroup
          [(value)]="nodeselect"
          [allowDeselection]="false"
          aria-label="Mode"
        >
          <button qzToggleItem="a">A</button>
          <button qzToggleItem="b">B</button>
        </div>
        <p id="g-nodeselect-out">{{ nodeselect() === null ? 'none' : nodeselect() }}</p>

        <div
          id="g-multiple"
          qzToggleGroup
          type="multiple"
          [(value)]="multiple"
          aria-label="Marks"
          (valueChangeCommitted)="log('multiple', $event)"
        >
          <button qzToggleItem="b">Bold</button>
          <button qzToggleItem="i">Italic</button>
          <button qzToggleItem="u">Underline</button>
        </div>
        <p id="g-multiple-out">{{ multipleText() }}</p>
        <p id="g-multiple-log">{{ logs()['multiple'] ?? '' }}</p>

        <div dir="rtl">
          <div id="g-rtl" qzToggleGroup [(value)]="rtlGroup" aria-label="RTL group">
            <button qzToggleItem="one">One</button>
            <button qzToggleItem="two">Two</button>
            <button qzToggleItem="three">Three</button>
          </div>
        </div>
        <div id="g-vertical" qzToggleGroup orientation="vertical" aria-label="Vertical group">
          <button qzToggleItem="x">X</button>
          <button qzToggleItem="y">Y</button>
        </div>
      </section>

      <section aria-label="Forms">
        <h2>Forms</h2>
        <form id="form" [formGroup]="form" (ngSubmit)="submit()">
          <div id="f-volume" class="s" qzSlider formControlName="volume">
            <div class="track" qzSliderTrack><div class="fill" qzSliderRange></div></div>
            <button class="thumb" qzSliderThumb aria-label="Form volume"></button>
          </div>
          <div id="f-price" class="s" qzRangeSlider formControlName="price" [minDistance]="10">
            <div class="track" qzRangeSliderTrack><div class="rfill" qzRangeSliderRange></div></div>
            <button class="thumb" qzRangeSliderThumb="low" aria-label="Form min"></button>
            <button class="thumb" qzRangeSliderThumb="high" aria-label="Form max"></button>
          </div>
          <button id="f-bold" qzToggle formControlName="bold">Form bold</button>
          <div id="f-align" qzToggleGroup formControlName="align" aria-label="Form align">
            <button qzToggleItem="left">FLeft</button>
            <button qzToggleItem="right">FRight</button>
          </div>
          <div
            id="f-marks"
            qzToggleGroup
            type="multiple"
            formControlName="marks"
            aria-label="Form marks"
          >
            <button qzToggleItem="b">FBold</button>
            <button qzToggleItem="i">FItalic</button>
          </div>
          <button id="f-submit" type="submit">Submit</button>
          <button id="f-reset" type="button" (click)="reset()">Reset</button>
          <button id="f-prefill" type="button" (click)="prefill()">Prefill</button>
          <button id="f-disable" type="button" (click)="toggleDisabled()">Toggle disabled</button>
        </form>
        <p id="f-value">{{ liveValue() }}</p>
        <p id="f-dirty">{{ form.dirty ? 'dirty' : 'pristine' }}</p>
        <p id="f-changes">{{ changes() }}</p>
        <pre id="f-submitted">{{ submitted() }}</pre>
      </section>
    </main>
  `,
})
export default class E2eRangePage {
  protected readonly dir = inject(ActivatedRoute).snapshot.queryParamMap.get('dir') ?? 'ltr';

  /** Set once the client has rendered (the prerendered markup is replaced, not hydrated). */
  readonly ready = signal(false);
  readonly basic = signal(20);
  readonly basicDisabled = signal(false);
  readonly decimal = signal(0);
  readonly vertical = signal(50);
  readonly rtlValue = signal(0);
  readonly dragDisable = signal(0);
  readonly low = signal(20);
  readonly high = signal(80);
  readonly dLow = signal(20);
  readonly dHigh = signal(60);
  readonly vLow = signal(20);
  readonly vHigh = signal(80);
  readonly rLow = signal(20);
  readonly rHigh = signal(80);
  readonly tLow = signal(10);
  readonly tHigh = signal(90);
  readonly showTemp = signal(true);
  readonly bold = signal(false);
  readonly single = signal<string | null>(null);
  readonly nodeselect = signal<string | null>('a');
  readonly multiple = signal<string[]>([]);
  readonly rtlGroup = signal<string | null>(null);
  readonly logs = signal<Record<string, string>>({});

  readonly multipleText = () => JSON.stringify(this.multiple());

  readonly form = new FormGroup({
    volume: new FormControl<number | null>(10),
    price: new FormControl<RangeSliderValue | null>({ low: 20, high: 80 }),
    bold: new FormControl(false),
    align: new FormControl<string | null>(null),
    marks: new FormControl<string[] | null>([]),
  });
  readonly liveValue = signal(JSON.stringify(this.form.getRawValue()));
  readonly changes = signal(0);
  readonly submitted = signal('');

  constructor() {
    afterNextRender(() => this.ready.set(true));
    this.form.valueChanges.subscribe(() => {
      this.liveValue.set(JSON.stringify(this.form.getRawValue()));
      this.changes.update((n) => n + 1);
    });
  }

  log(name: string, value: unknown): void {
    this.logs.update((logs) => ({
      ...logs,
      [name]: `${logs[name] ? logs[name] + ';' : ''}${JSON.stringify(value)}`,
    }));
  }

  setRange(): void {
    this.low.set(10);
    this.high.set(90);
  }

  submit(): void {
    this.submitted.set(JSON.stringify(this.form.getRawValue()));
  }

  reset(): void {
    this.form.reset();
    this.submitted.set('');
  }

  prefill(): void {
    this.form.patchValue({
      volume: 60,
      price: { low: 30, high: 70 },
      bold: true,
      align: 'right',
      marks: ['b', 'i'],
    });
  }

  toggleDisabled(): void {
    if (this.form.disabled) this.form.enable();
    else this.form.disable();
  }
}
