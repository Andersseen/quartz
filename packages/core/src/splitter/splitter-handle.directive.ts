import { Directive, ElementRef, inject, OnDestroy } from '@angular/core';
import { SplitterService } from './splitter.service';
import { SplitterContainerDirective } from './splitter-container.directive';

/**
 * The draggable/keyboard separator between two panels.
 *
 * `aria-orientation` follows WAI-ARIA: it describes the separator's own axis, not the layout's.
 * A `horizontal` container lays panels out in a row, so its separator is a *vertical* bar
 * (`aria-orientation="vertical"`), and the other way round. Give the handle an accessible name
 * with `aria-label`/`aria-labelledby`.
 */
@Directive({
  selector: '[qzSplitterHandle]',
  standalone: true,
  host: {
    '[class.qz-splitter-handle]': 'true',
    '[class.qz-splitter-handle--dragging]': 'splitterService.isDragging()',
    '[class.qz-splitter-handle--horizontal]': 'splitterService.isHorizontal()',
    '[class.qz-splitter-handle--vertical]': 'splitterService.isVertical()',
    '[attr.data-qz-resizing]': 'splitterService.resizing() ? "" : null',
    '[attr.role]': '"separator"',
    '[attr.tabindex]': '0',
    '[attr.aria-valuemin]': 'splitterService.minSize()',
    '[attr.aria-valuemax]': 'splitterService.maxSize()',
    '[attr.aria-valuenow]': 'splitterService.position()',
    '[attr.aria-orientation]': 'splitterService.isHorizontal() ? "vertical" : "horizontal"',
    '[attr.aria-disabled]': 'splitterService.disabled() ? "true" : null',
    '[style.flex-shrink]': '"0"',
    '[style.cursor]':
      'splitterService.disabled() ? null : splitterService.isHorizontal() ? "col-resize" : "row-resize"',
    '[style.user-select]': '"none"',
    '[style.touch-action]': '"none"',

    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerEnd($event)',
    '(pointercancel)': 'onPointerEnd($event)',
    '(lostpointercapture)': 'onPointerEnd($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class SplitterHandleDirective implements OnDestroy {
  private elementRef = inject(ElementRef<HTMLElement>);
  protected splitterService = inject(SplitterService);
  private container = inject(SplitterContainerDirective, { optional: true });

  private isDragging = false;
  private pointerId: number | null = null;

  ngOnDestroy(): void {
    this.releaseCapture();
    this.stopDrag();
  }

  private updateContainerRect(): void {
    if (this.container) {
      this.container.updateContainerRect();
    }
  }

  private releaseCapture(): void {
    if (this.pointerId === null) return;
    const el: HTMLElement = this.elementRef.nativeElement;
    const id = this.pointerId;
    this.pointerId = null;
    // Throws NotFoundError when the capture is already gone (lostpointercapture, detached node).
    try {
      if (el.hasPointerCapture?.(id)) el.releasePointerCapture?.(id);
    } catch {
      /* already released */
    }
  }

  onPointerDown(event: PointerEvent): void {
    if (this.splitterService.disabled()) return;
    // Only the primary button (or touch/pen contact) starts a drag.
    if (event.button !== undefined && event.button > 0) return;
    event.preventDefault();
    event.stopPropagation();
    // A second pointer while one is dragging is ignored; it must not steal the drag.
    if (this.pointerId !== null) return;
    this.pointerId = event.pointerId;
    this.elementRef.nativeElement.setPointerCapture?.(event.pointerId);
    this.startDrag();
  }

  onPointerMove(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId || !this.isDragging) return;
    const newPosition = this.splitterService.calculatePositionFromEvent(
      event.clientX,
      event.clientY,
    );
    this.splitterService.setPosition(newPosition);
  }

  /** pointerup, pointercancel and lostpointercapture all end the drag. */
  onPointerEnd(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) return;
    this.releaseCapture();
    this.stopDrag();
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.splitterService.disabled()) return;
    const step = this.splitterService.step();
    let newPosition = this.splitterService.position();
    const isHorizontal = this.splitterService.isHorizontal();
    // In RTL the primary panel sits on the right, so ArrowLeft grows it.
    const rtl =
      isHorizontal && this.container
        ? (this.updateContainerRect(), this.splitterService.direction() === 'rtl')
        : false;

    switch (event.key) {
      case isHorizontal ? 'ArrowLeft' : 'ArrowUp':
        newPosition += rtl ? step : -step;
        break;
      case isHorizontal ? 'ArrowRight' : 'ArrowDown':
        newPosition += rtl ? -step : step;
        break;
      case 'Home':
        newPosition = this.splitterService.minSize();
        break;
      case 'End':
        newPosition = this.splitterService.maxSize();
        break;
      default:
        return;
    }

    event.preventDefault();
    this.splitterService.setPosition(newPosition);
  }

  private startDrag(): void {
    if (this.isDragging) return;
    this.isDragging = true;
    this.updateContainerRect();
    this.splitterService.startDragging();
  }

  private stopDrag(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.splitterService.stopDragging();
  }
}
