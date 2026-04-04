import {
  Directive,
  ElementRef,
  inject,
  signal,
  computed,
  booleanAttribute,
  input,
  output,
} from '@angular/core';
import { DragDropService } from './drag-drop.service';
import type { DropZoneConfig, QzDropInfo, QzDragOverInfo } from './drag-drop.types';

@Directive({
  selector: '[qzDropZone]',
  host: {
    '[class.qz-drop-zone]': 'true',
    '[class.qz-drag-over]': 'isDragOver()',
    '[class.qz-drop-disabled]': 'disabled()',
    '[class.qz-can-drop]': 'canDrop()',
    '(dragenter)': 'onDragEnter($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(dragover)': 'onDragOver($event)',
    '(drop)': 'onDrop($event)',
  },
})
export class DropZoneDirective {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dragDropService = inject(DragDropService);

  /** Configuration object */
  readonly config = input<DropZoneConfig | string>({}, { alias: 'qzDropZone' });
  /** Acceptable drag types */
  readonly accept = input<string[]>([], { alias: 'qzDropZoneAccept' });
  /** Whether drop is disabled */
  readonly disabled = input(false, {
    alias: 'qzDropZoneDisabled',
    transform: booleanAttribute,
  });
  /** Whether to allow sorting */
  readonly sortable = input(false, {
    alias: 'qzDropZoneSortable',
    transform: booleanAttribute,
  });

  /** Emitted when item is dropped */
  readonly qzDrop = output<QzDropInfo>();
  /** Emitted when drag enters */
  readonly qzDragEnter = output<QzDragOverInfo>();
  /** Emitted when drag leaves */
  readonly qzDragLeave = output<void>();
  /** Emitted when dragging over */
  readonly qzDragOver = output<QzDragOverInfo>();

  private readonly _isDragOver = signal(false);
  readonly isDragOver = this._isDragOver.asReadonly();

  private dragCounter = 0;

  readonly canDrop = computed(() => {
    if (this.disabled()) return false;
    if (!this.dragDropService.isDragging()) return false;

    const dragType = this.dragDropService.dragType();
    const acceptedTypes = this.accept().length > 0 ? this.accept() : this.getConfig().accept;

    if (!acceptedTypes || acceptedTypes.length === 0) return true;
    if (!dragType) return true;

    return acceptedTypes.includes(dragType);
  });

  private getConfig(): DropZoneConfig {
    const cfg = this.config();
    return typeof cfg === 'object' && cfg !== null ? cfg : {};
  }

  onDragEnter(event: DragEvent): void {
    if (this.disabled() || !this.canDrop()) return;

    event.preventDefault();
    this.dragCounter++;

    if (this.dragCounter === 1) {
      this._isDragOver.set(true);
      this.qzDragEnter.emit({
        data: this.dragDropService.dragData(),
        element: this.elementRef.nativeElement,
        event,
        position: this.calculatePosition(event),
      });
    }
  }

  onDragLeave(_event: DragEvent): void {
    if (this.disabled()) return;

    this.dragCounter--;

    if (this.dragCounter === 0) {
      this._isDragOver.set(false);
      this.qzDragLeave.emit();
    }
  }

  onDragOver(event: DragEvent): void {
    if (this.disabled() || !this.canDrop()) return;

    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';

    this.qzDragOver.emit({
      data: this.dragDropService.dragData(),
      element: this.elementRef.nativeElement,
      event,
      position: this.calculatePosition(event),
    });
  }

  onDrop(event: unknown): void {
    const dragEvent = event as DragEvent;
    if (this.disabled() || !this.canDrop()) {
      dragEvent.preventDefault();
      return;
    }

    dragEvent.preventDefault();
    this.dragCounter = 0;
    this._isDragOver.set(false);

    const data = this.dragDropService.dragData();
    const sourceElement = this.dragDropService.sourceElement();

    this.qzDrop.emit({
      data,
      source: sourceElement!,
      target: this.elementRef.nativeElement,
      event: dragEvent,
      index: this.calculateDropIndex(dragEvent),
    });
  }

  private calculatePosition(event: DragEvent): 'before' | 'after' | 'inside' {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    if (rect.width > rect.height) {
      return event.clientX < centerX ? 'before' : 'after';
    } else {
      return event.clientY < centerY ? 'before' : 'after';
    }
  }

  private calculateDropIndex(event: DragEvent): number | undefined {
    if (!this.sortable()) return undefined;

    const element = this.elementRef.nativeElement;
    const children = Array.from(element.children);

    if (children.length === 0) return 0;

    const rect = element.getBoundingClientRect();
    const isHorizontal = rect.width > rect.height;

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const childRect = child.getBoundingClientRect();

      if (isHorizontal) {
        if (event.clientX < childRect.left + childRect.width / 2) {
          return i;
        }
      } else {
        if (event.clientY < childRect.top + childRect.height / 2) {
          return i;
        }
      }
    }

    return children.length;
  }
}
