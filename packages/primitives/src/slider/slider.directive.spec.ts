import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
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

  describe('committed value contract', () => {
    it('emits once per user key step and never for programmatic writes', async () => {
      const { fixture } = await render(SliderHost);
      const slider = fixture.debugElement
        .query(By.directive(SliderDirective))
        .injector.get(SliderDirective);
      const committed: number[] = [];
      slider.valueChangeCommitted.subscribe((v) => committed.push(v));
      const thumb = screen.getByRole('slider');

      fixture.componentInstance.value.set(40);
      fixture.detectChanges();
      expect(committed).toEqual([]);

      fireEvent.keyDown(thumb, { key: 'ArrowRight' });
      fireEvent.keyDown(thumb, { key: 'ArrowRight' });
      fixture.detectChanges();
      expect(committed).toEqual([41, 42]);

      fireEvent.keyDown(thumb, { key: 'End' });
      fireEvent.keyDown(thumb, { key: 'End' });
      expect(committed).toEqual([41, 42, 100]);
    });

    it('uses decimal steps without drift across repeated key presses', async () => {
      const { fixture } = await render(SliderHost);
      fixture.componentInstance.max.set(1);
      fixture.componentInstance.step.set(0.1);
      fixture.detectChanges();
      const thumb = screen.getByRole('slider');
      for (let i = 0; i < 3; i++) fireEvent.keyDown(thumb, { key: 'ArrowUp' });
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(0.3);
    });

    it('lets the pointer override an external write during a drag and ends it when disabled', async () => {
      const { fixture } = await render(SliderHost);
      const root = screen.getByRole('slider').closest('[qzslider]') as HTMLElement;
      root.setPointerCapture = () => undefined;
      root.releasePointerCapture = () => undefined;
      root.getBoundingClientRect = () =>
        ({ left: 0, right: 100, top: 0, bottom: 10, width: 100, height: 10 }) as DOMRect;

      fireEvent.pointerDown(root, { pointerId: 1, clientX: 10 });
      fixture.componentInstance.value.set(70);
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(70);
      fireEvent.pointerMove(root, { pointerId: 1, clientX: 30 });
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(30);

      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(root).not.toHaveAttribute('data-qz-dragging');
      fireEvent.pointerMove(root, { pointerId: 1, clientX: 90 });
      expect(fixture.componentInstance.value()).toBe(30);
    });

    it('ends the drag on lostpointercapture and on destroy', async () => {
      const { fixture } = await render(SliderHost);
      const root = screen.getByRole('slider').closest('[qzslider]') as HTMLElement;
      root.setPointerCapture = () => undefined;
      root.getBoundingClientRect = () =>
        ({ left: 0, right: 100, top: 0, bottom: 10, width: 100, height: 10 }) as DOMRect;
      fireEvent.pointerDown(root, { pointerId: 2, clientX: 50 });
      fixture.detectChanges();
      expect(root).toHaveAttribute('data-qz-dragging');
      fireEvent.lostPointerCapture(root, { pointerId: 2 });
      fixture.detectChanges();
      expect(root).not.toHaveAttribute('data-qz-dragging');
    });
  });
});
