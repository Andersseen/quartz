import { Directive, ElementRef, inject, input, effect, booleanAttribute } from '@angular/core';
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop';
import { skip, filter, map } from 'rxjs';
import { SplitterService } from './splitter.service';
import { SplitterOrientation } from './splitter.types';
import { resolveDirection } from '../directionality';

@Directive({
  selector: '[qzSplitterContainer]',
  standalone: true,
  providers: [SplitterService],
  host: {
    '[class.qz-splitter-container]': 'true',
    '[class.qz-splitter-container--horizontal]': 'orientation() === "horizontal"',
    '[class.qz-splitter-container--vertical]': 'orientation() === "vertical"',
    '[class.qz-splitter-container--dragging]': 'splitterService.isDragging()',
    '[attr.data-qz-resizing]': 'splitterService.resizing() ? "" : null',
    '[style.display]': '"flex"',
    '[style.flex-direction]': 'orientation() === "horizontal" ? "row" : "column"',
    '[style.width]': '"100%"',
    '[style.height]': '"100%"',
    '[style.overflow]': '"hidden"',
  },
})
export class SplitterContainerDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  readonly splitterService = inject(SplitterService);

  readonly orientation = input<SplitterOrientation>('horizontal');
  readonly minSize = input<number>(0);
  readonly maxSize = input<number>(100);
  readonly step = input<number>(1);
  readonly defaultPosition = input<number>(50);
  /** Turns pointer and keyboard resizing off. */
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly positionChange = outputFromObservable(
    toObservable(this.splitterService.position).pipe(skip(1)),
  );

  private readonly isDragging$ = toObservable(this.splitterService.isDragging).pipe(skip(1));

  readonly dragStart = outputFromObservable(
    this.isDragging$.pipe(
      filter((v) => v),
      map(() => void 0 as void),
    ),
  );
  readonly dragEnd = outputFromObservable(
    this.isDragging$.pipe(
      filter((v) => !v),
      map(() => void 0 as void),
    ),
  );

  constructor() {
    let positionInitialized = false;

    effect(() => {
      this.splitterService.updateConfig({
        minSize: this.minSize(),
        maxSize: this.maxSize(),
        step: this.step(),
        defaultPosition: this.defaultPosition(),
      });

      if (!positionInitialized) {
        positionInitialized = true;
        this.splitterService.setPosition(this.defaultPosition());
      }
    });

    effect(() => {
      this.splitterService.setOrientation(this.orientation());
    });

    effect(() => {
      this.splitterService.setDisabled(this.disabled());
    });
  }

  updateContainerRect(): void {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    this.splitterService.setContainerRect(rect);
    this.splitterService.setDirection(resolveDirection(this.elementRef.nativeElement));
  }
}
