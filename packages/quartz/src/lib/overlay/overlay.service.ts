import { Injectable, TemplateRef, ViewContainerRef, inject, DOCUMENT } from '@angular/core';
import { OverlayRef } from './overlay-ref';
import { OverlayConfig, DEFAULT_OVERLAY_CONFIG } from './overlay.types';

@Injectable({ providedIn: 'root' })
export class OverlayService {
  private document = inject(DOCUMENT);
  private _containerEl: HTMLElement | null = null;

  private get containerEl(): HTMLElement {
    if (!this._containerEl) {
      this._containerEl = this.document.createElement('div');
      this._containerEl.setAttribute('data-qz-overlay-container', '');
      this._containerEl.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        z-index: 9999;
        pointer-events: none;
      `;
      this.document.body.appendChild(this._containerEl);
    }
    return this._containerEl;
  }

  /**
   * Creates an OverlayRef for a given anchor element and template.
   * Call .open() / .close() / .toggle() on the returned ref.
   */
  create(
    templateRef: TemplateRef<unknown>,
    viewContainerRef: ViewContainerRef,
    anchorEl: HTMLElement,
    config: Partial<OverlayConfig> = {},
  ): OverlayRef {
    const resolvedConfig: OverlayConfig = { ...DEFAULT_OVERLAY_CONFIG, ...config };
    return new OverlayRef(
      templateRef,
      viewContainerRef,
      anchorEl,
      this.containerEl,
      resolvedConfig,
    );
  }
}
