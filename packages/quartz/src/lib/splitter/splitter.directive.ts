import { Directive, ElementRef, input, inject, HostListener, output } from '@angular/core';
import { SplitterContainerDirective } from './splitter-container.directive';
import { SplitterGroupService } from './splitter-group.service';

@Directive({
  selector: '[qzSplitter]',
  host: {
    '[class.qz-splitter]': 'true',
    '[class.qz-splitter--dragging]': 'container.groupService.isDragging',
    '[attr.role]': '"separator"',
    '[attr.tabindex]': '0',
    '[style.flex-shrink]': '0',
  }
})
export class SplitterDirective {
  private elementRef = inject(ElementRef<HTMLElement>);
  protected container = inject(SplitterContainerDirective);
  private groupService = inject(SplitterGroupService);
  
  // Event handlers bound to document
  private onMouseMoveBound = this.onMouseMove.bind(this);
  private onMouseUpBound = this.onMouseUp.bind(this);
  private onTouchMoveBound = this.onTouchMove.bind(this);
  private onTouchEndBound = this.onTouchEnd.bind(this);
  
  // Container rect for calculations
  private containerRect: DOMRect | null = null;

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.startDrag();
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.startDrag();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const step = this.container.step();
    let newPosition = this.groupService.position;
    
    const isHorizontal = this.groupService.orientation === 'horizontal';
    
    switch (event.key) {
      case isHorizontal ? 'ArrowLeft' : 'ArrowUp':
        newPosition -= step;
        break;
      case isHorizontal ? 'ArrowRight' : 'ArrowDown':
        newPosition += step;
        break;
      case 'Home':
        newPosition = this.container.minSize();
        break;
      case 'End':
        newPosition = this.container.maxSize();
        break;
      default:
        return;
    }
    
    event.preventDefault();
    this.container.setPosition(newPosition);
  }
  
  private startDrag(): void {
    if (this.groupService.isDragging) return;
    
    this.containerRect = this.container.getContainerRect();
    this.container.startDrag();
    
    // Add document listeners
    document.addEventListener('mousemove', this.onMouseMoveBound);
    document.addEventListener('mouseup', this.onMouseUpBound);
    document.addEventListener('touchmove', this.onTouchMoveBound, { passive: false });
    document.addEventListener('touchend', this.onTouchEndBound);
    document.addEventListener('touchcancel', this.onTouchEndBound);
  }
  
  private onMouseMove(event: MouseEvent): void {
    if (!this.groupService.isDragging || !this.containerRect) return;
    
    const isHorizontal = this.groupService.orientation === 'horizontal';
    const pos = isHorizontal
      ? (event.clientX - this.containerRect.left) / this.containerRect.width * 100
      : (event.clientY - this.containerRect.top) / this.containerRect.height * 100;
    
    this.container.setPosition(pos);
  }
  
  private onMouseUp(): void {
    this.endDrag();
  }
  
  private onTouchMove(event: TouchEvent): void {
    if (!this.groupService.isDragging || !this.containerRect) return;
    event.preventDefault();
    
    const touch = event.touches[0];
    const isHorizontal = this.groupService.orientation === 'horizontal';
    const pos = isHorizontal
      ? (touch.clientX - this.containerRect.left) / this.containerRect.width * 100
      : (touch.clientY - this.containerRect.top) / this.containerRect.height * 100;
    
    this.container.setPosition(pos);
  }
  
  private onTouchEnd(): void {
    this.endDrag();
  }
  
  private endDrag(): void {
    if (!this.groupService.isDragging) return;
    
    this.container.endDrag();
    
    // Remove document listeners
    document.removeEventListener('mousemove', this.onMouseMoveBound);
    document.removeEventListener('mouseup', this.onMouseUpBound);
    document.removeEventListener('touchmove', this.onTouchMoveBound);
    document.removeEventListener('touchend', this.onTouchEndBound);
    document.removeEventListener('touchcancel', this.onTouchEndBound);
  }
  
  ngOnDestroy(): void {
    this.endDrag();
  }
}
