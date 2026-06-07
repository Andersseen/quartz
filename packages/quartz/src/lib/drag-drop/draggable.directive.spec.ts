import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { describe, it, expect, afterEach } from 'vitest';
import { DraggableDirective } from './draggable.directive';
import { DragDropService } from './drag-drop.service';

@Component({
  standalone: true,
  imports: [DraggableDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div qzDraggable [qzDraggableData]="data" qzDraggableHandle=".handle">
      <button class="handle">Handle</button>
      <span>Body</span>
    </div>
  `,
})
class HandleHost {
  data = { id: 'item-1' };
}

describe('DraggableDirective', () => {
  afterEach(() => {
    TestBed.inject(DragDropService).endDrag(false);
  });

  it('should only start drag from the configured handle', async () => {
    await render(HandleHost);
    const service = TestBed.inject(DragDropService);

    const body = screen.getByText('Body');
    const blockedEvent = new Event('dragstart', {
      bubbles: true,
      cancelable: true,
    }) as DragEvent;
    body.dispatchEvent(blockedEvent);

    expect(blockedEvent.defaultPrevented).toBe(true);
    expect(service.isDragging()).toBe(false);

    const handle = screen.getByText('Handle');
    const allowedEvent = new Event('dragstart', {
      bubbles: true,
      cancelable: true,
    }) as DragEvent;
    handle.dispatchEvent(allowedEvent);

    expect(allowedEvent.defaultPrevented).toBe(false);
    expect(service.isDragging()).toBe(true);
    expect(service.dragData()).toEqual({ id: 'item-1' });
  });
});
