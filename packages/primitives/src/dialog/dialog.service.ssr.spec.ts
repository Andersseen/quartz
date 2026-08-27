import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import {
  TemplateRef,
  ViewContainerRef,
  EnvironmentInjector,
  runInInjectionContext,
  createEnvironmentInjector,
} from '@angular/core';
import { DialogService } from './dialog.service';
import { describe, it, expect, vi } from 'vitest';

describe('DialogService SSR', () => {
  it('should not touch the DOM when there is no browser window', () => {
    const fakeDocument = {
      createElement: () => ({
        style: {},
        setAttribute: () => {},
        appendChild: () => {},
        remove: () => {},
      }),
      body: { style: {}, appendChild: () => {}, removeChild: () => {} },
      defaultView: null,
      activeElement: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      querySelector: () => null,
      querySelectorAll: () => [],
    } as unknown as Document;

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const injector = createEnvironmentInjector(
      [{ provide: DOCUMENT, useValue: fakeDocument }],
      parentInjector,
    );

    const service = runInInjectionContext(injector, () => new DialogService());

    const panel = document.createElement('div');
    const templateRef = {} as TemplateRef<unknown>;
    const viewContainerRef = {
      createEmbeddedView: () => ({
        rootNodes: [panel],
        detectChanges: () => {},
        destroy: () => panel.remove(),
      }),
    } as unknown as ViewContainerRef;

    const ref = service.open(templateRef, viewContainerRef);

    expect(document.querySelector('[data-qz-dialog-backdrop]')).toBeNull();
    expect(document.querySelector('[data-qz-dialog-wrapper]')).toBeNull();
    expect(document.body.style.overflow).toBe('');

    const closed = vi.fn();
    ref.closed$.subscribe(closed);
    expect(closed).toHaveBeenCalled();
  });
});
