import {
  Directive,
  ElementRef,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { NavigationMenuDirective } from './navigation-menu.directive';
import { NavigationMenuItemDirective } from './navigation-menu-item.directive';

@Directive({
  selector: 'button[qzNavigationMenuTrigger]',
  exportAs: 'qzNavigationMenuTrigger',
  standalone: true,
  host: {
    type: 'button',
    '[attr.aria-expanded]': 'navigationMenu.isActive(item)',
    '[attr.aria-controls]': 'navigationMenu.controlsId(item)',
    '[attr.aria-disabled]': 'item.itemDisabled() ? "true" : null',
    '[disabled]': 'item.itemDisabled()',
    '[attr.data-qz-open]': 'navigationMenu.isActive(item) ? "" : null',
    '(click)': 'onClick()',
    '(focus)': 'onFocus()',
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'onPointerLeave()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class NavigationMenuTriggerDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLButtonElement>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  readonly item = inject(NavigationMenuItemDirective);
  protected readonly navigationMenu = inject(NavigationMenuDirective);
  readonly element = () => this.elementRef.nativeElement;
  readonly viewContainer = () => this.viewContainerRef;

  constructor() {
    this.navigationMenu.setTrigger(this.item, this);
  }

  onClick(): void {
    this.navigationMenu.toggle(this.item);
  }

  onFocus(): void {
    this.navigationMenu.focusTrigger(this.item);
  }

  onPointerEnter(event: PointerEvent): void {
    if (event.pointerType !== 'touch') this.navigationMenu.scheduleShow(this.item);
  }

  onPointerLeave(): void {
    this.navigationMenu.scheduleHide();
  }

  onKeydown(event: KeyboardEvent): void {
    this.navigationMenu.handleTriggerKeydown(this.item, event);
  }

  ngOnDestroy(): void {
    this.navigationMenu.setTrigger(this.item, null);
  }
}

@Directive({
  selector: 'ng-template[qzNavigationMenuContent]',
  exportAs: 'qzNavigationMenuContent',
  standalone: true,
})
export class NavigationMenuContentDirective implements OnDestroy {
  private readonly template = inject<TemplateRef<unknown>>(TemplateRef);
  private readonly item = inject(NavigationMenuItemDirective);

  constructor() {
    this.item.setContent(this.template);
  }

  ngOnDestroy(): void {
    this.item.setContent(null);
  }
}
