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
import { QzIdGenerator } from '@quartz-headless/core';
import { AccordionDirective } from './accordion.directive';

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
  private readonly ids = inject(QzIdGenerator);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly accordion = inject(AccordionDirective<T>);
  private triggerElement: HTMLElement | null = null;
  hasFocus = false;

  readonly value = input.required<T>({ alias: 'qzAccordionItem' });
  readonly disabled = input(false, {
    alias: 'qzAccordionItemDisabled',
    transform: booleanAttribute,
  });

  readonly id = this.ids.next('qz-accordion-trigger');
  readonly panelId = `qz-accordion-panel-${this.id.slice('qz-accordion-trigger-'.length)}`;
  readonly itemDisabled = computed(() => this.accordion.disabled() || this.disabled());
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

  setFocused(focused: boolean): void {
    this.hasFocus = focused;
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
    this.accordion.handleTriggerKeydown(this, event);
  }

  requiredOpen(): boolean {
    return this.accordion.isRequiredOpen(this);
  }

  useRegion(): boolean {
    return this.accordion.region();
  }
}
