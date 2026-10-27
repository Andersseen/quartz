import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { ToolbarDirective } from './toolbar.directive';

let toolbarItemId = 0;

@Directive({
  selector: '[qzToolbarItem]',
  exportAs: 'qzToolbarItem',
  standalone: true,
  host: {
    '[attr.tabindex]': 'tabIndex()',
    '[attr.aria-disabled]': 'itemDisabled() || null',
    '[attr.data-qz-disabled]': 'itemDisabled() ? "" : null',
    '(focus)': 'onFocus()',
    '(blur)': 'onBlur()',
    '(keydown)': 'onKeydown($event)',
    '(click)': 'onClick($event)',
  },
})
export class ToolbarItemDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly toolbar = inject(ToolbarDirective);
  private readonly nativeDisabled = signal(this.elementRef.nativeElement.hasAttribute('disabled'));
  private observer: MutationObserver | null = null;

  readonly disabled = input(false, {
    alias: 'qzToolbarItemDisabled',
    transform: booleanAttribute,
  });
  readonly id = `qz-toolbar-item-${++toolbarItemId}`;
  hasFocus = false;
  readonly element = () => this.elementRef.nativeElement;
  readonly itemDisabled = computed(
    () => this.toolbar.disabled() || this.disabled() || this.nativeDisabled(),
  );
  readonly tabIndex = computed(() =>
    this.itemDisabled() ? -1 : this.toolbar.activeTabIndex(this.id),
  );

  ngOnInit(): void {
    this.toolbar.register(this);
    const view = this.elementRef.nativeElement.ownerDocument.defaultView;
    if (!view?.MutationObserver) return;
    const observer = new view.MutationObserver(() => {
      this.nativeDisabled.set(this.elementRef.nativeElement.hasAttribute('disabled'));
    });
    this.observer = observer;
    observer.observe(this.elementRef.nativeElement, {
      attributes: true,
      attributeFilter: ['disabled'],
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.toolbar.unregister(this);
  }

  onFocus(): void {
    this.hasFocus = true;
    this.toolbar.setActive(this);
  }

  onBlur(): void {
    this.hasFocus = false;
  }

  onKeydown(event: KeyboardEvent): void {
    this.toolbar.handleItemKeydown(this, event);
  }

  onClick(event: MouseEvent): void {
    if (!this.itemDisabled()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}
