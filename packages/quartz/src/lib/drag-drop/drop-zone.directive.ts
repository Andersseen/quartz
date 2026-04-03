import {
  Directive,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  HostListener,
  inject,
  signal,
  computed,
  booleanAttribute,
} from '@angular/core';
import { DragDropService } from './drag-drop.service';
import type { DropZoneConfig, QzDropInfo, QzDragOverInfo } from './drag-drop.types';

@Directive({
  selector: '[qzDropZone]',
  standalone: true,
  host: {
    '[class.qz-drop-zone]': 'true',
    '[class.qz-drag-over]': 'isDragOver()',
    '[class.qz-drop-disabled]': 'isDisabled()',
    '[class.qz-can-drop]': 'canDrop()',
  },
})
export class DropZoneDirective {
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private dragDropService = inject(DragDropService);

  /** Configuration object */
  @Input('qzDropZone') set configValue(value: DropZoneConfig | string) {
    if (typeof value === 'object' && value !== null) {
      this.config = value;
    } else {
      this.config = {};
    }
  }
  private config: DropZoneConfig = {};

  /** Acceptable drag types */
  @Input('qzDropZoneAccept') accept: string[] = [];
  /** Whether drop is disabled */
  @Input({ alias: 'qzDropZoneDisabled', transform: booleanAttribute }) disabledInput = false;
  /** Whether to allow sorting */
  @Input({ alias: 'qzDropZoneSortable', transform: booleanAttribute }) sortableInput = false;

  /** Emitted when item is dropped */
  @Output() drop = new EventEmitter<QzDropInfo>();
  /** Emitted when drag enters */
  @Output() dragEnter = new EventEmitter<QzDragOverInfo>();
  /** Emitted when drag leaves */
  @Output() dragLeave = new EventEmitter<void>();
  /** Emitted when dragging over */
  @Output() dragOver = new EventEmitter<QzDragOverInfo>();

  isDragOver = signal(false);
  private dragCounter = 0;

  isDisabled = computed(() => this.disabledInput);
  isSortable = computed(() => this.sortableInput);

  canDrop = computed(() => {
    if (this.isDisabled()) return false;
    if (!this.dragDropService.isDragging()) return false;

    const dragType = this.dragDropService.dragType();
    const acceptedTypes = this.accept.length > 0 ? this.accept : this.config.accept;

    if (!acceptedTypes || acceptedTypes.length === 0) return true;
    if (!dragType) return true;

    return acceptedTypes.includes(dragType);
  });

  @HostListener('dragenter', ['$event'])
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

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    if (this.isDisabled()) return;

    this.dragCounter--;

    if (this.dragCounter === 0) {
      this.isDragOver.set(false);
      this.dragLeave.emit();
    }
  }

  @HostListener('dragover', ['$event'])
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

  @HostListener('drop', ['$event'])
  onDrop(event: any): void {
    if (this.isDisabled() || !this.canDrop()) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    this.dragCounter = 0;
    this.isDragOver.set(false);

    const data = this.dragDropService.dragData();
    const sourceElement = this.dragDropService.sourceElement();

    this.drop.emit({
      data,
      source: sourceElement!,
      target: this.elementRef.nativeElement,
      event,
      index: this.calculateDropIndex(event),
    });
  }

  private calculatePosition(event: DragEvent): 'before' | 'after' | 'inside' {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Determine if we're in the top/bottom or left/right half
    if (rect.width > rect.height) {
      // Horizontal layout
      return event.clientX < centerX ? 'before' : 'after';
    } else {
      // Vertical layout
      return event.clientY < centerY ? 'before' : 'after';
    }
  }

  private calculateDropIndex(event: DragEvent): number | undefined {
    if (!this.isSortable()) return undefined;

    // For sortable lists, calculate the index where item should be inserted
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
