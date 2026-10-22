import { DOCUMENT } from '@angular/common';
import {
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ViewportService } from './viewport.service';

function fakeWindow() {
  const resizeListeners = new Set<() => void>();
  const queries = new Map<string, { matches: boolean; listeners: Set<(e: unknown) => void> }>();
  const win = {
    innerWidth: 1000,
    innerHeight: 700,
    addEventListener: vi.fn((type: string, fn: () => void) => {
      if (type === 'resize') resizeListeners.add(fn);
    }),
    removeEventListener: vi.fn((type: string, fn: () => void) => {
      if (type === 'resize') resizeListeners.delete(fn);
    }),
    matchMedia: vi.fn((query: string) => {
      const entry = queries.get(query) ?? { matches: false, listeners: new Set() };
      queries.set(query, entry);
      return {
        get matches() {
          return entry.matches;
        },
        addEventListener: (_: string, fn: (e: unknown) => void) => entry.listeners.add(fn),
        removeEventListener: (_: string, fn: (e: unknown) => void) => entry.listeners.delete(fn),
      };
    }),
  };
  return {
    win,
    resizeListeners,
    queries,
    resize(width: number, height: number) {
      win.innerWidth = width;
      win.innerHeight = height;
      resizeListeners.forEach((fn) => fn());
    },
  };
}

function createService(doc: unknown): ViewportService {
  const parent = TestBed.inject(EnvironmentInjector);
  const injector = createEnvironmentInjector([{ provide: DOCUMENT, useValue: doc }], parent);
  return runInInjectionContext(injector, () => new ViewportService());
}

describe('ViewportService lifecycle', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reads the initial size and tracks width and height changes through resize', () => {
    const w = fakeWindow();
    const service = createService({ defaultView: w.win, documentElement: {} });
    expect([service.width(), service.height()]).toEqual([1000, 700]);
    expect(service.isDesktop()).toBe(manual(1000));

    // Height-only change (e.g. mobile browser chrome): must not be missed.
    w.resize(1000, 500);
    expect(service.height()).toBe(500);

    w.resize(600, 500);
    expect(service.isMobile()).toBe(true);
    w.resize(800, 500);
    expect(service.isTablet()).toBe(true);
    service.destroy();
  });

  it('removes its resize listener exactly once; destroy is idempotent', () => {
    const w = fakeWindow();
    const service = createService({ defaultView: w.win, documentElement: {} });
    expect(w.resizeListeners.size).toBe(1);
    service.destroy();
    service.destroy();
    service.ngOnDestroy();
    expect(w.resizeListeners.size).toBe(0);
    expect(w.win.removeEventListener).toHaveBeenCalledTimes(1);

    w.resize(300, 300);
    expect(service.width()).toBe(1000);
  });

  it('observes one query once (shared signal, one listener) and tracks changes', () => {
    const w = fakeWindow();
    const service = createService({ defaultView: w.win, documentElement: {} });
    const a = service.observe('(min-width: 900px)');
    const b = service.observe('(min-width: 900px)');
    expect(a).toBe(b);
    expect(w.win.matchMedia).toHaveBeenCalledTimes(1);
    const entry = w.queries.get('(min-width: 900px)')!;
    expect(entry.listeners.size).toBe(1);

    entry.listeners.forEach((fn) => fn({ matches: true }));
    expect(a()).toBe(true);

    service.destroy();
    expect(entry.listeners.size).toBe(0);
  });

  it('after destroy, observe() returns an inert false signal and registers nothing', () => {
    const w = fakeWindow();
    const service = createService({ defaultView: w.win, documentElement: {} });
    service.destroy();
    const sig = service.observe('(min-width: 1px)');
    expect(sig()).toBe(false);
    expect(w.win.matchMedia).not.toHaveBeenCalled();
  });

  it('instances on separate documents do not share state or listeners', () => {
    const w1 = fakeWindow();
    const w2 = fakeWindow();
    w2.win.innerWidth = 400;
    const s1 = createService({ defaultView: w1.win, documentElement: {} });
    const s2 = createService({ defaultView: w2.win, documentElement: {} });
    w1.resize(1200, 800);
    expect(s1.width()).toBe(1200);
    expect(s2.width()).toBe(400);
    s1.destroy();
    expect(w2.resizeListeners.size).toBe(1);
    s2.destroy();
  });

  it('without a window: no listeners, deterministic zeros, inert media queries', () => {
    const service = createService({ defaultView: null, documentElement: {} });
    expect([service.width(), service.height()]).toEqual([0, 0]);
    expect(service.observe('(min-width: 1px)')()).toBe(false);
    expect(() => service.destroy()).not.toThrow();
  });

  it('tolerates a window without matchMedia', () => {
    const w = fakeWindow();
    (w.win as { matchMedia?: unknown }).matchMedia = undefined;
    const service = createService({ defaultView: w.win, documentElement: {} });
    expect(service.minWidth(500)()).toBe(false);
    service.destroy();
  });
});

function manual(width: number): boolean {
  return width >= 1024;
}
