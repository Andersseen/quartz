import { Directive, ElementRef, inject, effect } from '@angular/core';
import { SplitterService } from './splitter.service';

@Directive({
  selector: '[qzSplitterHandle]',
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

    '(mousedown)': 'onMouseDown($event)',
    '(touchstart)': 'onTouchStart($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class SplitterHandleDirective {
  private elementRef = inject(ElementRef<HTMLElement>);
  protected splitterService = inject(SplitterService);

  private isDragging = false;

  constructor() {
    effect(() => {
      if (this.splitterService.isDragging()) {
        this.updateContainerRect();
      }
    });
  }

  private updateContainerRect(): void {
    const container = this.findContainer();
    if (container) {
      const rect = container.getBoundingClientRect();
      this.splitterService.setContainerRect(rect);
    }
  }

  private findContainer(): HTMLElement | null {
    let element: HTMLElement | null = this.elementRef.nativeElement.parentElement;
    while (element) {
      if (
        element.hasAttribute('qzsplittercontainer') ||
        element.hasAttribute('qzSplitterContainer') ||
        element.hasAttribute('ng-reflect-orientation')
      ) {
        return element;
      }

      if (element.classList.contains('qz-splitter-container')) {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  }

  onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.startDrag();
    this.addDocumentListeners();
  }

  onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.startDrag();
    this.addTouchListeners();
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
    this.isDragging = false;
    this.splitterService.stopDragging();
    this.removeDocumentListeners();
  }

  private addDocumentListeners(): void {
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  private removeDocumentListeners(): void {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  private addTouchListeners(): void {
    document.addEventListener('touchmove', this.onTouchMove, { passive: false });
    document.addEventListener('touchend', this.onTouchEnd);
    document.addEventListener('touchcancel', this.onTouchEnd);
  }

  private removeTouchListeners(): void {
    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onTouchEnd);
    document.removeEventListener('touchcancel', this.onTouchEnd);
  }

  private onMouseMove = (event: MouseEvent): void => {
    if (!this.isDragging) return;
    const newPosition = this.splitterService.calculatePositionFromEvent(
      event.clientX,
      event.clientY,
    );
    this.splitterService.setPosition(newPosition);
  };

  private onMouseUp = (): void => {
    this.stopDrag();
  };

  private onTouchMove = (event: TouchEvent): void => {
    if (!this.isDragging) return;
    event.preventDefault();
    const touch = event.touches[0];
    if (touch) {
      const newPosition = this.splitterService.calculatePositionFromTouch(touch);
      this.splitterService.setPosition(newPosition);
    }
  };

  private onTouchEnd = (): void => {
    this.stopDrag();
    this.removeTouchListeners();
  };
}
