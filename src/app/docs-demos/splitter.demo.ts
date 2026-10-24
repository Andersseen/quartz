import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import {
  SplitterContainerDirective,
  SplitterHandleDirective,
  SplitterPanelDirective,
} from '@quartz-headless/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-splitter-demo',
  imports: [
    SplitterContainerDirective,
    SplitterHandleDirective,
    SplitterPanelDirective,
    DecimalPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './splitter.demo.html',
})
export class SplitterDemoComponent {
  hPosition = signal(40);
  vPosition = signal(55);
}
