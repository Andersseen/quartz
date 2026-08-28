import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import {
  EnvironmentInjector,
  runInInjectionContext,
  createEnvironmentInjector,
} from '@angular/core';
import { describe, it, expect } from 'vitest';
import { DirectionalityService } from './directionality.service';

describe('DirectionalityService SSR', () => {
  it('initializes without a browser window, defaulting to ltr', () => {
    const fakeDocumentElement = {
      closest: (selector: string) => (selector === '[dir]' ? null : null),
      getAttribute: () => null,
    };
    const fakeDocument = {
      defaultView: null,
      documentElement: fakeDocumentElement,
    } as unknown as Document;

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const injector = createEnvironmentInjector(
      [{ provide: DOCUMENT, useValue: fakeDocument }],
      parentInjector,
    );

    const service = runInInjectionContext(injector, () => new DirectionalityService());

    expect(service.direction()).toBe('ltr');
  });

  it('resolves rtl from a server-rendered <html dir="rtl"> without touching window', () => {
    const fakeDocumentElement = {
      closest: (selector: string) => (selector === '[dir]' ? fakeDocumentElement : null),
      getAttribute: (name: string) => (name === 'dir' ? 'rtl' : null),
    };
    const fakeDocument = {
      defaultView: null,
      documentElement: fakeDocumentElement,
    } as unknown as Document;

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const injector = createEnvironmentInjector(
      [{ provide: DOCUMENT, useValue: fakeDocument }],
      parentInjector,
    );

    const service = runInInjectionContext(injector, () => new DirectionalityService());

    expect(service.direction()).toBe('rtl');
  });
});
