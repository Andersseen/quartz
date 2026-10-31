import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COPY_FEEDBACK_MS, ClipboardCopy } from './clipboard-copy';

function setClipboard(value: unknown): void {
  Object.defineProperty(window.navigator, 'clipboard', { value, configurable: true });
}

describe('ClipboardCopy', () => {
  let destroy: () => void;
  let service: ClipboardCopy;

  beforeEach(() => {
    vi.useFakeTimers();
    destroy = () => TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [ClipboardCopy] });
    service = TestBed.inject(ClipboardCopy);
  });

  afterEach(() => {
    vi.useRealTimers();
    setClipboard(undefined);
  });

  it('is not copied until the clipboard promise resolves', async () => {
    let resolve!: () => void;
    setClipboard({ writeText: () => new Promise<void>((r) => (resolve = r)) });
    const pending = service.copy('npm i x');
    expect(service.status()).toBe('idle');
    resolve();
    await pending;
    expect(service.status()).toBe('copied');
    expect(service.copiedText()).toBe('npm i x');
  });

  it('reports a rejected write as failed, never copied', async () => {
    setClipboard({ writeText: () => Promise.reject(new DOMException('no', 'NotAllowedError')) });
    await service.copy('x');
    expect(service.status()).toBe('failed');
    expect(service.copiedText()).toBeNull();
  });

  it('reports a missing Clipboard API as unsupported', async () => {
    setClipboard(undefined);
    await service.copy('x');
    expect(service.status()).toBe('unsupported');
  });

  it('returns to idle after the feedback window and restarts it on repeated clicks', async () => {
    setClipboard({ writeText: () => Promise.resolve() });
    await service.copy('x');
    vi.advanceTimersByTime(COPY_FEEDBACK_MS - 100);
    await service.copy('x');
    vi.advanceTimersByTime(COPY_FEEDBACK_MS - 100);
    expect(service.status()).toBe('copied');
    vi.advanceTimersByTime(100);
    expect(service.status()).toBe('idle');
  });

  it('clears its timer on teardown and ignores completions afterwards', async () => {
    setClipboard({ writeText: () => Promise.resolve() });
    await service.copy('x');
    expect(vi.getTimerCount()).toBe(1);
    destroy();
    expect(vi.getTimerCount()).toBe(0);
    await service.copy('y');
    expect(vi.getTimerCount()).toBe(0);
  });
});
