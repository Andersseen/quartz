import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import {
  EnvironmentInjector,
  TemplateRef,
  ViewContainerRef,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { DrawerService } from './drawer.service';
import { DialogService } from '../dialog/dialog.service';

describe('DrawerService SSR', () => {
  it('renders nothing without a browser window and still reports closed', () => {
    const fakeDocument = {
      createElement: () => ({ style: {}, setAttribute: () => {}, appendChild: () => {} }),
      body: { style: {}, appendChild: () => {} },
      documentElement: undefined,
      defaultView: null,
      activeElement: null,
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as Document;
    const injector = createEnvironmentInjector(
      [{ provide: DOCUMENT, useValue: fakeDocument }],
      TestBed.inject(EnvironmentInjector),
    );
    const drawers = runInInjectionContext(injector, () => {
      const dialogs = new DialogService();
      return Object.assign(new DrawerService(), { dialogs, document: fakeDocument });
    });

    const createEmbeddedView = vi.fn();
    const ref = drawers.open(
      {} as TemplateRef<unknown>,
      {
        createEmbeddedView,
        element: { nativeElement: null },
      } as unknown as ViewContainerRef,
    );

    expect(createEmbeddedView).not.toHaveBeenCalled();
    expect(ref.state()).toBe('closed');
    const closed = vi.fn();
    ref.closed$.subscribe(closed);
    expect(closed).toHaveBeenCalledTimes(1);
  });
});
