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

  readonly orientation = input<SplitterOrientation>('horizontal');
  readonly minSize = input<number>(0);
  readonly maxSize = input<number>(100);
  readonly step = input<number>(1);
  readonly defaultPosition = input<number>(50);

  readonly positionChange = output<number>();
  readonly dragStart = output<void>();
  readonly dragEnd = output<void>();

  constructor() {
    effect(() => {
      this.splitterService.updateConfig({
        minSize: this.minSize(),
        maxSize: this.maxSize(),
        step: this.step(),
        defaultPosition: this.defaultPosition(),
      });
    });

    effect(() => {
      this.splitterService.setOrientation(this.orientation());
    });

    let positionInitialized = false;
    effect(() => {
      const position = this.splitterService.position();
      if (!positionInitialized) {
        positionInitialized = true;
        return;
      }
      this.positionChange.emit(position);
    });

    let draggingInitialized = false;
    effect(() => {
      const isDragging = this.splitterService.isDragging();
      if (!draggingInitialized) {
        draggingInitialized = true;
        return;
      }
      if (isDragging) {
        this.dragStart.emit();
      } else {
        this.dragEnd.emit();
      }
    });

    this.splitterService.setPosition(this.defaultPosition());
  }

  updateContainerRect(): void {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    this.splitterService.setContainerRect(rect);
  }
}
