import { Directive, ElementRef, input, inject, booleanAttribute } from '@angular/core';
import { SplitterGroupService } from './splitter-group.service';

@Directive({
  selector: '[qzSplitterPanel]',
  host: {
    '[class.qz-splitter-panel]': 'true',
    '[class.qz-splitter-panel--primary]': 'isPrimary()',
    '[class.qz-splitter-panel--secondary]': '!isPrimary()',
    '[style.overflow]': '"auto"',
  }
})
export class SplitterPanelDirective {
  private elementRef = inject(ElementRef<HTMLElement>);
  private groupService = inject(SplitterGroupService);
  
  isPrimary = input<boolean, string | boolean>(true, { 
    alias: 'qzSplitterPanel',
    transform: booleanAttribute 
  });
  
  constructor() {
    // Subscribe to position changes
    this.groupService.position$.subscribe((position) => {
      this.updateSize(position);
    });
    
    // Subscribe to orientation changes
    this.groupService.orientation$.subscribe(() => {
      this.updateSize(this.groupService.position);
    });
    
    // Initial sizing
    this.updateSize(this.groupService.position);
  }
  
  private updateSize(position: number): void {
    const element = this.elementRef.nativeElement;
    const isHorizontal = this.groupService.orientation === 'horizontal';
    
    if (isHorizontal) {
      if (this.isPrimary()) {
        element.style.width = `${position}%`;
        element.style.height = '100%';
        element.style.flex = 'none';
      } else {
        element.style.width = `${100 - position}%`;
        element.style.height = '100%';
        element.style.flex = 'none';
      }
    } else {
      if (this.isPrimary()) {
        element.style.height = `${position}%`;
        element.style.width = '100%';
        element.style.flex = 'none';
      } else {
        element.style.height = `${100 - position}%`;
        element.style.width = '100%';
        element.style.flex = 'none';
      }
    }
  }
}
