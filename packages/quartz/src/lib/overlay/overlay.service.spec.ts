import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { OverlayService } from './overlay.service';
import { TemplateRef, ViewContainerRef } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('OverlayService', () => {
  let service: OverlayService;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OverlayService],
    });
    service = TestBed.inject(OverlayService);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    document.querySelector('[data-qz-overlay-container]')?.remove();
  });

  it('should inject container element exactly once on demand', () => {
    // Assert no container at first
    expect(document.querySelector('[data-qz-overlay-container]')).toBeNull();

    // The container lazily creates when invoking `.create()`
    const mockTemplateRef = {} as TemplateRef<unknown>;
    const mockViewContainerRef = {
      createEmbeddedView: () => ({ rootNodes: [], detectChanges: () => {} }),
    } as unknown as ViewContainerRef;

    // We append the anchor so we can get bounded rects from it
    const anchor = document.createElement('div');
    document.body.appendChild(anchor);

    // Call create
    const ref = service.create(mockTemplateRef, mockViewContainerRef, anchor);

    const firstCallNodes = document.querySelectorAll('[data-qz-overlay-container]');
    expect(firstCallNodes.length).toBe(1);

    // Call it again to test physical singleton logic
    service.create(mockTemplateRef, mockViewContainerRef, anchor);

    const secondCallNodes = document.querySelectorAll('[data-qz-overlay-container]');
    expect(secondCallNodes.length).toBe(1); // Still exactly one DOM layer

    // Clean up
    ref.close();
    document.body.removeChild(anchor);
  });

  it('should open an overlay anchored to viewport coordinates', async () => {
    const content = document.createElement('div');
    const { templateRef, viewContainerRef } = createTemplateMocks(content);
    const ref = service.createAt(templateRef, viewContainerRef, { x: 100, y: 200 });
    const mounted = vi.fn();

    ref.mounted$.subscribe(mounted);
    ref.open();
    await waitForOverlayFrame();

    expect(mounted).toHaveBeenCalledWith(content);
    expect(content.parentElement?.parentElement).toBe(
      document.querySelector('[data-qz-overlay-container]'),
    );
    expect(content.parentElement?.getAttribute('style')).toContain('translate(100px, 204px)');

    ref.close();
  });

  it('should update position when the virtual anchor changes', async () => {
    const content = document.createElement('div');
    const { templateRef, viewContainerRef } = createTemplateMocks(content);
    const ref = service.createAt(templateRef, viewContainerRef, { x: 10, y: 20 });

    ref.open();
    await waitForOverlayFrame();

    ref.setVirtualAnchor({ x: 120, y: 140 });

    expect(content.parentElement?.getAttribute('style')).toContain('translate(120px, 144px)');

    ref.close();
  });

  it('should close on outside click and document scroll with a virtual anchor', async () => {
    const content = document.createElement('div');
    const { templateRef, viewContainerRef } = createTemplateMocks(content);
    const ref = service.createAt(templateRef, viewContainerRef, { x: 100, y: 200 });

    ref.open();
    await waitForOverlayFrame();

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(ref.isOpen).toBe(false);

    ref.open();
    await waitForOverlayFrame();

    document.dispatchEvent(new Event('scroll'));

    expect(ref.isOpen).toBe(false);
  });
});

function createTemplateMocks(content: HTMLElement): {
  templateRef: TemplateRef<unknown>;
  viewContainerRef: ViewContainerRef;
} {
  return {
    templateRef: {} as TemplateRef<unknown>,
    viewContainerRef: {
      createEmbeddedView: () => ({
        rootNodes: [content],
        detectChanges: () => {},
        destroy: () => content.remove(),
      }),
    } as unknown as ViewContainerRef,
  };
}

function waitForOverlayFrame(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 20));
}
