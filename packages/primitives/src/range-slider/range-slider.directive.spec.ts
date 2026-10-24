import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { RangeSliderDirective } from './range-slider.directive';
import { RangeSliderRangeDirective } from './range-slider-range.directive';
import { RangeSliderThumbDirective } from './range-slider-thumb.directive';
import { RangeSliderTrackDirective } from './range-slider-track.directive';
import type { RangeSliderValue } from './range-slider.types';

@Component({
  standalone: true,
  imports: [
    RangeSliderDirective,
    RangeSliderTrackDirective,
    RangeSliderRangeDirective,
    RangeSliderThumbDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzRangeSlider
      [(low)]="low"
      [(high)]="high"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [minDistance]="minDistance()"
      [orientation]="orientation()"
      [disabled]="disabled()"
      [attr.dir]="dir()"
      (valueChangeCommitted)="committed.push($event)"
    >
      <div qzRangeSliderTrack>
        <div qzRangeSliderRange></div>
        <button qzRangeSliderThumb="low" aria-label="Minimum price"></button>
        <button qzRangeSliderThumb="high" aria-label="Maximum price"></button>
      </div>
    </div>
  `,
})
class RangeHost {
  readonly low = signal(20);
  readonly high = signal(80);
  readonly min = signal(0);
  readonly max = signal(100);
  readonly step = signal(1);
  readonly minDistance = signal(0);
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly disabled = signal(false);
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly committed: RangeSliderValue[] = [];
}

const setup = async () => {
  const result = await render(RangeHost);
  const root = result.container.querySelector('[qzrangeslider]') as HTMLElement;
  root.setPointerCapture = () => undefined;
  root.releasePointerCapture = () => undefined;
  root.getBoundingClientRect = () =>
    ({ left: 0, right: 200, top: 0, bottom: 10, width: 200, height: 10 }) as DOMRect;
  return {
    ...result,
    host: result.fixture.componentInstance,
    root,
    low: screen.getByRole('slider', { name: 'Minimum price' }),
    high: screen.getByRole('slider', { name: 'Maximum price' }),
  };
};

describe('RangeSlider', () => {
  it('exposes two named sliders with thumb-specific aria bounds and geometry hooks', async () => {
    const { host, fixture, low, high, root } = await setup();
    host.minDistance.set(10);
    fixture.detectChanges();

    expect(low).toHaveAttribute('aria-valuenow', '20');
    expect(low).toHaveAttribute('aria-valuemin', '0');
    expect(low).toHaveAttribute('aria-valuemax', '70');
    expect(high).toHaveAttribute('aria-valuenow', '80');
    expect(high).toHaveAttribute('aria-valuemin', '30');
    expect(high).toHaveAttribute('aria-valuemax', '100');
    expect(low).toHaveAttribute('aria-orientation', 'horizontal');
    expect(root.style.getPropertyValue('--qz-range-low-percent')).toBe('20%');
    expect(root.style.getPropertyValue('--qz-range-high-percent')).toBe('80%');
    expect(root.style.getPropertyValue('--qz-range-size-percent')).toBe('60%');
    expect(root.getAttribute('tabindex')).toBeNull();
  });

  it('never lets thumbs cross via keyboard and only moves the targeted thumb', async () => {
    const { host, fixture, low, high } = await setup();
    host.low.set(78);
    host.high.set(80);
    fixture.detectChanges();

    fireEvent.keyDown(low, { key: 'End' });
    fixture.detectChanges();
    expect(host.low()).toBe(80);
    expect(host.high()).toBe(80);
    fireEvent.keyDown(high, { key: 'Home' });
    fixture.detectChanges();
    expect(host.low()).toBe(80);
    expect(host.high()).toBe(80);
    expect(host.committed).toEqual([{ low: 80, high: 80 }]);
  });

  it('enforces the minimum distance for both thumbs', async () => {
    const { host, fixture, low, high } = await setup();
    host.minDistance.set(15);
    fixture.detectChanges();

    fireEvent.keyDown(low, { key: 'End' });
    fixture.detectChanges();
    expect(host.low()).toBe(65);
    fireEvent.keyDown(high, { key: 'Home' });
    fixture.detectChanges();
    expect(host.high()).toBe(80);
    host.high.set(70);
    fixture.detectChanges();
    expect(low).toHaveAttribute('aria-valuenow', '55'); // high wins, low is pulled back
    expect(high).toHaveAttribute('aria-valuenow', '70');
    fireEvent.keyDown(high, { key: 'PageDown' });
    fixture.detectChanges();
    expect(high).toHaveAttribute('aria-valuenow', '70');
    expect(high).toHaveAttribute('aria-valuemin', '70');
  });

  it('is silent for programmatic writes and commits once per user change', async () => {
    const { host, fixture, low } = await setup();
    host.low.set(10);
    host.high.set(90);
    fixture.detectChanges();
    expect(host.committed).toEqual([]);

    fireEvent.keyDown(low, { key: 'ArrowRight' });
    fixture.detectChanges();
    expect(host.committed).toEqual([{ low: 11, high: 90 }]);
    fireEvent.keyDown(low, { key: 'Home' });
    fireEvent.keyDown(low, { key: 'Home' });
    expect(host.committed).toHaveLength(2);
  });

  it('repairs external writes that break the invariants (high wins)', async () => {
    const { host, fixture, low, high } = await setup();
    host.low.set(90);
    host.high.set(30);
    fixture.detectChanges();
    expect(low).toHaveAttribute('aria-valuenow', '30');
    expect(high).toHaveAttribute('aria-valuenow', '30');
    host.low.set(-5);
    host.high.set(500);
    fixture.detectChanges();
    expect(low).toHaveAttribute('aria-valuenow', '0');
    expect(high).toHaveAttribute('aria-valuenow', '100');
  });

  it('supports decimal steps and dynamic min/max/step', async () => {
    const { host, fixture, low } = await setup();
    host.max.set(1);
    host.step.set(0.1);
    host.low.set(0.2);
    host.high.set(0.9);
    fixture.detectChanges();
    for (let i = 0; i < 3; i++) fireEvent.keyDown(low, { key: 'ArrowUp' });
    fixture.detectChanges();
    expect(host.low()).toBe(0.5);
    host.max.set(0.4);
    fixture.detectChanges();
    expect(low).toHaveAttribute('aria-valuenow', '0.4');
  });

  it('maps arrow keys for RTL and ignores keys when disabled', async () => {
    const { host, fixture, low } = await setup();
    host.dir.set('rtl');
    fixture.detectChanges();
    fireEvent.keyDown(low, { key: 'ArrowLeft' });
    fixture.detectChanges();
    expect(host.low()).toBe(21);
    host.disabled.set(true);
    fixture.detectChanges();
    fireEvent.keyDown(low, { key: 'ArrowLeft' });
    expect(host.low()).toBe(21);
    expect(low).toHaveAttribute('aria-disabled', 'true');
  });

  it('picks the nearest thumb for a track press, breaking ties toward low', async () => {
    const { host, fixture, root } = await setup();
    fireEvent.pointerDown(root, { pointerId: 1, clientX: 60 }); // value 30 → nearer 20
    fixture.detectChanges();
    expect(host.low()).toBe(30);
    expect(host.high()).toBe(80);
    fireEvent.pointerUp(root, { pointerId: 1 });

    host.low.set(20);
    host.high.set(40);
    fixture.detectChanges();
    fireEvent.pointerDown(root, { pointerId: 2, clientX: 60 }); // value 30 → tie → low
    fixture.detectChanges();
    expect(host.low()).toBe(30);
    expect(host.high()).toBe(40);
  });

  it('drags the grabbed thumb, clamps at the other and cleans up on cancel', async () => {
    const { host, fixture, root, high } = await setup();
    fireEvent.pointerDown(high, { pointerId: 1, clientX: 160 });
    fixture.detectChanges();
    expect(root).toHaveAttribute('data-qz-dragging');
    expect(high).toHaveAttribute('data-qz-dragging');
    fireEvent.pointerMove(root, { pointerId: 1, clientX: 10 });
    fixture.detectChanges();
    expect(host.high()).toBe(20);
    expect(host.low()).toBe(20);
    fireEvent.pointerCancel(root, { pointerId: 1 });
    fixture.detectChanges();
    expect(root).not.toHaveAttribute('data-qz-dragging');
    expect(high).not.toHaveAttribute('data-qz-dragging');
  });

  it('drags in RTL from the right edge and in vertical from the bottom', async () => {
    const { host, fixture, root } = await setup();
    host.dir.set('rtl');
    fixture.detectChanges();
    fireEvent.pointerDown(root, { pointerId: 1, clientX: 190 }); // 5% from the right → 5
    fixture.detectChanges();
    expect(host.low()).toBe(5);
    fireEvent.pointerUp(root, { pointerId: 1 });

    host.dir.set('ltr');
    host.orientation.set('vertical');
    fixture.detectChanges();
    root.getBoundingClientRect = () =>
      ({ left: 0, right: 10, top: 0, bottom: 200, width: 10, height: 200 }) as DOMRect;
    fireEvent.pointerDown(root, { pointerId: 2, clientX: 5, clientY: 20 }); // 90% → nearer high
    fixture.detectChanges();
    expect(host.high()).toBe(90);
    expect(host.low()).toBe(5);
  });

  it('ends the gesture when disabled mid-drag or destroyed', async () => {
    const { host, fixture, root } = await setup();
    fireEvent.pointerDown(root, { pointerId: 1, clientX: 100 });
    host.disabled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(root).not.toHaveAttribute('data-qz-dragging');
    const slider = fixture.debugElement
      .query(By.directive(RangeSliderDirective))
      .injector.get(RangeSliderDirective);
    expect(slider.activeThumb()).toBeNull();
    fixture.destroy();
  });
});
