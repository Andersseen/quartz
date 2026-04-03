import {
  Directive,
  ElementRef,
  inject,
  signal,
  effect,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import { DragDropService } from './drag-drop.service';
import type { DragDropConfig, QzDragInfo, QzDragEndInfo } from './drag-drop.types';

@Directive({
  selector: '[qzDraggable]',
  host: {
    '[draggable]': '!isDisabled()',
    '[class.qz-draggable]': 'true',
    '[class.qz-dragging]': 'isDragging()',
    '[class.qz-disabled]': 'isDisabled()',
    '[style.cursor]': 'isDisabled() ? "not-allowed" : "grab"',
    '[attr.aria-grabbed]': 'isDragging()',
    '(dragstart)': 'onDragStart($event)',
    '(dragend)': 'onDragEnd($event)',
  },
})
export class DraggableDirective {
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private dragDropService = inject(DragDropService);

  /** Configuration object */
  readonly config = input<DragDropConfig | string>({}, { alias: 'qzDraggable' });
  /** Data to transfer during drag */
  readonly data = input<unknown>(undefined, { alias: 'qzDraggableData' });
  /** Drag type for categorization */
  readonly type = input('default', { alias: 'qzDraggableType' });
  /** Whether dragging is disabled */
  readonly disabledInput = input(false, {
    alias: 'qzDraggableDisabled',
    transform: booleanAttribute,
  });
  /** Drag handle selector */
  readonly handle = input<string | null>(null, { alias: 'qzDraggableHandle' });

  /** Emitted when drag starts */
  readonly dragStart = output<QzDragInfo>();
  /** Emitted when drag ends */
  readonly dragEnd = output<QzDragEndInfo>();

  readonly isDragging = signal(false);
  private dragImage: HTMLElement | null = null;

  readonly isDisabled = computed(() => this.disabledInput());

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

  private getConfig(): DragDropConfig {
    const cfg = this.config();
    return typeof cfg === 'object' && cfg !== null ? cfg : {};
  }

  onDragStart(event: DragEvent): void {
    if (this.isDisabled()) {
      event.preventDefault();
      return;
    }

    this.isDragging.set(true);
    const element = this.elementRef.nativeElement;
    element.setAttribute('aria-grabbed', 'true');

    const config = this.getConfig();
    const dragData = this.data() ?? config.data;
    this.dragDropService.startDrag(dragData, element, this.type());

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', JSON.stringify({ type: this.type() }));

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

  onDragEnd(event: DragEvent): void {
    this.isDragging.set(false);
    const element = this.elementRef.nativeElement;
    element.setAttribute('aria-grabbed', 'false');

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
    if (this.dragImage) {
      this.dragImage.remove();
    }

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
