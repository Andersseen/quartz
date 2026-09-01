import {
  Directive,
  ElementRef,
  OnDestroy,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { SidebarDirective } from './sidebar.directive';

@Directive({
  selector: '[qzSidebarTrigger]',
  exportAs: 'qzSidebarTrigger',
  standalone: true,
  host: {
    type: 'button',
    '[attr.aria-expanded]': 'sidebar.open()',
    '[attr.aria-controls]': 'panelId()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.data-qz-open]': 'sidebar.open() ? "" : null',
    '[attr.data-qz-collapsed]': 'sidebar.collapsed() ? "" : null',
    '[attr.data-qz-state]': 'sidebar.state()',
    '[attr.data-qz-disabled]': 'disabled() ? "" : null',
    '(click)': 'toggle($event)',
  },
})
export class SidebarTriggerDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly sidebar = inject(SidebarDirective);
  private readonly controlledPanelId = signal<string | null>(null);

  readonly disabled = input(false, {
    alias: 'qzSidebarTriggerDisabled',
    transform: booleanAttribute,
  });
  readonly panelId = computed(() => this.controlledPanelId());

  constructor() {
    this.sidebar.registerTrigger(this);
  }

  ngOnDestroy(): void {
    this.sidebar.unregisterTrigger(this);
  }

  element(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  setControlledPanelId(id: string | null): void {
    this.controlledPanelId.set(id);
  }

  toggle(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      return;
    }
    this.sidebar.toggle();
  }
}
