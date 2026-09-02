import { DOCUMENT } from '@angular/common';
import {
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ViewportService } from './viewport.service';

describe('ViewportService SSR', () => {
  function createServiceWithoutWindow(): ViewportService {
    const fakeDocument = {
      defaultView: null,
      documentElement: { clientWidth: 0, clientHeight: 0 },
    } as unknown as Document;

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const injector = createEnvironmentInjector(
      [{ provide: DOCUMENT, useValue: fakeDocument }],
      parentInjector,
    );

    return runInInjectionContext(injector, () => new ViewportService());
  }

  it('defaults to 0x0 and reports mobile (not desktop) when there is no browser window', () => {
    const service = createServiceWithoutWindow();

    expect(service.width()).toBe(0);
    expect(service.height()).toBe(0);
    expect(service.isMobile()).toBe(true);
    expect(service.isDesktop()).toBe(false);
    expect(service.isTablet()).toBe(false);
  });

  it('lets a consumer seed a known default via setSize() before first render', () => {
    const service = createServiceWithoutWindow();

    // Mirrors the documented SSR mitigation: an app-level bootstrap hook seeding a
    // known default (here, desktop) before the server renders anything that branches
    // structurally on isDesktop()/isMobile().
    service.setSize(1440, 900);

    expect(service.isDesktop()).toBe(true);
    expect(service.isMobile()).toBe(false);
  });
});
