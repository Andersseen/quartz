import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { fireEvent, render, screen } from '@testing-library/angular';
import {
  RangeSliderDirective,
  RangeSliderRangeDirective,
  RangeSliderThumbDirective,
  RangeSliderTrackDirective,
  SliderDirective,
  SliderThumbDirective,
  SliderTrackDirective,
  ToggleDirective,
  ToggleGroupDirective,
  ToggleItemDirective,
  type RangeSliderValue,
} from '@quartz-headless/primitives';
import { describe, expect, it } from 'vitest';
import { QUARTZ_FORMS } from './public-api';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SliderDirective,
    SliderTrackDirective,
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
  template: `
    <form [formGroup]="form">
      <div qzSlider formControlName="volume" [max]="10" [step]="0.5">
        <div qzSliderTrack><button qzSliderThumb aria-label="Volume"></button></div>
      </div>
      <div qzRangeSlider formControlName="price" [minDistance]="10">
        <div qzRangeSliderTrack>
          <div qzRangeSliderRange></div>
          <button qzRangeSliderThumb="low" aria-label="Minimum price"></button>
          <button qzRangeSliderThumb="high" aria-label="Maximum price"></button>
        </div>
      </div>
      <button qzToggle formControlName="bold">Bold</button>
      <div qzToggleGroup formControlName="align" aria-label="Alignment">
        <button qzToggleItem="left">Left</button>
        <button qzToggleItem="right">Right</button>
      </div>
      <div qzToggleGroup type="multiple" formControlName="marks" aria-label="Marks">
        <button qzToggleItem="b">B</button>
        <button qzToggleItem="i">I</button>
      </div>
    </form>
  `,
})
class RangeToggleFormHost {
  readonly form = new FormGroup({
    volume: new FormControl<number | null>(2),
    price: new FormControl<RangeSliderValue | null>({ low: 10, high: 60 }),
    bold: new FormControl(false),
    align: new FormControl<string | null>(null),
    marks: new FormControl<string[] | null>([]),
  });
}

const setup = async () => {
  const result = await render(RangeToggleFormHost);
  const form = result.fixture.componentInstance.form;
  const changes: Record<string, unknown[]> = {};
  for (const [name, control] of Object.entries(form.controls)) {
    changes[name] = [];
    control.valueChanges.subscribe((v) => changes[name].push(v));
  }
  return { ...result, form, changes };
};

