import { Injectable, TemplateRef, ViewContainerRef, inject, DOCUMENT } from '@angular/core';
import { OverlayRef } from './overlay-ref';
import {
  OverlayAnchor,
  OverlayConfig,
  OverlayVirtualAnchor,
  DEFAULT_OVERLAY_CONFIG,
} from './overlay.types';

@Injectable({ providedIn: 'root' })
export class OverlayService {
  private document = inject(DOCUMENT);
  #containerEl: HTMLElement | null = null;

  private get containerEl(): HTMLElement {
    if (!this.#containerEl) {
      this.#containerEl = this.document.createElement('div');
      this.#containerEl.setAttribute('data-qz-overlay-container', '');

      const style = this.#containerEl.style;
      style.setProperty('position', 'fixed');
      style.setProperty('top', '0');
      style.setProperty('left', '0');
      style.setProperty('width', '0');
      style.setProperty('height', '0');
      style.setProperty('z-index', '9999');
      style.setProperty('pointer-events', 'none');

      this.document.body.appendChild(this.#containerEl);
    }
    return this.#containerEl;
  }

  /**
   * Creates an OverlayRef for a given anchor element or virtual coordinate anchor and template.
   * Call .open() / .close() / .toggle() on the returned ref.
   */
  create(
    templateRef: TemplateRef<unknown>,
    viewContainerRef: ViewContainerRef,
    anchor: OverlayAnchor,
    config: Partial<OverlayConfig> = {},
  ): OverlayRef {
    const resolvedConfig: OverlayConfig = { ...DEFAULT_OVERLAY_CONFIG, ...config };
    return new OverlayRef(
      templateRef,
      viewContainerRef,
      anchor,
      this.containerEl,
      resolvedConfig,
      this.document,
    );
  }

  /**
   * Convenience helper for context menus and pointer-driven popovers.
   * Coordinates are viewport-relative, matching MouseEvent.clientX/clientY.
   */
  createAt(
    templateRef: TemplateRef<unknown>,
    viewContainerRef: ViewContainerRef,
    anchor: OverlayVirtualAnchor,
    config: Partial<OverlayConfig> = {},
  ): OverlayRef {
    return this.create(templateRef, viewContainerRef, anchor, config);
  }
}
