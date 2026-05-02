import { TemplateRef, ViewContainerRef, EmbeddedViewRef } from '@angular/core';
import { Subject } from 'rxjs';
import {
  OverlayAnchor,
  OverlayConfig,
  OverlayPosition,
  OverlayVirtualAnchor,
} from './overlay.types';
import { calculatePosition } from './overlay-position';

export class OverlayRef {
  private viewRef: EmbeddedViewRef<unknown> | null = null;
  private wrapperEl: HTMLElement | null = null;
  private scrollParents: (Element | Document)[] = [];
  private anchor: OverlayAnchor;

  #closed$ = new Subject<void>();
  readonly closed$ = this.#closed$.asObservable();

  #mounted$ = new Subject<HTMLElement>();
  readonly mounted$ = this.#mounted$.asObservable();

  #position$ = new Subject<OverlayPosition>();
  readonly position$ = this.#position$.asObservable();

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainerRef: ViewContainerRef,
    anchor: OverlayAnchor,
    private containerEl: HTMLElement,
    private config: OverlayConfig,
    private document: Document,
  ) {
    this.anchor = anchor;
  }

  get isOpen(): boolean {
    return this.wrapperEl !== null;
  }

  open(): void {
    if (this.isOpen) return;

    // Create wrapper and append to container (body portal)
    this.wrapperEl = this.document.createElement('div');
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
      if (isElementNode(node)) {
        const element = node as HTMLElement;
        element.style.pointerEvents = 'auto';
        this.wrapperEl.appendChild(element);
      }
    }

    const firstChild = this.wrapperEl.firstElementChild as HTMLElement | null;
    if (firstChild) {
      this.#mounted$.next(firstChild);
    }

    // Position after render so we have real dimensions
    this.queueFrame(() => {
      if (!this.isOpen) return;
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

    this.#closed$.next();
  }

  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  setVirtualAnchor(anchor: OverlayVirtualAnchor): void {
    this.anchor = anchor;
    this.updatePosition();
  }

  setAnchor(anchor: OverlayAnchor): void {
    this.anchor = anchor;
    this.updatePosition();
  }

  updatePosition(): void {
    if (!this.wrapperEl) return;

    const firstChild = this.wrapperEl.firstElementChild as HTMLElement | null;
    if (!firstChild) return;

    const anchorRect = this.getAnchorRect();

    if (this.config.matchAnchorWidth) {
      firstChild.style.width = `${anchorRect.width}px`;
    }

    const pos = calculatePosition(
      anchorRect,
      firstChild,
      this.config.placement,
      this.config.offset,
      this.config.flip,
      this.getViewport(),
    );

    this.wrapperEl.style.transform = `translate(${pos.left}px, ${pos.top}px)`;
    this.#position$.next(pos);
  }

  // ── Listeners ──────────────────────────────────────────────────────────────

  private onClickOutside = (event: MouseEvent): void => {
    if (!this.config.closeOnClickOutside) return;
    const target = event.target as Node;
    const overlayEl = this.wrapperEl;
    const anchorEl = this.getAnchorElement();
    const isInsideAnchor = anchorEl?.contains(target) ?? false;
    if (overlayEl && !overlayEl.contains(target) && !isInsideAnchor) {
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
        this.document.addEventListener('mousedown', this.onClickOutside, true);
      });
    }

    if (this.config.closeOnEscape) {
      this.document.addEventListener('keydown', this.onEscape, true);
    }

    if (this.config.closeOnScroll) {
      this.scrollParents = getScrollParents(this.anchor, this.document);
      for (const parent of this.scrollParents) {
        parent.addEventListener('scroll', this.onScroll, { passive: true });
      }
    }
  }

  private detachListeners(): void {
    this.document.removeEventListener('mousedown', this.onClickOutside, true);
    this.document.removeEventListener('keydown', this.onEscape, true);
    for (const parent of this.scrollParents) {
      parent.removeEventListener('scroll', this.onScroll);
    }
    this.scrollParents = [];
  }

  private getAnchorElement(): HTMLElement | null {
    return isVirtualAnchor(this.anchor) ? null : this.anchor;
  }

  private getAnchorRect(): DOMRect {
    if (!isVirtualAnchor(this.anchor)) {
      return this.anchor.getBoundingClientRect();
    }

    const width = this.anchor.width ?? 0;
    const height = this.anchor.height ?? 0;
    const ViewDOMRect = this.document.defaultView?.DOMRect;

    if (ViewDOMRect) {
      return new ViewDOMRect(this.anchor.x, this.anchor.y, width, height);
    }

    return {
      x: this.anchor.x,
      y: this.anchor.y,
      top: this.anchor.y,
      left: this.anchor.x,
      right: this.anchor.x + width,
      bottom: this.anchor.y + height,
      width,
      height,
      toJSON: () => ({}),
    } as DOMRect;
  }

  private getViewport(): { width: number; height: number } {
    const view = this.document.defaultView;
    return {
      width: view?.innerWidth ?? this.document.documentElement.clientWidth,
      height: view?.innerHeight ?? this.document.documentElement.clientHeight,
    };
  }

  private queueFrame(callback: () => void): void {
    const view = this.document.defaultView;
    if (view?.requestAnimationFrame) {
      view.requestAnimationFrame(callback);
      return;
    }
    setTimeout(callback);
  }

  destroy(): void {
    this.close();
    this.#closed$.complete();
    this.#mounted$.complete();
    this.#position$.complete();
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isVirtualAnchor(anchor: OverlayAnchor): anchor is OverlayVirtualAnchor {
  return 'x' in anchor && 'y' in anchor;
}

function isElementNode(node: unknown): node is Element {
  return !!node && typeof node === 'object' && 'nodeType' in node && node.nodeType === 1;
}

function getScrollParents(anchor: OverlayAnchor, document: Document): (Element | Document)[] {
  const parents: (Element | Document)[] = [];
  let current: Element | null = isVirtualAnchor(anchor) ? null : anchor.parentElement;

  while (current && current !== document.body) {
    const { overflow, overflowX, overflowY } = getComputedStyle(current);
    if (/auto|scroll|overlay/.test(overflow + overflowX + overflowY)) {
      parents.push(current);
    }
    current = current.parentElement;
  }

  parents.push(document);
  return parents;
}
