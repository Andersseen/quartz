import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { afterEach, describe, expect, it } from 'vitest';
import { PopoverDirective } from './popover.directive';
import { PopoverTriggerDirective } from './popover-trigger.directive';

@Component({
  standalone: true,
  imports: [PopoverDirective, PopoverTriggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button qzPopoverTrigger [popover]="popover" [(open)]="open" [autoFocus]="autoFocus()">
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
});
