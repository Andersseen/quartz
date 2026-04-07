import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { OverlayService } from './overlay.service';
import { TemplateRef, ViewContainerRef } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

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

  it('should inject container element exactly once on demand', () => {
    // Assert no container at first
    expect(document.querySelector('[data-qz-overlay-container]')).toBeNull();

    // The container lazily creates when invoking `.create()`
    const mockTemplateRef = {} as TemplateRef<unknown>;
    const mockViewContainerRef = {
      createEmbeddedView: () => ({ rootNodes: [], detectChanges: () => {} })
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
});
