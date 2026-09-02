import { Component, ChangeDetectionStrategy, ViewChild, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { describe, it, expect } from 'vitest';
import { DropZoneDirective } from './drop-zone.directive';
import { DragDropService } from './drag-drop.service';
import type { QzDropInfo, QzDragOverInfo } from './drag-drop.types';

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

@Component({
  standalone: true,
  imports: [DropZoneDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div qzDropZone [qzDropZone]="{ disabled: true, sortable: true }">
    configured zone
  </div>`,
})
class ConfigHost {
  @ViewChild(DropZoneDirective, { static: true })
  dir!: DropZoneDirective;
}

@Component({
  standalone: true,
  imports: [DropZoneDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div
    qzDropZone
    [qzDropZoneOrientation]="orientation()"
    (qzDragEnter)="onDragEnter($event)"
  >
    oriented zone
  </div>`,
})
class OrientationHost {
  readonly orientation = signal<'horizontal' | 'vertical' | undefined>(undefined);
  entered: QzDragOverInfo | null = null;

  onDragEnter(info: QzDragOverInfo): void {
    this.entered = info;
  }
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

  it('honours disabled and sortable values from the configuration object', async () => {
    const { fixture } = await render(ConfigHost);
    const service = TestBed.inject(DragDropService);
    service.startDrag('payload', document.createElement('div'), 'file');
    fixture.detectChanges();
    expect(fixture.componentInstance.dir.canDrop()).toBe(false);
    expect(fixture.componentInstance.dir.isSortable()).toBe(true);
    expect(screen.getByText('configured zone')).toHaveClass('qz-drop-disabled');
  });

  it('exposes data-qz-* state hooks alongside the existing classes', async () => {
    const { fixture } = await render(Host);
    const service = TestBed.inject(DragDropService);
    const zone = screen.getByText('zone');

    expect(zone).not.toHaveAttribute('data-qz-drag-over');
    expect(zone).not.toHaveAttribute('data-qz-can-drop');

    service.startDrag('payload', document.createElement('div'), 'file');
    fixture.detectChanges();
    expect(zone).toHaveAttribute('data-qz-can-drop');

    zone.dispatchEvent(new MouseEvent('dragenter', { bubbles: true, clientX: 5, clientY: 5 }));
    fixture.detectChanges();
    expect(zone).toHaveAttribute('data-qz-drag-over');
    expect(zone).toHaveClass('qz-drag-over'); // existing class kept, not replaced
  });

  it('uses the width>height heuristic by default for an ambiguous (square) zone', async () => {
    const { fixture } = await render(OrientationHost);
    const service = TestBed.inject(DragDropService);
    const zone = screen.getByText('oriented zone');
    // Square box: width === height, so the default heuristic (width > height) is false,
    // i.e. treated as vertical — clientY above center should read 'before'.
    zone.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect;

    service.startDrag('payload', document.createElement('div'), 'file');
    fixture.detectChanges();

    zone.dispatchEvent(new MouseEvent('dragenter', { bubbles: true, clientX: 10, clientY: 40 }));
    fixture.detectChanges();

    expect(fixture.componentInstance.entered?.position).toBe('before');
  });

  it('respects an explicit orientation override instead of the measured heuristic', async () => {
    const { fixture } = await render(OrientationHost);
    const service = TestBed.inject(DragDropService);
    const zone = screen.getByText('oriented zone');
    // Same square box as above, but this time with an explicit horizontal override and a
    // clientX/clientY pair engineered so the horizontal and vertical branches disagree:
    // horizontal (clientX=10 < centerX=50) -> 'before'; vertical (clientY=90 > centerY=50)
    // would say 'after'. If the override is respected, the result must be 'before'.
    zone.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect;
    fixture.componentInstance.orientation.set('horizontal');
    fixture.detectChanges();

    service.startDrag('payload', document.createElement('div'), 'file');
    fixture.detectChanges();

    zone.dispatchEvent(new MouseEvent('dragenter', { bubbles: true, clientX: 10, clientY: 90 }));
    fixture.detectChanges();

    expect(fixture.componentInstance.entered?.position).toBe('before');
  });
});
