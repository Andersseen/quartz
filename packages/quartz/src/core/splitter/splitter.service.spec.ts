import { TestBed } from '@angular/core/testing';
import { SplitterService } from './splitter.service';
import { describe, it, expect, beforeEach } from 'vitest';

describe('SplitterService', () => {
  let service: SplitterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SplitterService],
    });
    service = TestBed.inject(SplitterService);
  });

  it('should respect minSize and maxSize', () => {
    service.updateConfig({ minSize: 20, maxSize: 80 });

    service.setPosition(10); // Below min
    expect(service.position()).toBe(20);

    service.setPosition(90); // Above max
    expect(service.position()).toBe(80);

    service.setPosition(50); // Inside bounds
    expect(service.position()).toBe(50);
  });

  it('should calculate position from horizontal event', () => {
    service.setOrientation('horizontal');
    const rect = { left: 0, top: 0, width: 1000, height: 500 } as DOMRect;
    service.setContainerRect(rect);

    // Client X is exactly at 250px (25% of 1000 mapped size)
    const pos = service.calculatePositionFromEvent(250, 0);
    expect(pos).toBe(25);
  });

  it('should calculate position from vertical event', () => {
    service.setOrientation('vertical');
    const rect = { left: 0, top: 0, width: 1000, height: 800 } as DOMRect;
    service.setContainerRect(rect);

    // Client Y is at 400px (50% of 800 mapped size)
    const pos = service.calculatePositionFromEvent(0, 400);
    expect(pos).toBe(50);
  });

  it('should toggle dragging state', () => {
    expect(service.isDragging()).toBe(false);
    service.startDragging();
    expect(service.isDragging()).toBe(true);
    service.stopDragging();
    expect(service.isDragging()).toBe(false);
  });
});
