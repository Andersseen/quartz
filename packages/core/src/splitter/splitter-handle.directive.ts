import { Directive, ElementRef, inject, OnDestroy } from '@angular/core';
import { SplitterService } from './splitter.service';
import { SplitterContainerDirective } from './splitter-container.directive';

@Directive({
  selector: '[qzSplitterHandle]',
  standalone: true,
  host: {
    '[class.qz-splitter-handle]': 'true',
    '[class.qz-splitter-handle--dragging]': 'splitterService.isDragging()',
    '[class.qz-splitter-handle--horizontal]': 'splitterService.isHorizontal()',
    '[class.qz-splitter-handle--vertical]': 'splitterService.isVertical()',
    '[attr.role]': '"separator"',
    '[attr.tabindex]': '0',
    '[attr.aria-valuemin]': 'splitterService.minSize()',
    '[attr.aria-valuemax]': 'splitterService.maxSize()',
    '[attr.aria-valuenow]': 'splitterService.position()',
    '[attr.aria-orientation]': 'splitterService.orientation()',
    '[style.flex-shrink]': '"0"',
    '[style.cursor]': 'splitterService.isHorizontal() ? "col-resize" : "row-resize"',
    '[style.user-select]': '"none"',
    '[style.touch-action]': '"none"',

    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerEnd($event)',
    '(pointercancel)': 'onPointerEnd($event)',
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
    if (this.pointerId !== null) {
      this.elementRef.nativeElement.releasePointerCapture?.(this.pointerId);
      this.pointerId = null;
    }
    this.stopDrag();
  }

  private updateContainerRect(): void {
    if (this.container) {
      this.container.updateContainerRect();
    }
  }

  onPointerDown(event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
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

  onPointerEnd(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) return;
    this.elementRef.nativeElement.releasePointerCapture?.(event.pointerId);
    this.pointerId = null;
    this.stopDrag();
  }

  onKeydown(event: KeyboardEvent): void {
    const step = this.splitterService.step();
    let newPosition = this.splitterService.position();
    const isHorizontal = this.splitterService.isHorizontal();

    switch (event.key) {
      case isHorizontal ? 'ArrowLeft' : 'ArrowUp':
        newPosition -= step;
        break;
      case isHorizontal ? 'ArrowRight' : 'ArrowDown':
        newPosition += step;
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

    this.updateContainerRect();
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
