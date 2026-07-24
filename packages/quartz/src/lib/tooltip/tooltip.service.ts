import { Injectable, TemplateRef, ViewContainerRef, inject, DOCUMENT } from '@angular/core';
import { OverlayService, OverlayRef } from '../overlay';
import { TooltipConfig, DEFAULT_TOOLTIP_CONFIG } from './tooltip.types';

@Injectable({ providedIn: 'root' })
export class TooltipService {
  private readonly document = inject(DOCUMENT);
  private readonly overlayService = inject(OverlayService);

  /**
   * Creates a tooltip using OverlayService. Useful for programmatic control.
   */
  create(
    templateRef: TemplateRef<unknown>,
    viewContainerRef: ViewContainerRef,
    anchorEl: HTMLElement,
    config: Partial<TooltipConfig> = {},
  ): OverlayRef {
    const resolved: TooltipConfig = { ...DEFAULT_TOOLTIP_CONFIG, ...config };
    return this.overlayService.create(templateRef, viewContainerRef, anchorEl, {
      placement: resolved.placement,
      offset: resolved.offset,
      closeOnClickOutside: false,
      closeOnEscape: false,
      closeOnScroll: true,
      flip: true,
      flipAxis: 'main',
      matchAnchorWidth: false,
    });
  }

  /**
   * Creates a simple text tooltip element for string-based tooltips.
   * Returns the HTMLElement that was created and appended to body.
   *
   * Safe to call during SSR: returns a detached element so the tooltip can be
   * positioned later in the browser without throwing on the server.
   */
  createTextElement(text: string): HTMLElement {
    const el = this.document.createElement('div');
    el.textContent = text;
    el.className = 'qz-tooltip';
    el.setAttribute('role', 'tooltip');
    el.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      z-index: 9999;
      pointer-events: none;
    `;

    if (this.document.defaultView && this.document.body) {
      this.document.body.appendChild(el);
    }

    return el;
  }
}
