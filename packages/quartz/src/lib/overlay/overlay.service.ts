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
      
      const style = this._containerEl.style;
      style.setProperty('position', 'fixed');
      style.setProperty('top', '0');
      style.setProperty('left', '0');
      style.setProperty('width', '0');
      style.setProperty('height', '0');
      style.setProperty('z-index', '9999');
      style.setProperty('pointer-events', 'none');

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
