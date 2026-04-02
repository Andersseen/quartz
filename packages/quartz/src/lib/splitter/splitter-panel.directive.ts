import { Directive, inject, input, booleanAttribute } from '@angular/core';
import { SplitterService } from './splitter.service';

@Directive({
  selector: '[qzSplitterPanel]',
  host: {
    '[class.qz-splitter-panel]': 'true',
    '[class.qz-splitter-panel--primary]': 'isPrimary()',
    '[class.qz-splitter-panel--secondary]': '!isPrimary()',
    '[class.qz-splitter-panel--horizontal]': 'splitterService.isHorizontal()',
    '[class.qz-splitter-panel--vertical]': 'splitterService.isVertical()',
    '[style.overflow]': '"auto"',
    '[style.width.%]': 'panelWidth()',
    '[style.height.%]': 'panelHeight()',
    '[style.flex]': '"none"',
    '[style.min-width]': 'isPrimary() ? "0" : "none"',
    '[style.min-height]': 'isPrimary() ? "0" : "none"',
    '[style.max-width]': 'isPrimary() ? "none" : "100%"',
    '[style.max-height]': 'isPrimary() ? "none" : "100%"',
  },
})
export class SplitterPanelDirective {
  protected splitterService = inject(SplitterService);

  isPrimary = input<boolean, string | boolean>(true, {
    alias: 'qzSplitterPanel',
    transform: booleanAttribute,
  });

  // Computed styles based on orientation and position
  panelWidth = () => {
    if (this.splitterService.isHorizontal()) {
      return this.isPrimary()
        ? this.splitterService.position()
        : 100 - this.splitterService.position();
    }
    return 100;
  };

  panelHeight = () => {
    if (this.splitterService.isVertical()) {
      return this.isPrimary()
        ? this.splitterService.position()
        : 100 - this.splitterService.position();
    }
    return 100;
  };
}
