import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ViewportService, ViewportMatchDirective } from '@quartz-headless/core';

@Component({
  selector: 'app-viewport-demo',
  imports: [DecimalPipe, ViewportMatchDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './viewport.demo.html',
})
export class ViewportDemoComponent {
  readonly viewport = inject(ViewportService);
  readonly customMin = this.viewport.minWidth(900);
  readonly customMax = this.viewport.maxWidth(600);
}
