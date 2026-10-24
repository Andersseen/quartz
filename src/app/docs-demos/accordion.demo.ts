import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  AccordionDirective,
  AccordionItemDirective,
  AccordionPanelDirective,
  AccordionTriggerDirective,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-accordion-demo',
  imports: [
    AccordionDirective,
    AccordionItemDirective,
    AccordionTriggerDirective,
    AccordionPanelDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './accordion.demo.html',
})
export class AccordionDemoComponent {
  readonly section = signal<string | string[] | null>(null);
  readonly collapsibleSection = signal<string | string[] | null>('faq');
  readonly sections = signal<string | string[] | null>(['one']);
}
