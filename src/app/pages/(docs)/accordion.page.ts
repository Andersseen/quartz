import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  AccordionDirective,
  AccordionItemDirective,
  AccordionPanelDirective,
  AccordionTriggerDirective,
} from '@quartz-headless/primitives';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { BASIC_SNIPPET, MULTIPLE_SNIPPET } from './accordion.snippets';

@Component({
  selector: 'app-accordion-page',
  imports: [
    AccordionDirective,
    AccordionItemDirective,
    AccordionTriggerDirective,
    AccordionPanelDirective,
    DemoPageComponent,
    CodeBlockComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './accordion.page.html',
})
export default class AccordionPage {
  readonly section = signal<string | string[] | null>(null);
  readonly collapsibleSection = signal<string | string[] | null>('faq');
  readonly sections = signal<string | string[] | null>(['one']);
  readonly basicCode = BASIC_SNIPPET;
  readonly multipleCode = MULTIPLE_SNIPPET;
}
