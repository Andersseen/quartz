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
  Renderer2,
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
  private renderer = inject(Renderer2);

  /** Configuration object */
  readonly qzDraggable = input<DragDropConfig | string>({});
  /** Data to transfer during drag */
  readonly qzDraggableData = input<unknown>(undefined);
  /** Drag type for categorization */
  readonly qzDraggableType = input('default');
  /** Whether dragging is disabled */
  readonly qzDraggableDisabled = input(false, {
    transform: booleanAttribute,
  });
  /** Drag handle selector */
  readonly qzDraggableHandle = input<string | null>(null);

  /** Emitted when drag starts */
  readonly qzDragStart = output<QzDragInfo>();
  /** Emitted when drag ends */
  readonly qzDragEnd = output<QzDragEndInfo>();

  readonly isDragging = signal(false);
  private dragImage: HTMLElement | null = null;

  readonly isDisabled = computed(() => this.qzDraggableDisabled());

  constructor() {
    effect(() => {
      const isDisabled = this.isDisabled();
      const element = this.elementRef.nativeElement;
      this.renderer.setAttribute(element, 'aria-grabbed', 'false');
      if (isDisabled) {
        this.renderer.removeAttribute(element, 'draggable');
      } else {
        this.renderer.setAttribute(element, 'draggable', 'true');
      }
    });
  }

  private getConfig(): DragDropConfig {
    const cfg = this.qzDraggable();
    return typeof cfg === 'object' && cfg !== null ? cfg : {};
  }

  onDragStart(event: DragEvent): void {
    if (this.isDisabled()) {
      event.preventDefault();
      return;
    }

    this.isDragging.set(true);
    const element = this.elementRef.nativeElement;
    this.renderer.setAttribute(element, 'aria-grabbed', 'true');

    const config = this.getConfig();
    const dragData = this.qzDraggableData() ?? config.data;
    this.dragDropService.startDrag(dragData, element, this.qzDraggableType());

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', JSON.stringify({ type: this.qzDraggableType() }));

      this.createDragImage(element);
      if (this.dragImage) {
        event.dataTransfer.setDragImage(this.dragImage, 0, 0);
      }
    }

    this.qzDragStart.emit({
      data: dragData,
      element,
      event,
    });
  }

  onDragEnd(event: DragEvent): void {
    this.isDragging.set(false);
    const element = this.elementRef.nativeElement;
    this.renderer.setAttribute(element, 'aria-grabbed', 'false');

    if (this.dragImage) {
      this.renderer.removeChild(document.body, this.dragImage);
      this.dragImage = null;
    }

    const dropped = event.dataTransfer?.dropEffect !== 'none';

    this.qzDragEnd.emit({
      data: this.dragDropService.dragData(),
      element,
      event,
      dropped,
    });

    this.dragDropService.endDrag(dropped);
  }

  private createDragImage(original: HTMLElement): void {
    if (this.dragImage) {
      this.renderer.removeChild(document.body, this.dragImage);
    }

    this.dragImage = original.cloneNode(true) as HTMLElement;
    this.renderer.setStyle(this.dragImage, 'position', 'fixed');
    this.renderer.setStyle(this.dragImage, 'top', '-1000px');
    this.renderer.setStyle(this.dragImage, 'opacity', '0.9');
    this.renderer.setStyle(this.dragImage, 'transform', 'rotate(3deg)');
    this.renderer.setStyle(this.dragImage, 'pointer-events', 'none');
    this.renderer.setStyle(this.dragImage, 'z-index', '9999');
    this.renderer.setStyle(this.dragImage, 'width', original.offsetWidth + 'px');

    this.renderer.appendChild(document.body, this.dragImage);
  }
}
