import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { TemplateRef, ViewContainerRef } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OverlayService } from './overlay.service';
import type { OverlayRef } from './overlay-ref';

interface Harness {
  ref: OverlayRef;
  anchor: HTMLElement;
  content: HTMLElement;
  destroyView: () => void;
  viewDestroyCalls: () => number;
}

describe('OverlayRef lifecycle and geometry', () => {
  let service: OverlayService;
  let doc: Document;
  let rafCallbacks: Map<number, FrameRequestCallback>;
  let rafId: number;

  const flushFrames = () => {
    const pending = [...rafCallbacks.values()];
    rafCallbacks.clear();
    pending.forEach((cb) => cb(0));
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [OverlayService] });
    service = TestBed.inject(OverlayService);
    doc = TestBed.inject(DOCUMENT);
    rafCallbacks = new Map();
    rafId = 0;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.set(++rafId, cb);
      return rafId;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      rafCallbacks.delete(id);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    doc.querySelector('[data-qz-overlay-container]')?.remove();
    doc.body.innerHTML = '';
  });

  function setup(config = {}): Harness {
    const anchor = doc.createElement('button');
    doc.body.appendChild(anchor);
    const content = doc.createElement('div');
    let destroyHandler: (() => void) | null = null;
    let destroyCalls = 0;
    const viewContainerRef = {
      createEmbeddedView: () => ({
        rootNodes: [content],
        detectChanges: () => {},
        onDestroy: (fn: () => void) => (destroyHandler = fn),
        destroy: () => {
          destroyCalls++;
          content.remove();
          destroyHandler?.();
        },
      }),
    } as unknown as ViewContainerRef;
    const ref = service.create({} as TemplateRef<unknown>, viewContainerRef, anchor, config);
    return {
      ref,
      anchor,
      content,
      viewDestroyCalls: () => destroyCalls,
      // Simulates Angular tearing the view down because its host container was destroyed.
      destroyView: () => {
        content.remove();
        destroyHandler?.();
      },
    };
  }

  it('does not destroy a view Angular is already destroying (re-entrant destroy corrupts the view tree)', () => {
    const { ref, destroyView, viewDestroyCalls } = setup();
    const closed = vi.fn();
    ref.closed$.subscribe(closed);
    ref.open();

    destroyView();

    expect(viewDestroyCalls()).toBe(0);
    expect(closed).toHaveBeenCalledTimes(1);
    expect(doc.querySelector('[data-qz-overlay-container]')?.children.length).toBe(0);
    ref.destroy();
    expect(viewDestroyCalls()).toBe(0);
  });

  it('still destroys its view on an explicit close', () => {
    const { ref, viewDestroyCalls } = setup();
    ref.open();
    ref.close();
    expect(viewDestroyCalls()).toBe(1);
  });

  it('cancels the pending position frame on close, so it cannot affect a later session', () => {
    const { ref } = setup();
    const position = vi.fn();
    ref.position$.subscribe(position);

    ref.open();
    ref.close();
    ref.open();
    flushFrames();

    // Only the second session's frame survived.
    expect(position).toHaveBeenCalledTimes(1);
    ref.destroy();
  });

  it('does not position or emit after destroy during a pending frame', () => {
    const { ref } = setup();
    const position = vi.fn();
    ref.position$.subscribe(position);
    ref.open();
    ref.destroy();
    flushFrames();
    expect(position).not.toHaveBeenCalled();
    expect(doc.querySelector('[data-qz-overlay-container]')?.children.length).toBe(0);
  });

  it('cannot be reopened after destroy and destroy is idempotent', () => {
    const { ref } = setup();
    ref.open();
    ref.destroy();
    ref.destroy();
    ref.open();
    expect(ref.isOpen).toBe(false);
    expect(doc.querySelector('[data-qz-overlay-container]')?.children.length).toBe(0);
  });

  it('emits closed exactly once per genuine close transition', () => {
    const { ref } = setup();
    const closed = vi.fn();
    ref.closed$.subscribe(closed);
    ref.close();
    expect(closed).not.toHaveBeenCalled();
    ref.open();
    ref.close();
    ref.close();
    expect(closed).toHaveBeenCalledTimes(1);
    ref.destroy();
  });

  it('closes and releases the wrapper when the host view is destroyed while open', () => {
    const { ref, destroyView } = setup();
    const closed = vi.fn();
    ref.closed$.subscribe(closed);
    ref.open();
    destroyView();
    expect(ref.isOpen).toBe(false);
    expect(closed).toHaveBeenCalledTimes(1);
    expect(doc.querySelector('[data-qz-overlay-container]')?.children.length).toBe(0);
  });

  it('releases every document/window listener when closed', () => {
    const { ref } = setup({ closeOnScroll: false });
    const added = vi.spyOn(doc, 'addEventListener');
    const removed = vi.spyOn(doc, 'removeEventListener');
    const winAdded = vi.spyOn(window, 'addEventListener');
    const winRemoved = vi.spyOn(window, 'removeEventListener');
    ref.open();
    flushFrames();
    ref.close();
    const types = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.map((c) => c[0]).sort();
    expect(types(removed)).toEqual(expect.arrayContaining(types(added)));
    expect(types(winRemoved)).toEqual(expect.arrayContaining(types(winAdded)));
  });

  it('repositions on window resize while open, and stops after close', () => {
    const { ref } = setup();
    const position = vi.fn();
    ref.position$.subscribe(position);
    ref.open();
    flushFrames();
    position.mockClear();

    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));
    flushFrames();
    expect(position).toHaveBeenCalledTimes(1); // coalesced to one per frame

    ref.close();
    position.mockClear();
    window.dispatchEvent(new Event('resize'));
    flushFrames();
    expect(position).not.toHaveBeenCalled();
  });

  it('repositions on scroll when closeOnScroll is false, and stays open', () => {
    const { ref } = setup({ closeOnScroll: false });
    const position = vi.fn();
    ref.position$.subscribe(position);
    ref.open();
    flushFrames();
    position.mockClear();
    doc.dispatchEvent(new Event('scroll'));
    flushFrames();
    expect(position).toHaveBeenCalledTimes(1);
    expect(ref.isOpen).toBe(true);
    ref.destroy();
  });

  it('closes on scroll after the first frame when closeOnScroll is true', () => {
    const { ref } = setup({ closeOnScroll: true });
    ref.open();
    flushFrames();
    doc.dispatchEvent(new Event('scroll'));
    expect(ref.isOpen).toBe(false);
  });

  it('ignores scrolls caused by opening itself (before the first frame)', () => {
    const { ref } = setup({ closeOnScroll: true });
    ref.open();
    doc.dispatchEvent(new Event('scroll'));
    expect(ref.isOpen).toBe(true);
    ref.destroy();
  });

  it('closes when the anchor element is removed from the document', () => {
    const { ref, anchor } = setup();
    ref.open();
    flushFrames();
    anchor.remove();
    ref.updatePosition();
    expect(ref.isOpen).toBe(false);
  });

  it('a newly opened later overlay keeps top ownership of Escape even before the first frame', () => {
    const first = setup();
    const second = setup();
    first.ref.open();
    second.ref.open();
    doc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(second.ref.isOpen).toBe(false);
    expect(first.ref.isOpen).toBe(true);
    first.ref.destroy();
  });

  it('does not dismiss on the outside pointer until armed, then does', async () => {
    const { ref } = setup();
    ref.open();
    doc.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(ref.isOpen).toBe(true);
    await new Promise((resolve) => setTimeout(resolve));
    doc.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(ref.isOpen).toBe(false);
  });

  it('a click that outside-dismisses a child popup does not dismiss its parent overlay', async () => {
    const parent = setup();
    const child = setup();
    parent.ref.open();
    child.ref.open();
    await new Promise((resolve) => setTimeout(resolve));
    parent.content.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(child.ref.isOpen).toBe(false);
    expect(parent.ref.isOpen).toBe(true);
    parent.ref.destroy();
  });
});
