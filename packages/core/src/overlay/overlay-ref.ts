import { TemplateRef, ViewContainerRef, EmbeddedViewRef } from '@angular/core';
import { Subject } from 'rxjs';
import {
  OverlayAnchor,
  OverlayConfig,
  OverlayPosition,
  OverlayVirtualAnchor,
} from './overlay.types';
import { calculatePosition } from './overlay-position';
import { calculateArrowGeometry } from './overlay-arrow';
import { createDismissController, type DismissController } from '../dismiss';
import { resolveDirection } from '../directionality';
import type { OverlayArrowGeometry } from './overlay-arrow';

export class OverlayRef {
  private viewRef: EmbeddedViewRef<unknown> | null = null;
  private wrapperEl: HTMLElement | null = null;
  private anchor: OverlayAnchor;
  private clickOutsideTimer: ReturnType<typeof setTimeout> | null = null;
  private dismissController: DismissController | null = null;
  // Bumped on every open/close/destroy. Deferred work captures the value it was scheduled
  // under and bails out when it no longer matches, so a callback from an earlier opening
  // session can never touch a later one.
  #session = 0;
  #cancelFrame: (() => void) | null = null;
  #outsideArmed = false;
  #scrollArmed = false;
  #destroyed = false;
  #untrack: (() => void) | null = null;

  /**
   * Plain `Subject` on purpose: an overlay is reusable (open/close/open), so replaying
   * the last close would fire immediately on every new subscription and read as a close
   * that never happened. `DialogRef` is one-shot and uses `ReplaySubject(1)` instead.
   */
  #closed$ = new Subject<void>();
  readonly closed$ = this.#closed$.asObservable();

  #mounted$ = new Subject<HTMLElement>();
  readonly mounted$ = this.#mounted$.asObservable();

  #position$ = new Subject<OverlayPosition>();
  readonly position$ = this.#position$.asObservable();

