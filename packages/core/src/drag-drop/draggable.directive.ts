import {
  Directive,
  ElementRef,
  inject,
  signal,
  booleanAttribute,
  computed,
  input,
  output,
  Renderer2,
  PLATFORM_ID,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DragDropService } from './drag-drop.service';
import type { DragDropConfig, QzDragInfo, QzDragEndInfo } from './drag-drop.types';

/**
 * Wraps native HTML5 Drag and Drop (`dragstart`/`dragend`/`dragenter`/`dragleave`/`dragover`/
 * `drop`). This is pointer-only, low-level infrastructure — native browser drag-and-drop is not
 * keyboard-operable by design, and this directive does not attempt to provide a keyboard
 * alternative. Applications that need keyboard/AT-accessible reordering should provide an
 * alternative interaction (e.g. move-up/move-down buttons) alongside this.
 */
@Directive({
  selector: '[qzDraggable]',
  standalone: true,
  host: {
    '[draggable]': '!isDisabled()',
    '[class.qz-draggable]': 'true',
    '[class.qz-dragging]': 'isDragging()',
    '[class.qz-disabled]': 'isDisabled()',
    '[attr.data-qz-dragging]': 'isDragging() ? "" : null',
    '[attr.data-qz-disabled]': 'isDisabled() ? "" : null',
    '(dragstart)': 'onDragStart($event)',
    '(dragend)': 'onDragEnd($event)',
  },
})
export class DraggableDirective {
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private dragDropService = inject(DragDropService);
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

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

  /** An explicit input wins; the object config remains a convenient shorthand. */
  readonly isDisabled = computed(
    () => this.qzDraggableDisabled() || this.getConfig().disabled === true,
  );

  private getConfig(): DragDropConfig {
    const cfg = this.qzDraggable();
    return typeof cfg === 'object' && cfg !== null ? cfg : {};
  }

  onDragStart(event: DragEvent): void {
    if (this.isDisabled() || !this.isAllowedHandle(event)) {
      event.preventDefault();
      return;
    }

    this.isDragging.set(true);
    const element = this.elementRef.nativeElement;

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

    this.removeDragImage();

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
    this.removeDragImage();

    if (!this.isBrowser || !this.document.body) {
      return;
    }

    this.dragImage = original.cloneNode(true) as HTMLElement;
    this.renderer.setStyle(this.dragImage, 'position', 'fixed');
    this.renderer.setStyle(this.dragImage, 'top', '-1000px');
    this.renderer.setStyle(this.dragImage, 'pointer-events', 'none');
    this.renderer.setStyle(this.dragImage, 'z-index', '9999');
    this.renderer.setStyle(this.dragImage, 'width', original.offsetWidth + 'px');

    this.renderer.appendChild(this.document.body, this.dragImage);
  }

  private removeDragImage(): void {
    if (!this.dragImage) {
      return;
    }

    if (this.document.body) {
      this.renderer.removeChild(this.document.body, this.dragImage);
    }
    this.dragImage = null;
  }

  private isAllowedHandle(event: DragEvent): boolean {
    const selector = this.qzDraggableHandle() ?? this.getConfig().handle;
    if (!selector) return true;

    const target = event.target;
    if (!(target instanceof Element)) return false;

    const handle = target.closest(selector);
    return !!handle && this.elementRef.nativeElement.contains(handle);
  }
}
