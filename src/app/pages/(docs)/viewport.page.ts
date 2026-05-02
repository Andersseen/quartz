import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ViewportService, ViewportMatchDirective } from 'quartz';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { BASIC_SNIPPET, MATCH_SNIPPET, API_SNIPPET } from './viewport.snippets';

@Component({
  selector: 'app-viewport-page',
  imports: [DecimalPipe, ViewportMatchDirective, DemoPageComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './viewport.page.html',
})
export default class ViewportPage {
  readonly viewport = inject(ViewportService);

  readonly basicCode = BASIC_SNIPPET;
  readonly matchCode = MATCH_SNIPPET;
  readonly apiCode = API_SNIPPET;

  readonly customMin = this.viewport.minWidth(900);
  readonly customMax = this.viewport.maxWidth(600);
}