  #lastPosition: OverlayPosition | null = null;
  /** The most recent position while open (`null` before the first measurement and after close). */
  get position(): OverlayPosition | null {
    return this.#lastPosition;
  }

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainerRef: ViewContainerRef,
    anchor: OverlayAnchor,
    private containerEl: HTMLElement | null,
    private config: OverlayConfig,
    private document: Document,
  ) {
    this.anchor = anchor;
  }

  get isOpen(): boolean {
    return this.wrapperEl !== null;
  }

  open(): void {
    if (this.#destroyed || this.isOpen) return;

    // SSR guard: do not attach to the DOM when there is no browser window.
    if (!this.document.defaultView || !this.containerEl) {
      return;
    }

    // Re-append the shared container to move it to the end of <body>'s children. Every
    // overlay-based primitive (Menu/Select/Popover/Tooltip) shares one persistent container;
    // without this, a container created before a given Dialog opens would stay earlier in
    // DOM order than the Dialog's own backdrop/wrapper (same z-index), so an overlay nested
    // inside that Dialog would render behind it. appendChild on an attached node moves it.
    this.document.body.appendChild(this.containerEl);

    // Create wrapper and append to container (body portal)
    this.wrapperEl = this.document.createElement('div');
    this.wrapperEl.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      z-index: var(--qz-overlay-z-index, 9999);
      pointer-events: none;
    `;
    this.containerEl.appendChild(this.wrapperEl);

    // Render template into the wrapper
    const session = ++this.#session;
    this.viewRef = this.viewContainerRef.createEmbeddedView(this.templateRef, this.config.context);
    this.viewRef.detectChanges();
    // If the host view container is destroyed while open (e.g. route change), Angular tears
    // down our view without calling close(); release the wrapper and listeners here.
    this.viewRef.onDestroy(() => {
      if (this.#session === session) this.#close(true);
    });

    for (const node of this.viewRef.rootNodes) {
      if (isElementNode(node)) {
        const element = node as HTMLElement;
        element.style.pointerEvents = 'auto';
        this.wrapperEl.appendChild(element);
      }
    }

    // Register the dismiss layer synchronously so layer order matches open order even when
    // another layer opens before the next animation frame.
    this.attachListeners();

    const firstChild = this.wrapperEl.firstElementChild as HTMLElement | null;
    if (firstChild) {
      this.#mounted$.next(firstChild);
    }

    // Position after render so we have real dimensions
    this.#cancelFrame = this.queueFrame(() => {
      this.#cancelFrame = null;
      if (!this.isOpen || this.#session !== session) return;
      this.#scrollArmed = true;
      this.updatePosition();
      this.#startTracking(session);
    });
  }

  close(): void {
    this.#close(false);
  }

  /**
   * `viewDestroying`: Angular is already tearing the embedded view down (host destroyed). The
   * view must NOT be destroyed again from here — doing so re-entrantly detaches it from its
   * container while Angular is walking the view tree, which makes Angular skip the cleanup of
   * every ancestor view (a Dialog hosting this overlay would never close).
   */
  #close(viewDestroying: boolean): void {
    if (!this.isOpen) return;
    this.#session++;
    this.#cancelFrame?.();
    this.#cancelFrame = null;
    this.#untrack?.();
    this.#untrack = null;
    this.detachListeners();

    // Clear state before destroying the view: viewRef.destroy() re-enters close() through
    // the onDestroy hook above, which must see an already-closed overlay.
    const viewRef = this.viewRef;
    const wrapperEl = this.wrapperEl;
    this.viewRef = null;
    this.wrapperEl = null;
    this.#lastPosition = null;
    if (!viewDestroying) viewRef?.destroy();
    wrapperEl?.remove();

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

    // An element anchor that left the document has no geometry to follow: close.
    if (!isVirtualAnchor(this.anchor) && !this.anchor.isConnected) {
      this.close();
      return;
    }

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
      this.config.flipAxis,
      this.getViewport(),
      resolveDirection(this.getAnchorElement() ?? this.document.documentElement),
    );

    this.wrapperEl.style.transform = `translate(${pos.left}px, ${pos.top}px)`;

    if (this.config.arrowSize !== undefined) {
      const arrow = calculateArrowGeometry(
        anchorRect,
        {
          left: pos.left,
          top: pos.top,
          width: firstChild.offsetWidth,
          height: firstChild.offsetHeight,
        },
        pos.placement,
        { size: this.config.arrowSize, padding: this.config.arrowPadding },
      );
      pos.arrow = arrow;
      applyArrowAttributes(firstChild, arrow);
    }
    this.#lastPosition = pos;
    this.#position$.next(pos);
  }

  // ── Listeners ──────────────────────────────────────────────────────────────

  private attachListeners(): void {
    const { closeOnEscape, closeOnClickOutside, closeOnScroll } = this.config;
    if (!closeOnEscape && !closeOnClickOutside && !closeOnScroll) return;

    // One controller for the whole open session, so the overlay keeps a single stable slot
    // in the layer stack. Outside-pointer is armed one tick later to avoid catching the very
    // gesture that opened the overlay.
    this.#outsideArmed = false;
    this.dismissController = createDismissController({
      document: this.document,
      escape: closeOnEscape,
      outsidePointer: closeOnClickOutside,
      scroll: closeOnScroll,
      rootElements: () => [this.wrapperEl],
      excludeElements: () => [this.getAnchorElement()],
      scrollTargets: () => getScrollParents(this.anchor, this.document),
      onDismiss: (reason, event) => {
        if (reason === 'outside-pointer' && !this.#outsideArmed) return;
        // Scrolls caused by opening itself (autofocus scrolling the panel into view) happen
        // before the first frame and must not dismiss it.
        if (reason === 'scroll' && !this.#scrollArmed) return;
        if (reason === 'escape') event.stopPropagation();
        this.close();
      },
    });

    if (closeOnClickOutside) {
      const session = this.#session;
      this.clickOutsideTimer = setTimeout(() => {
        this.clickOutsideTimer = null;
        if (this.#session === session) this.#outsideArmed = true;
      });
    }
  }

  private detachListeners(): void {
    if (this.clickOutsideTimer !== null) {
      clearTimeout(this.clickOutsideTimer);
      this.clickOutsideTimer = null;
    }
    this.#outsideArmed = false;
    this.#scrollArmed = false;

    this.dismissController?.destroy();
    this.dismissController = null;
  }

  /**
   * Geometry contract while open: the overlay re-positions on window resize, on size changes
   * of the overlay content or the anchor element (ResizeObserver) and — when `closeOnScroll`
   * is off — on scroll of any ancestor. Updates are coalesced to one per animation frame.
   * A removed anchor closes the overlay.
   */
  #startTracking(session: number): void {
    const view = this.document.defaultView;
    if (!view || this.#session !== session) return;

    let pending: (() => void) | null = null;
    const schedule = () => {
      if (pending) return;
      pending = this.queueFrame(() => {
        pending = null;
        if (this.#session === session) this.updatePosition();
      });
    };

    const cleanups: Array<() => void> = [() => pending?.()];

    view.addEventListener('resize', schedule);
    cleanups.push(() => view.removeEventListener('resize', schedule));

    if (!this.config.closeOnScroll) {
      this.document.addEventListener('scroll', schedule, { capture: true, passive: true });
      cleanups.push(() =>
        this.document.removeEventListener('scroll', schedule, {
          capture: true,
        } as EventListenerOptions),
      );
    }

    const ViewResizeObserver = view.ResizeObserver;
    if (ViewResizeObserver) {
      const observer = new ViewResizeObserver(schedule);
      const content = this.wrapperEl?.firstElementChild;
      if (content) observer.observe(content);
      const anchorEl = this.getAnchorElement();
      if (anchorEl) observer.observe(anchorEl);
      cleanups.push(() => observer.disconnect());
    }

    this.#untrack = () => cleanups.forEach((cleanup) => cleanup());
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

  /** Schedules `callback` for the next frame and returns a function that cancels it. */
  private queueFrame(callback: () => void): () => void {
    const view = this.document.defaultView;
    if (view?.requestAnimationFrame) {
      const id = view.requestAnimationFrame(callback);
      return () => view.cancelAnimationFrame(id);
    }
    const id = setTimeout(callback);
    return () => clearTimeout(id);
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.close();
    this.#destroyed = true;
    this.#closed$.complete();
    this.#mounted$.complete();
    this.#position$.complete();
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Mirrors arrow geometry onto a surface element so consumers can style an arrow in plain CSS:
 * `data-side`, `data-placement` and `--qz-arrow-x`/`--qz-arrow-y` (px; removed while the arrow is
 * unavailable, with `data-qz-arrow="hidden"`).
 */
export function applyArrowAttributes(el: HTMLElement, arrow: OverlayArrowGeometry): void {
  el.setAttribute('data-side', arrow.side);
  el.setAttribute('data-placement', arrow.placement);
  if (arrow.available && arrow.offset !== null) {
    el.removeAttribute('data-qz-arrow');
    const axisProp = arrow.axis === 'x' ? '--qz-arrow-x' : '--qz-arrow-y';
    const otherProp = arrow.axis === 'x' ? '--qz-arrow-y' : '--qz-arrow-x';
    el.style.setProperty(axisProp, `${arrow.offset}px`);
    el.style.removeProperty(otherProp);
  } else {
    el.setAttribute('data-qz-arrow', 'hidden');
    el.style.removeProperty('--qz-arrow-x');
    el.style.removeProperty('--qz-arrow-y');
  }
}

function isVirtualAnchor(anchor: OverlayAnchor): anchor is OverlayVirtualAnchor {
  return 'x' in anchor && 'y' in anchor;
}

function isElementNode(node: unknown): node is Element {
  return !!node && typeof node === 'object' && 'nodeType' in node && node.nodeType === 1;
}

export function getScrollParents(
  anchor: OverlayAnchor,
  document: Document,
): (Element | Document)[] {
  const parents: (Element | Document)[] = [];
  let current: Element | null = isVirtualAnchor(anchor) ? null : anchor.parentElement;

  while (current && current !== document.body) {
    const style = document.defaultView?.getComputedStyle(current);
    if (!style) break;

    const { overflow, overflowX, overflowY } = style;
    if (/auto|scroll|overlay/.test(overflow + overflowX + overflowY)) {
      parents.push(current);
    }
    current = current.parentElement;
  }

  parents.push(document);
  return parents;
}
