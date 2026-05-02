import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import {
  SplitterContainerDirective,
  SplitterHandleDirective,
  SplitterPanelDirective,
} from 'quartz';
import { DecimalPipe } from '@angular/common';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { HORIZONTAL_SNIPPET, VERTICAL_SNIPPET } from './splitter.snippets';

@Component({
  selector: 'app-splitter-page',
  imports: [
    SplitterContainerDirective,
    SplitterHandleDirective,
    SplitterPanelDirective,
    DecimalPipe,
    DemoPageComponent,
    CodeBlockComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './splitter.page.html',
})
export default class SplitterPage {
  hPosition = signal(40);
  vPosition = signal(55);

  readonly horizontalCode = HORIZONTAL_SNIPPET;
  readonly verticalCode = VERTICAL_SNIPPET;
}
