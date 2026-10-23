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

  it('never starts the countdown interval for a persistent (duration: 0) toast', () => {
    service.info('Persists forever', undefined, { duration: 0 });
    expect(service.toasts().length).toBe(1);

    // No countdown work exists, so no interval should have been started at all.
    expect(vi.getTimerCount()).toBe(0);

    vi.advanceTimersByTime(10_000);
    expect(service.toasts().length).toBe(1);
  });

  it('stops the countdown interval once its last timed toast elapses, even while a persistent toast remains', () => {
    service.info('Persists forever', undefined, { duration: 0 });
    service.info('Times out', undefined, { duration: 500 });
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(600);
    expect(service.toasts().map((t) => t.message)).toEqual(['Persists forever']);

    // The interval must be torn down now — nothing left has an active countdown.
    expect(vi.getTimerCount()).toBe(0);

    // And it must stay stopped: advancing time further must not reintroduce any effect.
    vi.advanceTimersByTime(10_000);
    expect(service.toasts().length).toBe(1);
  });

  it('stops the interval when the only active toast is paused, and restarts it on resume', () => {
    const id = service.warning('Pausable', undefined, { duration: 1000 });
    expect(vi.getTimerCount()).toBe(1);

    service.pause(id);
    expect(vi.getTimerCount()).toBe(0);

    service.resume(id);
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(1100);
    expect(service.toasts().length).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops the interval on dismiss/dismissAll', () => {
    const id = service.warning('One', undefined, { duration: 1000 });
    service.warning('Two', undefined, { duration: 1000 });
    expect(vi.getTimerCount()).toBe(1);

    service.dismiss(id);
    expect(vi.getTimerCount()).toBe(1); // "Two" is still ticking

    service.dismissAll();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('freezes the exact remaining time on pause, even between interval ticks', () => {
    const id = service.info('Exact', undefined, { duration: 1000 });
    vi.advanceTimersByTime(350); // last tick was at 300ms
    service.pause(id);
    expect(service.toasts()[0].remainingTime).toBe(650);

    vi.advanceTimersByTime(5000);
    service.resume(id);
    vi.advanceTimersByTime(600);
    expect(service.toasts().length).toBe(1);
    vi.advanceTimersByTime(100);
    expect(service.toasts().length).toBe(0);
  });

  it('repeated pause/resume neither loses nor gains time', () => {
    const id = service.info('Repeat', undefined, { duration: 1000 });
    vi.advanceTimersByTime(200);
    service.pause(id);
    service.pause(id);
    vi.advanceTimersByTime(3000);
    service.resume(id);
    service.resume(id);
    vi.advanceTimersByTime(300);
    service.pause(id);
    service.resume(id);
    expect(service.toasts()[0].remainingTime).toBeGreaterThanOrEqual(480);
    vi.advanceTimersByTime(520);
    expect(service.toasts().length).toBe(0);
  });

  it('dismissing a paused toast leaves no timer behind', () => {
    const id = service.info('Paused', undefined, { duration: 1000 });
    service.pause(id);
    service.dismiss(id);
    expect(service.toasts().length).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('tracks several concurrent toasts with different durations independently', () => {
    service.info('short', undefined, { duration: 300 });
    service.info('long', undefined, { duration: 900 });
    service.info('forever', undefined, { duration: 0 });
    vi.advanceTimersByTime(400);
    expect(service.toasts().map((t) => t.message)).toEqual(['long', 'forever']);
    vi.advanceTimersByTime(600);
    expect(service.toasts().map((t) => t.message)).toEqual(['forever']);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears the interval when the service is destroyed', () => {
    service.info('Running', undefined, { duration: 5000 });
    expect(vi.getTimerCount()).toBe(1);
    TestBed.resetTestingModule();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('survives rapid add/dismiss cycles without leaking timers', () => {
    for (let i = 0; i < 50; i++)
      service.dismiss(service.info(`t${i}`, undefined, { duration: 500 }));
    expect(service.toasts().length).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
