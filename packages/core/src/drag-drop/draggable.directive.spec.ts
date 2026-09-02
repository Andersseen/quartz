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

@Component({
  standalone: true,
  imports: [DraggableDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div [qzDraggable]="{ disabled: true }">Disabled</div>`,
})
class ConfigHost {}

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

  it('honours disabled from the configuration object', async () => {
    await render(ConfigHost);
    const element = screen.getByText('Disabled');
    const event = new Event('dragstart', { bubbles: true, cancelable: true }) as DragEvent;
    element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(element).toHaveAttribute('draggable', 'false');
  });

  it('never sets the deprecated aria-grabbed attribute', async () => {
    await render(HandleHost);
    const handle = screen.getByText('Handle');
    const host = handle.closest('[qzDraggable]')!;

    expect(host).not.toHaveAttribute('aria-grabbed');

    const start = new Event('dragstart', { bubbles: true, cancelable: true }) as DragEvent;
    handle.dispatchEvent(start);
    expect(host).not.toHaveAttribute('aria-grabbed');

    const end = new Event('dragend', { bubbles: true, cancelable: true }) as DragEvent;
    host.dispatchEvent(end);
    expect(host).not.toHaveAttribute('aria-grabbed');
  });

  it('exposes data-qz-dragging/data-qz-disabled instead of relying on classes alone', async () => {
    const { fixture } = await render(HandleHost);
    const handle = screen.getByText('Handle');
    const host = handle.closest('[qzDraggable]')!;

    expect(host).not.toHaveAttribute('data-qz-dragging');

    const start = new Event('dragstart', { bubbles: true, cancelable: true }) as DragEvent;
    handle.dispatchEvent(start);
    fixture.detectChanges();
    expect(host).toHaveAttribute('data-qz-dragging');

    const end = new Event('dragend', { bubbles: true, cancelable: true }) as DragEvent;
    host.dispatchEvent(end);
    fixture.detectChanges();
    expect(host).not.toHaveAttribute('data-qz-dragging');
  });

  it('does not apply decorative opacity/transform to the drag-image clone', async () => {
    await render(HandleHost);
    const handle = screen.getByText('Handle');

    const dataTransfer = {
      effectAllowed: '',
      setData: () => {},
      setDragImage: () => {},
    } as unknown as DataTransfer;
    const start = new Event('dragstart', { bubbles: true, cancelable: true }) as DragEvent;
    Object.defineProperty(start, 'dataTransfer', { value: dataTransfer });
    handle.dispatchEvent(start);

    // The clone is appended to document.body (position:fixed, off-screen) by createDragImage.
    const clones = Array.from(document.body.querySelectorAll('div')).filter(
      (el) => el.style.position === 'fixed' && el.style.top === '-1000px',
    );
    expect(clones.length).toBe(1);
    expect(clones[0].style.opacity).toBe('');
    expect(clones[0].style.transform).toBe('');
  });
});
