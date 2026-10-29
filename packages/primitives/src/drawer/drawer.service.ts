import { Injectable, TemplateRef, ViewContainerRef, inject, DOCUMENT } from '@angular/core';
import { resolveDirection, type Direction } from '@quartz-headless/core';
import { DialogService } from '../dialog/dialog.service';
import type { DialogRef } from '../dialog/dialog-ref';
import {
  DEFAULT_DRAWER_CONFIG,
  type DrawerConfig,
  type DrawerPhysicalSide,
  type DrawerSide,
} from './drawer.types';

/** Resolves a (possibly logical) side to the physical edge for `direction`. */
export function resolveDrawerSide(side: DrawerSide, direction: Direction): DrawerPhysicalSide {
  if (side === 'inline-start') return direction === 'rtl' ? 'right' : 'left';
  if (side === 'inline-end') return direction === 'rtl' ? 'left' : 'right';
  return side;
}

/**
 * A side-anchored modal. It is a {@link DialogService} dialog — same focus trap, focus
 * restoration, background inertness, scroll lock and Escape/backdrop dismissal — anchored to
 * an edge, with exit presence on by default. Consumers own width, height and appearance.
 *
 * The panel carries `data-qz-drawer`, `data-side` (physical edge) and `data-state`
 * (`opening` | `open` | `closing`). Style `[data-state='closing']` for the exit transition.
 */
@Injectable({ providedIn: 'root' })
export class DrawerService {
  private readonly dialogs = inject(DialogService);
  private readonly document = inject(DOCUMENT);

  open(
    templateRef: TemplateRef<unknown>,
    viewContainerRef: ViewContainerRef,
    config: Partial<DrawerConfig> = {},
  ): DialogRef {
    const { side, ...rest } = { ...DEFAULT_DRAWER_CONFIG, ...config };
    const physical = resolveDrawerSide(side, this.#direction(viewContainerRef));
    return this.dialogs.open(templateRef, viewContainerRef, {
      ...rest,
      position: physical,
      panelAttributes: { ...rest.panelAttributes, 'data-qz-drawer': '', 'data-side': physical },
    });
  }

  #direction(viewContainerRef: ViewContainerRef): Direction {
    const node = viewContainerRef.element.nativeElement as Node | null;
    const element = node?.nodeType === 1 ? (node as Element) : (node?.parentElement ?? null);
    return resolveDirection(element ?? this.document.documentElement);
  }
}
