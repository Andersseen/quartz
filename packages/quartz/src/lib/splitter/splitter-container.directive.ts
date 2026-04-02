import { Directive, ElementRef, inject, input, output, effect } from '@angular/core';
import { SplitterService } from './splitter.service';
import { SplitterOrientation } from './splitter.types';

@Directive({
  selector: '[qzSplitterContainer]',
  providers: [SplitterService],
  host: {
    '[class.qz-splitter-container]': 'true',
    '[class.qz-splitter-container--horizontal]': 'orientation() === "horizontal"',
    '[class.qz-splitter-container--vertical]': 'orientation() === "vertical"',
    '[class.qz-splitter-container--dragging]': 'splitterService.isDragging()',
    '[style.display]': '"flex"',
    '[style.flex-direction]': 'orientation() === "horizontal" ? "row" : "column"',
    '[style.width]': '"100%"',
    '[style.height]': '"100%"',
    '[style.overflow]': '"hidden"',
  },
})
export class SplitterContainerDirective {
  private elementRef = inject(ElementRef<HTMLElement>);
  readonly splitterService = inject(SplitterService);

  // Inputs
  readonly orientation = input<SplitterOrientation>('horizontal');
  readonly minSize = input<number>(0);
  readonly maxSize = input<number>(100);
  readonly step = input<number>(1);
  readonly defaultPosition = input<number>(50);

  // Outputs
  readonly positionChange = output<number>();
  readonly dragStart = output<void>();
  readonly dragEnd = output<void>();

  constructor() {
    // Initialize service with config
    effect(() => {
      this.splitterService.updateConfig({
        minSize: this.minSize(),
        maxSize: this.maxSize(),
        step: this.step(),
        defaultPosition: this.defaultPosition(),
      });
    });

    // Sync orientation to service
    effect(() => {
      this.splitterService.setOrientation(this.orientation());
    });

    // Emit position changes
    effect(() => {
      const position = this.splitterService.position();
      this.positionChange.emit(position);
    });

    // Emit drag events
    effect(() => {
      const isDragging = this.splitterService.isDragging();
      if (isDragging) {
        this.dragStart.emit();
      } else {
        this.dragEnd.emit();
      }
    });

    // Set initial position
    this.splitterService.setPosition(this.defaultPosition());
  }

  updateContainerRect(): void {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    this.splitterService.setContainerRect(rect);
  }
}
