import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [ToastService],
    });
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should initialize empty', () => {
    expect(service.toasts().length).toBe(0);
  });

  it('should show success toast', () => {
    const id = service.success('Test Message', 'Title');
    expect(id).toBeDefined();

    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].message).toBe('Test Message');
    expect(toasts[0].title).toBe('Title');
  });

  it('should auto dismiss based on timer', () => {
    service.success('Auto dismiss', undefined, { duration: 1000 });
    expect(service.toasts().length).toBe(1);

    // Fast forward time
    vi.advanceTimersByTime(1100);

    expect(service.toasts().length).toBe(0);
  });

  it('should allow dismissing all toasts', () => {
    service.info('Toast 1');
    service.error('Toast 2');
    expect(service.toasts().length).toBe(2);

    service.dismissAll();
    expect(service.toasts().length).toBe(0);
  });

  it('should map toast to correct position', () => {
    service.info('Top Left', undefined, { position: 'top-left' });
    service.info('Bottom Right', undefined, { position: 'bottom-right' });

    const byPosition = service.toastsByPosition();
    expect(byPosition.get('top-left')?.length).toBe(1);
    expect(byPosition.get('bottom-right')?.length).toBe(1);
    expect(byPosition.get('top-center')?.length).toBe(0);
  });

  it('should pause and resume correctly', () => {
    const id = service.warning('Warning', undefined, { duration: 2000 });

    vi.advanceTimersByTime(1000); // Wait 1 sec
    service.pause(id);

    expect(service.toasts()[0].isPaused).toBe(true);

    // Fast forward another 2 seconds, it shouldn't be dismissed because it's paused
    vi.advanceTimersByTime(2000);
    expect(service.toasts().length).toBe(1);

    service.resume(id);
    expect(service.toasts()[0].isPaused).toBe(false);

    // Now it should die after waiting the remaining 1000ms
    vi.advanceTimersByTime(1100);
    expect(service.toasts().length).toBe(0);
  });
});
