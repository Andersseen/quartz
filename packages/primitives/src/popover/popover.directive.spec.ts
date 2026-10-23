import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PopoverDirective } from './popover.directive';
import { PopoverTriggerDirective } from './popover-trigger.directive';

@Component({
  standalone: true,
  imports: [PopoverDirective, PopoverTriggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      qzPopoverTrigger
      [popover]="popover"
      [(open)]="open"
      [autoFocus]="autoFocus()"
      [disabled]="disabled()"
      (opened)="openedCount = openedCount + 1"
      (closed)="closedCount = closedCount + 1"
    >
      Details
    </button>
    <ng-template #popover>
      <div qzPopover>
        <button>Inside</button>
      </div>
    </ng-template>
  `,
})
class PopoverHost {
  readonly open = signal(false);
  readonly autoFocus = signal(false);
  readonly disabled = signal(false);
  closedCount = 0;
  openedCount = 0;
}

describe('Popover', () => {
  afterEach(() => {
    document.querySelectorAll('[data-qz-overlay-container]').forEach((el) => el.remove());
  });

  it('opens and closes from the trigger with ARIA relationships', async () => {
    const { fixture } = await render(PopoverHost);
    const trigger = screen.getByText('Details');

    fireEvent.click(trigger);
    const popover = await screen.findByText('Inside');
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(true);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger.getAttribute('aria-controls')).toBe(popover.parentElement?.id);

    fireEvent.click(trigger);
    await waitFor(() => expect(screen.queryByText('Inside')).toBeNull());
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('supports controlled open state and optional auto focus', async () => {
    const { fixture } = await render(PopoverHost);
    fixture.componentInstance.autoFocus.set(true);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    const inside = await screen.findByText('Inside');
    await waitFor(() => expect(document.activeElement).toBe(inside));
  });

  it('dismisses with Escape and restores focus', async () => {
    await render(PopoverHost);
    const trigger = screen.getByText('Details');
    fireEvent.click(trigger);
    await screen.findByText('Inside');

    fireEvent.keyDown(trigger, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByText('Inside')).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it('does not emit closed when destroyed without ever having been opened', async () => {
    const { fixture } = await render(PopoverHost);
    expect(fixture.componentInstance.closedCount).toBe(0);

    fixture.destroy();
    expect(fixture.componentInstance.closedCount).toBe(0);
  });

  it('emits closed exactly once when destroyed while open (not zero, not twice)', async () => {
    const { fixture } = await render(PopoverHost);
    const trigger = screen.getByText('Details');
    fireEvent.click(trigger);
    await screen.findByText('Inside');
    expect(fixture.componentInstance.closedCount).toBe(0);

    fixture.destroy();
    expect(fixture.componentInstance.closedCount).toBe(1);
  });

  it('does not double-emit closed when destroyed after already closing', async () => {
    const { fixture } = await render(PopoverHost);
    const trigger = screen.getByText('Details');
    fireEvent.click(trigger);
    await screen.findByText('Inside');

    fireEvent.click(trigger);
    await waitFor(() => expect(screen.queryByText('Inside')).toBeNull());
    expect(fixture.componentInstance.closedCount).toBe(1);

    fixture.destroy();
    expect(fixture.componentInstance.closedCount).toBe(1);
  });

  it('opens and closes programmatically with matching model, DOM and events', async () => {
    const { fixture } = await render(PopoverHost);
    const trigger = screen.getByText('Details');
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await screen.findByText('Inside');
    expect(fixture.componentInstance.openedCount).toBe(1);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    await waitFor(() => expect(screen.queryByText('Inside')).toBeNull());
    expect(fixture.componentInstance.closedCount).toBe(1);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger.hasAttribute('aria-controls')).toBe(false);
  });

  it('never leaves the model open while a disabled trigger refuses to open', async () => {
    const { fixture } = await render(PopoverHost);
    fixture.componentInstance.disabled.set(true);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await waitFor(() => expect(fixture.componentInstance.open()).toBe(false));
    expect(screen.queryByText('Inside')).toBeNull();
    expect(fixture.componentInstance.openedCount).toBe(0);
    expect(fixture.componentInstance.closedCount).toBe(0);
  });

  it('closes an open popover when the trigger becomes disabled', async () => {
    const { fixture } = await render(PopoverHost);
    fireEvent.click(screen.getByText('Details'));
    await screen.findByText('Inside');

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    await waitFor(() => expect(screen.queryByText('Inside')).toBeNull());
    expect(fixture.componentInstance.closedCount).toBe(1);
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('rapid open/close/open emits one event per real transition', async () => {
    const { fixture } = await render(PopoverHost);
    const trigger = screen.getByText('Details');
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    await screen.findByText('Inside');
    expect(fixture.componentInstance.openedCount).toBe(2);
    expect(fixture.componentInstance.closedCount).toBe(1);
    expect(document.querySelectorAll('[data-qz-overlay-container] > *')).toHaveLength(1);
  });

  it('a popover closed before the autofocus frame runs never receives focus', async () => {
    const frames: FrameRequestCallback[] = [];
    const raf = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => frames.push(cb));
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      frames[id - 1] = () => undefined;
    });
    const { fixture } = await render(PopoverHost);
    fixture.componentInstance.autoFocus.set(true);
    fixture.detectChanges();
    const trigger = screen.getByText('Details');
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    frames.forEach((cb) => cb(0));

    expect(document.activeElement).toBe(trigger);
    expect(cancel).toHaveBeenCalled();
    raf.mockRestore();
    cancel.mockRestore();
  });
});
