// Everything below is COPIED SOURCE produced by `quartz add` (see scripts/consumer/cli.mjs); the
// folder name deliberately contains a space. `@quartz-headless/core` is the installed peer that
// copied Primitives import. There are no path aliases and no workspace links.
import { Component, TemplateRef, ViewContainerRef, inject, signal, viewChild } from '@angular/core';
import {
  AccordionDirective,
  AccordionItemDirective,
  AccordionPanelDirective,
  AccordionTriggerDirective,
} from './quartz sources/accordion';
import { DialogService } from './quartz sources/dialog';
import {
  SplitterContainerDirective,
  SplitterHandleDirective,
  SplitterPanelDirective,
} from './quartz sources/splitter';

@Component({
  selector: 'app-root',
  imports: [
    AccordionDirective,
    AccordionItemDirective,
    AccordionPanelDirective,
    AccordionTriggerDirective,
    SplitterContainerDirective,
    SplitterHandleDirective,
    SplitterPanelDirective,
  ],
  template: `
    <div qzAccordion [(value)]="open">
      <section qzAccordionItem="a">
        <button qzAccordionTrigger>Details</button>
        <div qzAccordionPanel>Panel A</div>
      </section>
    </div>

    <div qzSplitterContainer orientation="horizontal" [minSize]="20" [maxSize]="80" [step]="5">
      <div qzSplitterPanel>Left</div>
      <div qzSplitterHandle aria-label="Resize panels" data-testid="handle"></div>
      <div [qzSplitterPanel]="false">Right</div>
    </div>

    <button type="button" data-testid="open" (click)="openDialog()">Open dialog</button>
    <ng-template #tpl let-ref>
      <div role="document" data-testid="dialog-body">
        Hello <button type="button" (click)="ref.close()">Close</button>
      </div>
    </ng-template>
  `,
})
export class App {
  private readonly dialogs = inject(DialogService);
  private readonly vcr = inject(ViewContainerRef);
  readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
  readonly open = signal<string | string[] | null>(null);

  openDialog(): void {
    this.dialogs.open(this.tpl(), this.vcr, { ariaLabel: 'Demo' });
  }
}
