import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, OnDestroy, booleanAttribute, inject, input } from '@angular/core';
import {
  CollectionStore,
  focusSafely,
  resolveDirection,
  type CollectionItem,
} from '@quartz-headless/core';
import type { ToolbarItemDirective } from './toolbar-item.directive';
import { DEFAULT_TOOLBAR_CONFIG, type ToolbarOrientation } from './toolbar.types';

@Directive({
  selector: '[qzToolbar]',
  exportAs: 'qzToolbar',
  standalone: true,
  host: {
    '[attr.role]': '"toolbar"',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.data-qz-orientation]': 'orientation()',
  },
})
export class ToolbarDirective implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly collection = new CollectionStore<ToolbarItemDirective & CollectionItem>(
    { focusStrategy: 'roving-tabindex', orientation: DEFAULT_TOOLBAR_CONFIG.orientation },
    this.document,
  );
  private destroyed = false;

  readonly orientation = input<ToolbarOrientation>(DEFAULT_TOOLBAR_CONFIG.orientation);
  readonly disabled = input(false, { transform: booleanAttribute });

  register(item: ToolbarItemDirective): void {
    this.configureCollection();
    this.collection.register(item as ToolbarItemDirective & CollectionItem);
  }

  unregister(item: ToolbarItemDirective): void {
    const wasFocused = this.document.activeElement === item.element() || item.hasFocus;
    this.collection.unregister(item as ToolbarItemDirective & CollectionItem);
    if (wasFocused) {
      queueMicrotask(() => {
        if (this.destroyed || item.element().isConnected) return;
        focusSafely(this.collection.activeItem()?.element() ?? null);
      });
    }
  }

  refreshOrder(): void {
    this.collection.refreshOrder();
  }

  setActive(item: ToolbarItemDirective): void {
    if (!item.itemDisabled()) this.collection.setActive(item.id);
  }

  activeTabIndex(id: string): 0 | -1 {
    return this.collection.activeTabIndex(id);
  }

  handleItemKeydown(item: ToolbarItemDirective, event: KeyboardEvent): void {
    // A toolbar item may wrap a custom control. Let the focused descendant own its keys.
    const element = item.element();
    const tagName = element.tagName.toLowerCase();
    const inputType = tagName === 'input' ? element.getAttribute('type')?.toLowerCase() : null;
    const controlOwnsArrows =
      (tagName === 'input' && !['button', 'submit', 'reset'].includes(inputType ?? 'text')) ||
      ['textarea', 'select'].includes(tagName) ||
      element.isContentEditable ||
      element.matches('[role="slider"], [role="spinbutton"]');
    if (event.target !== element || controlOwnsArrows || this.disabled() || item.itemDisabled()) {
      return;
    }
    this.configureCollection();
    this.collection.refreshOrder();
    this.collection.setActive(item.id);
    this.collection.handleKeydown(event, { focus: true });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.collection.destroy();
  }

  private configureCollection(): void {
    this.collection.configure({
      focusStrategy: 'roving-tabindex',
      orientation: this.orientation(),
      direction: resolveDirection(this.elementRef.nativeElement),
      wrap: true,
    });
  }
}
