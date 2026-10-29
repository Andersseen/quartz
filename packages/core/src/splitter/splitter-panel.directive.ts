import { Directive, inject, input, booleanAttribute, computed } from '@angular/core';
import { SplitterService } from './splitter.service';

@Directive({
  selector: '[qzSplitterPanel]',
  standalone: true,
  host: {
    '[class.qz-splitter-panel]': 'true',
    '[class.qz-splitter-panel--primary]': 'isPrimary()',
    '[class.qz-splitter-panel--secondary]': '!isPrimary()',
    '[class.qz-splitter-panel--horizontal]': 'splitterService.isHorizontal()',
    '[class.qz-splitter-panel--vertical]': 'splitterService.isVertical()',
    '[style.overflow]': '"auto"',
    '[style.flex]': 'isPrimary() ? "none" : "1 1 0%"',
    '[style.width]': 'widthStyle()',
    '[style.height]': 'heightStyle()',
    '[style.min-width]': '"0"',
    '[style.min-height]': '"0"',
    '[style.max-width]': '"none"',
    '[style.max-height]': '"none"',
    '[style.box-sizing]': '"border-box"',
  },
})
export class SplitterPanelDirective {
  protected splitterService = inject(SplitterService);

  isPrimary = input<boolean, string | boolean>(true, {
    alias: 'qzSplitterPanel',
    transform: booleanAttribute,
  });

  private panelSize = computed(() => {
    const pos = this.splitterService.position();
    return this.isPrimary() ? pos : 100 - pos;
  });

  // The primary panel takes `position`% of the container's main axis. The secondary panel takes
  // whatever is left (`flex: 1 1 0%`), so a handle with its own thickness never pushes it out of
  // the container.
  widthStyle = computed(() => {
    if (this.splitterService.isHorizontal()) {
      return this.isPrimary() ? `${this.panelSize()}%` : null;
    }
    return '100%';
  });

  heightStyle = computed(() => {
    if (this.splitterService.isVertical()) {
      return this.isPrimary() ? `${this.panelSize()}%` : null;
    }
    return '100%';
  });
}
