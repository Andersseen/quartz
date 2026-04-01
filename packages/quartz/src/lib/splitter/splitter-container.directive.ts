import { Directive, ElementRef, input, output, inject, HostListener, booleanAttribute } from '@angular/core';
import { SplitterGroupService, SplitterOrientation } from './splitter-group.service';

@Directive({
  selector: '[qzSplitterContainer]',
  providers: [SplitterGroupService],
  host: {
    '[class.qz-splitter-container]': 'true',
    '[class.qz-splitter-container--horizontal]': 'orientation() === "horizontal"',
    '[class.qz-splitter-container--vertical]': 'orientation() === "vertical"',
    '[class.qz-splitter-container--dragging]': 'groupService.isDragging',
    '[style.display]': '"flex"',
    '[style.flex-direction]': 'orientation() === "horizontal" ? "row" : "column"',
  }
})
export class SplitterContainerDirective {
  private elementRef = inject(ElementRef<HTMLElement>);
  // Make it public so it can be accessed from child directives
  groupService = inject(SplitterGroupService);
  
  // Inputs
  orientation = input<SplitterOrientation>('horizontal');
  minSize = input<number>(0);
  maxSize = input<number>(100);
  step = input<number>(1);
  
  // Outputs
  positionChange = output<number>();
  dragStart = output<void>();
  dragEnd = output<void>();

  constructor() {
    // Sync orientation to service
    const orientation = this.orientation();
    this.groupService.orientation = orientation;
  }

  getPosition(): number {
    return this.groupService.position;
  }

  setPosition(position: number): void {
    const clamped = Math.max(this.minSize(), Math.min(this.maxSize(), position));
    const stepped = Math.round(clamped / this.step()) * this.step();
    
    this.groupService.position = stepped;
    this.positionChange.emit(stepped);
  }

  startDrag(): void {
    this.groupService.isDragging = true;
    this.dragStart.emit();
  }

  endDrag(): void {
    this.groupService.isDragging = false;
    this.dragEnd.emit();
  }

  getContainerRect(): DOMRect {
    return this.elementRef.nativeElement.getBoundingClientRect();
  }
}