describe('Slider / RangeSlider / Toggle / ToggleGroup Forms adapters', () => {
  it('Slider: reflects writes silently, commits once per key step, touched on focus loss', async () => {
    const { form, changes, fixture } = await setup();
    const thumb = screen.getByRole('slider', { name: 'Volume' });
    expect(thumb).toHaveAttribute('aria-valuenow', '2');

    form.controls.volume.setValue(4, { emitEvent: false });
    fixture.detectChanges();
    expect(thumb).toHaveAttribute('aria-valuenow', '4');
    expect(changes['volume']).toEqual([]);

    fireEvent.keyDown(thumb, { key: 'ArrowUp' });
    expect(form.controls.volume.value).toBe(4.5);
    expect(changes['volume']).toEqual([4.5]);

    expect(form.controls.volume.touched).toBe(false);
    fireEvent.focusOut(thumb.closest('[qzslider]') as HTMLElement, { relatedTarget: null });
    expect(form.controls.volume.touched).toBe(true);

    form.controls.volume.reset();
    fixture.detectChanges();
    expect(thumb).toHaveAttribute('aria-valuenow', '0');
  });

  it('Slider: disabled control blocks input', async () => {
    const { form, fixture } = await setup();
    form.controls.volume.disable();
    fixture.detectChanges();
    const thumb = screen.getByRole('slider', { name: 'Volume' });
    fireEvent.keyDown(thumb, { key: 'End' });
    expect(form.controls.volume.value).toBe(2);
    expect(thumb).toHaveAttribute('aria-disabled', 'true');
    form.controls.volume.enable();
    fixture.detectChanges();
    fireEvent.keyDown(thumb, { key: 'End' });
    expect(form.controls.volume.value).toBe(10);
  });

  it('RangeSlider: object value, one commit per change, null resets to the full range', async () => {
    const { form, changes, fixture } = await setup();
    const low = screen.getByRole('slider', { name: 'Minimum price' });
    const high = screen.getByRole('slider', { name: 'Maximum price' });
    expect(low).toHaveAttribute('aria-valuenow', '10');
    expect(high).toHaveAttribute('aria-valuenow', '60');

    fireEvent.keyDown(high, { key: 'ArrowLeft' });
    expect(form.controls.price.value).toEqual({ low: 10, high: 59 });
    expect(changes['price']).toEqual([{ low: 10, high: 59 }]);

    form.controls.price.setValue({ low: 30, high: 70 });
    fixture.detectChanges();
    expect(low).toHaveAttribute('aria-valuenow', '30');
    expect(changes['price']).toHaveLength(2); // the explicit setValue, no echo from the adapter

    form.controls.price.reset();
    fixture.detectChanges();
    expect(low).toHaveAttribute('aria-valuenow', '0');
    expect(high).toHaveAttribute('aria-valuenow', '100');

    fireEvent.keyDown(low, { key: 'End' });
    expect(form.controls.price.value).toEqual({ low: 90, high: 100 });
  });

  it('Toggle: boolean value, null writes false, touched on blur, disabled', async () => {
    const { form, changes, fixture } = await setup();
    const button = screen.getByRole('button', { name: 'Bold' });
    fireEvent.click(button);
    expect(form.controls.bold.value).toBe(true);
    expect(changes['bold']).toEqual([true]);
    expect(button).toHaveAttribute('aria-pressed', 'true');

    form.controls.bold.reset();
    fixture.detectChanges();
    expect(button).toHaveAttribute('aria-pressed', 'false');

    fireEvent.blur(button);
    expect(form.controls.bold.touched).toBe(true);

    form.controls.bold.disable();
    fixture.detectChanges();
    fireEvent.click(button);
    expect(form.controls.bold.value).toBeNull(); // reset() wrote null; the click was ignored
  });

  it('ToggleGroup: scalar/null in single mode, array in multiple mode, reset shows nothing pressed', async () => {
    const { form, changes, fixture } = await setup();
    const left = screen.getByRole('button', { name: 'Left' });
    const right = screen.getByRole('button', { name: 'Right' });
    fireEvent.click(left);
    fireEvent.click(right);
    expect(form.controls.align.value).toBe('right');
    expect(changes['align']).toEqual(['left', 'right']);
    fireEvent.click(right);
    expect(form.controls.align.value).toBeNull();

    const bold = screen.getByRole('button', { name: 'B' });
    const italic = screen.getByRole('button', { name: 'I' });
    fireEvent.click(bold);
    fireEvent.click(italic);
    expect(form.controls.marks.value).toEqual(['b', 'i']);

    form.controls.marks.reset();
    form.controls.align.setValue('left');
    fixture.detectChanges();
    expect(bold).toHaveAttribute('aria-pressed', 'false');
    expect(left).toHaveAttribute('aria-pressed', 'true');

    form.controls.align.disable();
    fixture.detectChanges();
    expect(screen.getByRole('group', { name: 'Alignment' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    fireEvent.click(right);
    expect(form.controls.align.value).toBe('left');
  });
});

describe('template-driven Forms', () => {
  it('Slider and Toggle work with ngModel', async () => {
    const { fixture } = await render(
      `<div qzSlider [(ngModel)]="volume"><div qzSliderTrack><button qzSliderThumb aria-label="V"></button></div></div>
       <button qzToggle [(ngModel)]="on">T</button>`,
      {
        imports: [
          FormsModule,
          SliderDirective,
          SliderThumbDirective,
          SliderTrackDirective,
          ToggleDirective,
          ...QUARTZ_FORMS,
        ],
        componentProperties: { volume: 5, on: false },
      },
    );
    await fixture.whenStable();
    fireEvent.keyDown(screen.getByRole('slider', { name: 'V' }), { key: 'ArrowUp' });
    fireEvent.click(screen.getByRole('button', { name: 'T' }));
    expect(fixture.componentInstance.volume).toBe(6);
    expect(fixture.componentInstance.on).toBe(true);
  });
});
