import { TestBed } from '@angular/core/testing';
import { DragDropService } from './drag-drop.service';
import { describe, it, expect, beforeEach } from 'vitest';

describe('DragDropService', () => {
  let service: DragDropService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DragDropService],
    });
    service = TestBed.inject(DragDropService);
  });

  it('should initialize empty', () => {
    expect(service.isDragging()).toBe(false);
    expect(service.dragData()).toBeNull();
    expect(service.dragType()).toBeNull();
    expect(service.sourceElement()).toBeNull();
  });

  it('should reflect drag state when starting drag', () => {
    const mockElement = document.createElement('div');
    const mockData = { user: 'qz' };

    service.startDrag(mockData, mockElement, 'MOCK_TYPE');

    expect(service.isDragging()).toBe(true);
    expect(service.dragData()).toEqual(mockData);
    expect(service.sourceElement()).toBe(mockElement);
    expect(service.dragType()).toBe('MOCK_TYPE');

    // Testing generic typed data fetcher
    expect(service.getDragData<{ user: string }>()).toEqual(mockData);
  });

  it('should reset drag state exactly when ending', () => {
    const mockElement = document.createElement('div');
    service.startDrag('item1', mockElement);

    expect(service.isDragging()).toBe(true);

    service.endDrag(true); // dropped

    expect(service.isDragging()).toBe(false);
    expect(service.dragData()).toBeNull();
    expect(service.sourceElement()).toBeNull();
    expect(service.dragType()).toBeNull();
  });
});
