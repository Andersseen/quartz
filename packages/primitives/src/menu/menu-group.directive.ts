import { DestroyRef, Directive, InjectionToken, computed, inject, signal } from '@angular/core';

/**
 * Anything that can be named by a {@link MenuLabelDirective} (menu groups and radio groups).
 * @internal
 */
export interface MenuLabelHost {
  registerLabel(id: string): void;
  unregisterLabel(id: string): void;
}

export const QZ_MENU_LABEL_HOST = new InjectionToken<MenuLabelHost>('QZ_MENU_LABEL_HOST');

/** Tracks label ids; the first mounted label names the group. */
export class MenuLabelRegistry implements MenuLabelHost {
  readonly #ids = signal<string[]>([]);
  /** `aria-labelledby` value, or `null` while no label is mounted. */
  readonly labelledBy = computed(() => this.#ids()[0] ?? null);

  registerLabel(id: string): void {
    this.#ids.update((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }

  unregisterLabel(id: string): void {
    this.#ids.update((ids) => ids.filter((current) => current !== id));
  }
}

/**
 * A named group of menu items: `role="group"` labelled by its {@link MenuLabelDirective}.
 * Groups are structural only — they are never menu items and never take focus.
 *
 * ```html
 * <div qzMenuGroup>
 *   <div qzMenuLabel>Account</div>
 *   <button qzMenuItem>Profile</button>
 * </div>
 * ```
 */
@Directive({
  selector: '[qzMenuGroup]',
  exportAs: 'qzMenuGroup',
  standalone: true,
  providers: [{ provide: QZ_MENU_LABEL_HOST, useExisting: MenuGroupDirective }],
  host: {
    '[attr.role]': '"group"',
    '[attr.aria-labelledby]': 'labels.labelledBy()',
  },
})
export class MenuGroupDirective implements MenuLabelHost {
  protected readonly labels = new MenuLabelRegistry();

  registerLabel(id: string): void {
    this.labels.registerLabel(id);
  }

  unregisterLabel(id: string): void {
    this.labels.unregisterLabel(id);
  }
}

let menuLabelId = 0;

/**
 * Visible heading of a {@link MenuGroupDirective} or `qzMenuRadioGroup`. It names the group via
 * `aria-labelledby` and is not interactive: it is never registered as a menu item, never the
 * roving-focus destination, and is skipped by arrow keys, Home/End and typeahead.
 */
@Directive({
  selector: '[qzMenuLabel]',
  exportAs: 'qzMenuLabel',
  standalone: true,
  host: {
    '[attr.id]': 'id',
    '[attr.data-qz-menu-label]': '""',
  },
})
export class MenuLabelDirective {
  private readonly group = inject(QZ_MENU_LABEL_HOST, { optional: true });
  readonly id = `qz-menu-label-${++menuLabelId}`;

  constructor() {
    this.group?.registerLabel(this.id);
    inject(DestroyRef).onDestroy(() => this.group?.unregisterLabel(this.id));
  }
}
