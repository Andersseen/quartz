import {
  Directive,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  HostListener,
  inject,
  signal,
  effect,
  booleanAttribute,
  computed,
} from '@angular/core';
import { DragDropService } from './drag-drop.service';
import type { DragDropConfig, QzDragInfo, QzDragEndInfo } from './drag-drop.types';

@Directive({
  selector: '[qzDraggable]',
  standalone: true,
  host: {
    '[draggable]': '!isDisabled()',
    '[class.qz-draggable]': 'true',
    '[class.qz-dragging]': 'isDragging()',
    '[class.qz-disabled]': 'isDisabled()',
    '[style.cursor]': 'isDisabled() ? "not-allowed" : "grab"',
  },
})
export class DraggableDirective {
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private dragDropService = inject(DragDropService);

  /** Configuration object */
  @Input('qzDraggable') set configValue(value: DragDropConfig | string) {
    if (typeof value === 'object' && value !== null) {
      this.config = value;
    } else {
      this.config = {};
    }
  }
  private config: DragDropConfig = {};

  /** Data to transfer during drag */
  @Input('qzDraggableData') data: unknown;
  /** Drag type for categorization */
  @Input('qzDraggableType') type = 'default';
  /** Whether dragging is disabled */
  @Input({ alias: 'qzDraggableDisabled', transform: booleanAttribute }) disabledInput = false;
  /** Drag handle selector */
  @Input('qzDraggableHandle') handle: string | null = null;

  /** Emitted when drag starts */
  @Output() dragStart = new EventEmitter<QzDragInfo>();
  /** Emitted when drag ends */
  @Output() dragEnd = new EventEmitter<QzDragEndInfo>();

  isDragging = signal(false);
  private dragImage: HTMLElement | null = null;

  isDisabled = computed(() => this.disabledInput);

  constructor() {
    effect(() => {
      const isDisabled = this.isDisabled();
      const element = this.elementRef.nativeElement;
      element.setAttribute('aria-grabbed', 'false');
      if (isDisabled) {
        element.removeAttribute('draggable');
      }
    });
  }

  @HostListener('dragstart', ['$event'])
  onDragStart(event: DragEvent): void {
    if (this.isDisabled()) {
      event.preventDefault();
      return;
    }

    this.isDragging.set(true);
    const element = this.elementRef.nativeElement;
    element.setAttribute('aria-grabbed', 'true');

    // Store data
    const dragData = this.data ?? this.config.data;
    this.dragDropService.startDrag(dragData, element, this.type);

    // Set drag data
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', JSON.stringify({ type: this.type }));

      // Create custom drag image if needed
      this.createDragImage(element);
      if (this.dragImage) {
        event.dataTransfer.setDragImage(this.dragImage, 0, 0);
      }
    }

    this.dragStart.emit({
      data: dragData,
      element,
      event,
    });
  }

  @HostListener('dragend', ['$event'])
  onDragEnd(event: DragEvent): void {
    this.isDragging.set(false);
    const element = this.elementRef.nativeElement;
    element.setAttribute('aria-grabbed', 'false');

    // Clean up drag image
    if (this.dragImage) {
      this.dragImage.remove();
      this.dragImage = null;
    }

    const dropped = event.dataTransfer?.dropEffect !== 'none';

    this.dragEnd.emit({
      data: this.dragDropService.dragData(),
      element,
      event,
      dropped,
    });

    this.dragDropService.endDrag(dropped);
  }

  private createDragImage(original: HTMLElement): void {
    // Remove previous drag image if exists
    if (this.dragImage) {
      this.dragImage.remove();
    }

    // Clone the element for drag image
    this.dragImage = original.cloneNode(true) as HTMLElement;
    this.dragImage.style.position = 'fixed';
    this.dragImage.style.top = '-1000px';
    this.dragImage.style.opacity = '0.9';
    this.dragImage.style.transform = 'rotate(3deg)';
    this.dragImage.style.pointerEvents = 'none';
    this.dragImage.style.zIndex = '9999';
    this.dragImage.style.width = original.offsetWidth + 'px';

    document.body.appendChild(this.dragImage);
  }
}
