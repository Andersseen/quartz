import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { PopoverDirective, PopoverTriggerDirective } from '@quartz-headless/primitives';
import type { OverlayPlacement } from '@quartz-headless/core';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { BASIC_SNIPPET, CONTROLLED_SNIPPET } from './popover.snippets';

@Component({
  selector: 'app-popover-page',
  imports: [DemoPageComponent, CodeBlockComponent, PopoverDirective, PopoverTriggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './popover.page.html',
})
export default class PopoverPage {
  readonly basicCode = BASIC_SNIPPET;
  readonly controlledCode = CONTROLLED_SNIPPET;
  readonly open = signal(false);
  readonly placement: OverlayPlacement = 'bottom-start';
}
