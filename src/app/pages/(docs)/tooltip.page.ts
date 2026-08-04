import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TooltipDirective } from 'quartz';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import {
  BASIC_SNIPPET,
  PLACEMENT_SNIPPET,
  RICH_SNIPPET,
  INTERACTIVE_SNIPPET,
  DELAY_SNIPPET,
} from './tooltip.snippets';
import { VoltButton } from '@voltui/components';

@Component({
  selector: 'app-tooltip-page',
  imports: [TooltipDirective, DemoPageComponent, CodeBlockComponent, VoltButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tooltip.page.html',
})
export default class TooltipPage {
  readonly basicCode = BASIC_SNIPPET;
  readonly placementCode = PLACEMENT_SNIPPET;
  readonly richCode = RICH_SNIPPET;
  readonly interactiveCode = INTERACTIVE_SNIPPET;
  readonly delayCode = DELAY_SNIPPET;

  readonly placements: { label: string; value: string }[] = [
    { label: 'Top', value: 'top' },
    { label: 'Bottom', value: 'bottom' },
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
  ];
}
