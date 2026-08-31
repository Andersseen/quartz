import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { AccordionDirective } from './accordion.directive';

let accordionItemId = 0;

@Directive({
  selector: '[qzAccordionItem]',
  exportAs: 'qzAccordionItem',
  standalone: true,
  host: {
    '[attr.data-qz-state]': 'open() ? "open" : "closed"',
    '[attr.data-qz-disabled]': 'itemDisabled() ? "" : null',
  },
})
export class AccordionItemDirective<T> implements OnInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly accordion = inject(AccordionDirective<T>);
  private triggerElement: HTMLElement | null = null;

  readonly value = input.required<T>({ alias: 'qzAccordionItem' });
  readonly disabled = input(false, {
    alias: 'qzAccordionItemDisabled',
    transform: booleanAttribute,
  });

  readonly id = `qz-accordion-trigger-${++accordionItemId}`;
  readonly panelId = `qz-accordion-panel-${accordionItemId}`;
  readonly itemDisabled = computed(() => this.disabled());
  readonly open = computed(() => this.accordion.isOpen(this));
  readonly element = () => this.triggerElement ?? this.host.nativeElement;
  readonly label = () => this.triggerElement?.textContent?.trim() ?? '';

  ngOnInit(): void {
    this.accordion.registerItem(this);
  }

  ngOnDestroy(): void {
    this.accordion.unregisterItem(this);
  }

  setTriggerElement(element: HTMLElement | null): void {
    this.triggerElement = element;
    if (element) this.accordion.refreshItems();
  }

  activeTabIndex(): 0 | -1 {
    return this.accordion.activeTabIndex(this.id);
  }

  toggle(): void {
    this.accordion.toggle(this);
  }

  setActive(options: { focus?: boolean } = {}): void {
    this.accordion.setActive(this, options);
  }

  handleKeydown(event: KeyboardEvent): void {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Home' ||
      event.key === 'End'
    ) {
      this.setActive();
    }
    this.accordion.handleTriggerKeydown(this, event);
  }

  useRegion(): boolean {
    return this.accordion.region();
  }
}
