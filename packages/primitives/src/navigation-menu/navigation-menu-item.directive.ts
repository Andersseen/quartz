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
import type { TemplateRef } from '@angular/core';
import { QzIdGenerator, type CollectionItem } from '@quartz-headless/core';
import { NavigationMenuDirective } from './navigation-menu.directive';
import type { NavigationMenuTriggerDirective } from './navigation-menu-trigger.directive';

@Directive({
  selector: '[qzNavigationMenuItem]',
  exportAs: 'qzNavigationMenuItem',
  standalone: true,
  host: {
    '[attr.data-qz-navigation-menu-item]': '""',
    '[attr.data-qz-disabled]': 'itemDisabled() ? "" : null',
  },
})
export class NavigationMenuItemDirective implements OnInit, OnDestroy, CollectionItem {
  private readonly ids = inject(QzIdGenerator);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly navigationMenu = inject(NavigationMenuDirective);
  private triggerDirective: NavigationMenuTriggerDirective | null = null;
  private templateRef: TemplateRef<unknown> | null = null;

  readonly qzNavigationMenuItem = input.required<string>();
  readonly qzNavigationMenuItemDisabled = input(false, { transform: booleanAttribute });
  readonly id = this.ids.next('qz-navigation-menu-item');
  readonly disabled = () => this.itemDisabled();
  readonly itemDisabled = computed(
    () => this.navigationMenu.disabled() || this.qzNavigationMenuItemDisabled(),
  );
  readonly element = () => this.triggerDirective?.element() ?? this.host.nativeElement;
  readonly label = () => this.triggerDirective?.element().textContent?.trim() ?? '';

  value(): string {
    return this.qzNavigationMenuItem();
  }

  ngOnInit(): void {
    this.navigationMenu.registerItem(this);
  }

  ngOnDestroy(): void {
    this.navigationMenu.unregisterItem(this);
  }

  setTrigger(trigger: NavigationMenuTriggerDirective | null): void {
    this.triggerDirective = trigger;
  }

  trigger(): NavigationMenuTriggerDirective | null {
    return this.triggerDirective;
  }

  setContent(template: TemplateRef<unknown> | null): void {
    this.templateRef = template;
    this.navigationMenu.contentChanged(this, template !== null);
  }

  content(): TemplateRef<unknown> | null {
    return this.templateRef;
  }
}
