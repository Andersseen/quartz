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
    '[class.qz-drop-disabled]': 'isDisabled()',
    '[class.qz-can-drop]': 'canDrop()',
    '(dragenter)': 'onDragEnter($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(dragover)': 'onDragOver($event)',
    '(drop)': 'onDrop($event)',
  },
})
export class DropZoneDirective {
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private dragDropService = inject(DragDropService);

  /** Configuration object */
  readonly config = input<DropZoneConfig | string>({}, { alias: 'qzDropZone' });
  /** Acceptable drag types */
  readonly accept = input<string[]>([], { alias: 'qzDropZoneAccept' });
  /** Whether drop is disabled */
  readonly disabledInput = input(false, {
    alias: 'qzDropZoneDisabled',
    transform: booleanAttribute,
  });
  /** Whether to allow sorting */
  readonly sortableInput = input(false, {
    alias: 'qzDropZoneSortable',
    transform: booleanAttribute,
  });

  /** Emitted when item is dropped */
  readonly drop = output<QzDropInfo>();
  /** Emitted when drag enters */
  readonly dragEnter = output<QzDragOverInfo>();
  /** Emitted when drag leaves */
  readonly dragLeave = output<void>();
  /** Emitted when dragging over */
  readonly dragOver = output<QzDragOverInfo>();

  readonly isDragOver = signal(false);
  private dragCounter = 0;

  readonly isDisabled = computed(() => this.disabledInput());
  readonly isSortable = computed(() => this.sortableInput());

  readonly canDrop = computed(() => {
    if (this.isDisabled()) return false;
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
    if (this.isDisabled() || !this.canDrop()) return;

    event.preventDefault();
    this.dragCounter++;

    if (this.dragCounter === 1) {
      this.isDragOver.set(true);
      this.dragEnter.emit({
        data: this.dragDropService.dragData(),
        element: this.elementRef.nativeElement,
        event,
        position: this.calculatePosition(event),
      });
    }
  }

  onDragLeave(event: DragEvent): void {
    if (this.isDisabled()) return;

    this.dragCounter--;

    if (this.dragCounter === 0) {
      this.isDragOver.set(false);
      this.dragLeave.emit();
    }
  }

  onDragOver(event: DragEvent): void {
    if (this.isDisabled() || !this.canDrop()) return;

    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';

    this.dragOver.emit({
      data: this.dragDropService.dragData(),
      element: this.elementRef.nativeElement,
      event,
      position: this.calculatePosition(event),
    });
  }

  onDrop(event: any): void {
    const dragEvent = event as DragEvent;
    if (this.isDisabled() || !this.canDrop()) {
      dragEvent.preventDefault();
      return;
    }

    dragEvent.preventDefault();
    this.dragCounter = 0;
    this.isDragOver.set(false);

    const data = this.dragDropService.dragData();
    const sourceElement = this.dragDropService.sourceElement();

    this.drop.emit({
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
    if (!this.isSortable()) return undefined;

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
