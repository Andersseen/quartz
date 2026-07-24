import { Component, ChangeDetectionStrategy, ViewChild, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { describe, it, expect } from 'vitest';
import { DropZoneDirective } from './drop-zone.directive';
import { DragDropService } from './drag-drop.service';
import type { QzDropInfo } from './drag-drop.types';

@Component({
  standalone: true,
  imports: [DropZoneDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div qzDropZone [qzDropZoneAccept]="accept()" (qzDrop)="onDrop($event)">zone</div> `,
})
class Host {
  readonly accept = signal<string[]>([]);
  dropped: QzDropInfo | null = null;

  onDrop(info: QzDropInfo): void {
    this.dropped = info;
  }

  @ViewChild(DropZoneDirective, { static: true })
  dir!: DropZoneDirective;
}

describe('DropZoneDirective', () => {
  it('is not droppable while nothing is being dragged', async () => {
    const { fixture } = await render(Host);
    expect(fixture.componentInstance.dir.canDrop()).toBe(false);
  });

  it('becomes droppable when a compatible drag is active', async () => {
    const { fixture } = await render(Host);
    const service = TestBed.inject(DragDropService);

    service.startDrag('payload', document.createElement('div'), 'file');
    fixture.detectChanges();

    expect(fixture.componentInstance.dir.canDrop()).toBe(true);
  });

  it('rejects drag types outside the accept list', async () => {
    const { fixture } = await render(Host);
    const service = TestBed.inject(DragDropService);

    fixture.componentInstance.accept.set(['image']);
    fixture.detectChanges();

    service.startDrag('payload', document.createElement('div'), 'file');
    fixture.detectChanges();

    expect(fixture.componentInstance.dir.canDrop()).toBe(false);
  });

  it('flags drag-over state on dragenter', async () => {
    const { fixture } = await render(Host);
    const service = TestBed.inject(DragDropService);
    const zone = screen.getByText('zone');

    service.startDrag('payload', document.createElement('div'), 'file');
    fixture.detectChanges();

    zone.dispatchEvent(new MouseEvent('dragenter', { bubbles: true, clientX: 5, clientY: 5 }));
    fixture.detectChanges();

    expect(fixture.componentInstance.dir.isDragOver()).toBe(true);
    expect(zone).toHaveClass('qz-drag-over');
  });

  it('emits qzDrop with the dragged data and source on drop', async () => {
    const { fixture } = await render(Host);
    const service = TestBed.inject(DragDropService);
    const zone = screen.getByText('zone');
    const source = document.createElement('div');

    service.startDrag('payload', source, 'file');
    fixture.detectChanges();

    zone.dispatchEvent(new MouseEvent('drop', { bubbles: true, clientX: 5, clientY: 5 }));
    fixture.detectChanges();

    const dropped = fixture.componentInstance.dropped;
    expect(dropped).not.toBeNull();
    expect(dropped!.data).toBe('payload');
    expect(dropped!.source).toBe(source);
    expect(dropped!.target).toBe(zone);
  });
});
