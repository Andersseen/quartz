import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  OnDestroy,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { defineQuartzBehaviors } from 'quartz-web';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-web-agnostic-page',
  imports: [DemoPageComponent, CodeBlockComponent, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './web-agnostic.page.html',
})
export default class WebAgnosticPage implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly hPosition = signal(40);
  readonly vPosition = signal(55);

  readonly setupCode = `import { defineQuartzBehaviors } from 'quartz-web';

const cleanup = defineQuartzBehaviors();

// later
cleanup();`;

  readonly splitterCode = `<div qz-splitter="horizontal" qz-splitter-min="20" qz-splitter-max="80" qz-splitter-default-position="40">
  <div qz-splitter-panel="primary">Left</div>
  <div qz-splitter-handle></div>
  <div qz-splitter-panel="secondary">Right</div>
</div>`;

  readonly dragDropCode = `<div qz-drop-zone qz-drop-zone-sortable>
  <div qz-draggable qz-draggable-data="item-a">Item A</div>
  <div qz-draggable qz-draggable-data="item-b">Item B</div>
</div>`;

  private cleanup: (() => void) | null = null;

  constructor() {
    afterNextRender(() => {
      this.cleanup = defineQuartzBehaviors({ root: this.elementRef.nativeElement });

      this.elementRef.nativeElement.addEventListener('qz-splitter-change', (event: Event) => {
        const customEvent = event as CustomEvent;
        const detail = customEvent.detail;
        const container = customEvent.target as HTMLElement;
        if (container.getAttribute('qz-splitter') === 'horizontal') {
          this.hPosition.set(detail.position);
        } else {
          this.vPosition.set(detail.position);
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.cleanup?.();
    this.cleanup = null;
  }
}
