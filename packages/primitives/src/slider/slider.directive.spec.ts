import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { SliderDirective } from './slider.directive';
import { SliderRangeDirective } from './slider-range.directive';
import { SliderThumbDirective } from './slider-thumb.directive';
import { SliderTrackDirective } from './slider-track.directive';
import { normalizeSliderValue } from './slider-value';

@Component({
  standalone: true,
  imports: [SliderDirective, SliderTrackDirective, SliderRangeDirective, SliderThumbDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzSlider
      [(value)]="value"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [orientation]="orientation()"
      [disabled]="disabled()"
      [valueText]="valueText"
      [attr.dir]="dir()"
    >
      <div qzSliderTrack>
        <div qzSliderRange></div>
        <button qzSliderThumb>Volume</button>
      </div>
    </div>
  `,
})
class SliderHost {
  readonly value = signal(0);
  readonly min = signal(0);
  readonly max = signal(100);
  readonly step = signal(1);
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly disabled = signal(false);
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly valueText = (value: number) => `${value}%`;
}

describe('Slider', () => {
  it('normalizes clamp, step and decimal values', () => {
    expect(normalizeSliderValue(101, 0, 100, 1)).toBe(100);
    expect(normalizeSliderValue(-1, 0, 100, 1)).toBe(0);
    expect(normalizeSliderValue(0.26, 0, 1, 0.1)).toBe(0.3);
  });

  it('exposes slider ARIA and geometry hooks', async () => {
    const { fixture } = await render(SliderHost);
    fixture.componentInstance.value.set(50);
    fixture.detectChanges();

    const thumb = screen.getByRole('slider');
    const root = thumb.closest('[qzslider]');

    expect(thumb).toHaveAttribute('aria-valuemin', '0');
    expect(thumb).toHaveAttribute('aria-valuemax', '100');
    expect(thumb).toHaveAttribute('aria-valuenow', '50');
    expect(thumb).toHaveAttribute('aria-valuetext', '50%');
    expect(root).toHaveAttribute('data-qz-orientation', 'horizontal');
    expect((root as HTMLElement).style.getPropertyValue('--qz-slider-percent')).toBe('50%');
  });

  it('supports keyboard controls including RTL horizontal mapping', async () => {
    const { fixture } = await render(SliderHost);
    const thumb = screen.getByRole('slider');

    fireEvent.keyDown(thumb, { key: 'End' });
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(100);

    fixture.componentInstance.dir.set('rtl');
    fixture.detectChanges();
    fireEvent.keyDown(thumb, { key: 'ArrowLeft' });
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(100);

    fireEvent.keyDown(thumb, { key: 'ArrowRight' });
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(99);
  });

  it('updates from pointer events and cleans dragging state on cancel', async () => {
    const { fixture } = await render(SliderHost);
    const root = screen.getByRole('slider').closest('[qzslider]') as HTMLElement;
    root.setPointerCapture = () => undefined;
    root.releasePointerCapture = () => undefined;
    root.getBoundingClientRect = () =>
      ({ left: 0, right: 100, top: 0, bottom: 10, width: 100, height: 10 }) as DOMRect;

    fireEvent.pointerDown(root, { pointerId: 1, clientX: 25 });
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(25);
    expect(root).toHaveAttribute('data-qz-dragging');

    fireEvent.pointerCancel(root, { pointerId: 1 });
    fixture.detectChanges();
    expect(root).not.toHaveAttribute('data-qz-dragging');
  });

  it('does not update while disabled', async () => {
    const { fixture } = await render(SliderHost);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    const thumb = screen.getByRole('slider');

    fireEvent.keyDown(thumb, { key: 'End' });
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe(0);
    expect(thumb).toHaveAttribute('aria-disabled', 'true');
  });
});
