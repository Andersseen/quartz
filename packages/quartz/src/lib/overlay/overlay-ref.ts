import { TemplateRef, ViewContainerRef, EmbeddedViewRef } from '@angular/core';
import { Subject } from 'rxjs';
import { OverlayConfig, OverlayPosition } from './overlay.types';
import { calculatePosition } from './overlay-position';

export class OverlayRef {
  private viewRef: EmbeddedViewRef<unknown> | null = null;
  private wrapperEl: HTMLElement | null = null;
  private scrollParents: (Element | Document)[] = [];

  private _closed$ = new Subject<void>();
  readonly closed$ = this._closed$.asObservable();

  private _position$ = new Subject<OverlayPosition>();
  readonly position$ = this._position$.asObservable();

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainerRef: ViewContainerRef,
    private hostEl: HTMLElement,
    private containerEl: HTMLElement,
    private config: OverlayConfig,
  ) {}

  get isOpen(): boolean {
    return this.wrapperEl !== null;
  }

  open(): void {
    if (this.isOpen) return;

    // Create wrapper and append to container (body portal)
    this.wrapperEl = document.createElement('div');
    this.wrapperEl.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      z-index: 9999;
      pointer-events: none;
    `;
    this.containerEl.appendChild(this.wrapperEl);

    // Render template into the wrapper
    this.viewRef = this.viewContainerRef.createEmbeddedView(this.templateRef);
    this.viewRef.detectChanges();

    for (const node of this.viewRef.rootNodes) {
      if (node instanceof HTMLElement) {
        node.style.pointerEvents = 'auto';
        this.wrapperEl.appendChild(node);
      }
    }

    // Position after render so we have real dimensions
    requestAnimationFrame(() => {
      this.updatePosition();
      this.attachListeners();
    });
  }

  close(): void {
    if (!this.isOpen) return;
    this.detachListeners();

    if (this.viewRef) {
      this.viewRef.destroy();
      this.viewRef = null;
    }

    if (this.wrapperEl) {
      this.wrapperEl.remove();
      this.wrapperEl = null;
    }

    this._closed$.next();
  }

  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  updatePosition(): void {
    if (!this.wrapperEl) return;

    const firstChild = this.wrapperEl.firstElementChild as HTMLElement | null;
    if (!firstChild) return;

    const anchorRect = this.hostEl.getBoundingClientRect();

    if (this.config.matchAnchorWidth) {
      firstChild.style.width = `${anchorRect.width}px`;
    }

    const pos = calculatePosition(
      anchorRect,
      firstChild,
      this.config.placement,
      this.config.offset,
      this.config.flip,
    );

    this.wrapperEl.style.transform = `translate(${pos.left}px, ${pos.top}px)`;
    this._position$.next(pos);
  }

  // ── Listeners ──────────────────────────────────────────────────────────────

  private onClickOutside = (event: MouseEvent): void => {
    if (!this.config.closeOnClickOutside) return;
    const target = event.target as Node;
    const overlayEl = this.wrapperEl;
    if (overlayEl && !overlayEl.contains(target) && !this.hostEl.contains(target)) {
      this.close();
    }
  };

  private onEscape = (event: KeyboardEvent): void => {
    if (!this.config.closeOnEscape) return;
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.close();
    }
  };

  private onScroll = (): void => {
    if (!this.config.closeOnScroll) return;
    this.close();
  };

  private attachListeners(): void {
    if (this.config.closeOnClickOutside) {
      // Use setTimeout to avoid catching the same click that opened the overlay
      setTimeout(() => {
        document.addEventListener('mousedown', this.onClickOutside, true);
      });
    }

    if (this.config.closeOnEscape) {
      document.addEventListener('keydown', this.onEscape, true);
    }

    if (this.config.closeOnScroll) {
      this.scrollParents = getScrollParents(this.hostEl);
      for (const parent of this.scrollParents) {
        parent.addEventListener('scroll', this.onScroll, { passive: true });
      }
    }
  }

  private detachListeners(): void {
    document.removeEventListener('mousedown', this.onClickOutside, true);
    document.removeEventListener('keydown', this.onEscape, true);
    for (const parent of this.scrollParents) {
      parent.removeEventListener('scroll', this.onScroll);
    }
    this.scrollParents = [];
  }

  destroy(): void {
    this.close();
    this._closed$.complete();
    this._position$.complete();
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getScrollParents(el: HTMLElement): (Element | Document)[] {
  const parents: (Element | Document)[] = [];
  let current: Element | null = el.parentElement;

  while (current && current !== document.body) {
    const { overflow, overflowX, overflowY } = getComputedStyle(current);
    if (/auto|scroll|overlay/.test(overflow + overflowX + overflowY)) {
      parents.push(current);
    }
    current = current.parentElement;
  }

  parents.push(globalThis.document);
  return parents;
}
