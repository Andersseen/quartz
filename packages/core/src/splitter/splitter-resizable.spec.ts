import { Component, ChangeDetectionStrategy, signal, viewChild } from '@angular/core';
import { render, screen, fireEvent } from '@testing-library/angular';
import { describe, it, expect } from 'vitest';
import { SplitterContainerDirective } from './splitter-container.directive';
import { SplitterHandleDirective } from './splitter-handle.directive';
import { SplitterPanelDirective } from './splitter-panel.directive';

@Component({
  standalone: true,
  imports: [SplitterContainerDirective, SplitterHandleDirective, SplitterPanelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzSplitterContainer
      [dir]="dir()"
      [orientation]="orientation()"
      [minSize]="min()"
      [maxSize]="max()"
      [step]="10"
      [defaultPosition]="50"
      [disabled]="disabled()"
    >
      <div qzSplitterPanel>a</div>
      <div qzSplitterHandle aria-label="Resize">handle</div>
      <div [qzSplitterPanel]="false">b</div>
    </div>
  `,
})
class Host {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly min = signal(20);
  readonly max = signal(80);
  readonly disabled = signal(false);
  readonly container = viewChild.required(SplitterContainerDirective);
}

async function setup() {
  const result = await render(Host);
  const handle = screen.getByText('handle') as HTMLElement;
  handle.setPointerCapture = () => undefined;
  handle.releasePointerCapture = () => undefined;
  const container = result.fixture.nativeElement.querySelector(
    '[qzSplitterContainer]',
  ) as HTMLElement;
  container.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: 200, bottom: 100, width: 200, height: 100 }) as DOMRect;
  const service = result.fixture.componentInstance.container().splitterService;
  return { ...result, handle, service, host: result.fixture.componentInstance };
}

describe('Resizable (Splitter) behavior', () => {
  it('reports the separator axis in aria-orientation, not the layout axis', async () => {
    const { handle, host, fixture } = await setup();
    expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    host.orientation.set('vertical');
    fixture.detectChanges();
    expect(handle).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('exposes aria-valuemin/max/now from the clamped config', async () => {
    const { handle } = await setup();
    expect(handle).toHaveAttribute('aria-valuemin', '20');
    expect(handle).toHaveAttribute('aria-valuemax', '80');
    expect(handle).toHaveAttribute('aria-valuenow', '50');
    expect(handle).toHaveAttribute('tabindex', '0');
  });

  it('maps arrows on the horizontal axis and ignores the cross-axis arrows', async () => {
    const { handle, service } = await setup();
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(service.position()).toBe(60);
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(service.position()).toBe(40);
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });
    handle.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(service.position()).toBe(40);
  });

  it('maps arrows on the vertical axis', async () => {
    const { handle, service, host, fixture } = await setup();
    host.orientation.set('vertical');
    fixture.detectChanges();
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    expect(service.position()).toBe(60);
    fireEvent.keyDown(handle, { key: 'ArrowUp' });
    fireEvent.keyDown(handle, { key: 'ArrowUp' });
    expect(service.position()).toBe(40);
  });

  it('mirrors horizontal arrows in RTL (the primary panel sits on the right)', async () => {
    const { handle, service, host, fixture } = await setup();
    host.dir.set('rtl');
    fixture.detectChanges();
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(service.position()).toBe(60);
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(service.position()).toBe(40);
  });

  it('measures pointer position from the right edge in RTL', async () => {
    const { handle, service, host, fixture } = await setup();
    host.dir.set('rtl');
    fixture.detectChanges();
    fireEvent.pointerDown(handle, { pointerId: 1, button: 0 });
    // 50px from the right edge of a 200px container → 25%, snapped to the 10 step → 30 (min 20)
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 150, clientY: 10 });
    expect(service.position()).toBe(30);
  });

  it('Home/End jump to the bounds and clamp at both boundaries', async () => {
    const { handle, service } = await setup();
    fireEvent.keyDown(handle, { key: 'End' });
    expect(service.position()).toBe(80);
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(service.position()).toBe(80);
    fireEvent.keyDown(handle, { key: 'Home' });
    expect(service.position()).toBe(20);
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(service.position()).toBe(20);
  });

  it('re-clamps the position when min/max change dynamically', async () => {
    const { service, host, fixture } = await setup();
    host.min.set(60);
    fixture.detectChanges();
    expect(service.position()).toBe(60);
    host.min.set(0);
    host.max.set(30);
    fixture.detectChanges();
    expect(service.position()).toBe(30);
  });

  it('never emits NaN for invalid inputs or a collapsed container', async () => {
    const { handle, service, host, fixture } = await setup();
    service.setPosition(NaN);
    service.setPosition(Infinity);
    expect(service.position()).toBe(50);
    host.min.set(NaN);
    host.max.set(Number.POSITIVE_INFINITY);
    fixture.detectChanges();
    expect(Number.isFinite(service.position())).toBe(true);
    expect(service.minSize()).toBe(0);
    expect(service.maxSize()).toBe(100);

    const container = handle.parentElement as HTMLElement;
    container.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }) as DOMRect;
    fireEvent.pointerDown(handle, { pointerId: 1, button: 0 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 10, clientY: 10 });
    expect(Number.isFinite(service.position())).toBe(true);
  });

  it('raises maxSize to minSize when the bounds are inverted', async () => {
    const { service, host, fixture } = await setup();
    host.min.set(70);
    host.max.set(30);
    fixture.detectChanges();
    expect(service.maxSize()).toBe(70);
    expect(service.position()).toBe(70);
  });

  it('resizes with a real pointer sequence and exposes resizing state', async () => {
    const { handle, service, fixture } = await setup();
    const container = handle.parentElement as HTMLElement;
    fireEvent.pointerDown(handle, { pointerId: 3, button: 0 });
    fixture.detectChanges();
    expect(service.resizing()).toBe(true);
    expect(container).toHaveAttribute('data-qz-resizing');
    expect(handle).toHaveAttribute('data-qz-resizing');
    fireEvent.pointerMove(handle, { pointerId: 3, clientX: 140, clientY: 10 });
    expect(service.position()).toBe(70);
    fireEvent.pointerUp(handle, { pointerId: 3 });
    fixture.detectChanges();
    expect(service.resizing()).toBe(false);
    expect(container).not.toHaveAttribute('data-qz-resizing');
  });

  it('ends the drag on lostpointercapture', async () => {
    const { handle, service, fixture } = await setup();
    fireEvent.pointerDown(handle, { pointerId: 4, button: 0 });
    expect(service.resizing()).toBe(true);
    handle.dispatchEvent(new Event('lostpointercapture'));
    // Events without a pointerId are not ours; the real event carries it:
    const lost = new Event('lostpointercapture') as Event & { pointerId: number };
    lost.pointerId = 4;
    handle.dispatchEvent(lost);
    fixture.detectChanges();
    expect(service.resizing()).toBe(false);
  });

  it('ignores non-primary mouse buttons', async () => {
    const { handle, service } = await setup();
    fireEvent.pointerDown(handle, { pointerId: 5, button: 2 });
    expect(service.resizing()).toBe(false);
  });

  it('a second pointer cannot steal an active drag', async () => {
    const { handle, service } = await setup();
    fireEvent.pointerDown(handle, { pointerId: 1, button: 0 });
    fireEvent.pointerDown(handle, { pointerId: 2, button: 0 });
    fireEvent.pointerMove(handle, { pointerId: 2, clientX: 190, clientY: 0 });
    expect(service.position()).toBe(50);
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 100, clientY: 0 });
    expect(service.position()).toBe(50);
  });

  it('disabled blocks pointer and keyboard and flags aria-disabled', async () => {
    const { handle, service, host, fixture } = await setup();
    host.disabled.set(true);
    fixture.detectChanges();
    expect(handle).toHaveAttribute('aria-disabled', 'true');
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    fireEvent.pointerDown(handle, { pointerId: 1, button: 0 });
    expect(service.position()).toBe(50);
    expect(service.resizing()).toBe(false);
  });

  it('disabling mid-drag stops the drag', async () => {
    const { handle, service, host, fixture } = await setup();
    fireEvent.pointerDown(handle, { pointerId: 1, button: 0 });
    expect(service.resizing()).toBe(true);
    host.disabled.set(true);
    fixture.detectChanges();
    expect(service.resizing()).toBe(false);
  });

  it('keeps independent splitters independent', async () => {
    @Component({
      standalone: true,
      imports: [SplitterContainerDirective, SplitterHandleDirective],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <div qzSplitterContainer><div qzSplitterHandle>one</div></div>
        <div qzSplitterContainer><div qzSplitterHandle>two</div></div>
      `,
    })
    class Two {}
    await render(Two);
    fireEvent.keyDown(screen.getByText('one'), { key: 'End' });
    expect(screen.getByText('one')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('two')).toHaveAttribute('aria-valuenow', '50');
  });
});
