import { describe, expect, it } from 'vitest';
import { createScrollLock } from './scroll-lock';

describe('createScrollLock', () => {
  it('locks and restores body overflow', () => {
    document.body.style.overflow = 'clip';
    const lock = createScrollLock(document);

    lock.lock();

    expect(lock.locked).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');

    lock.unlock();

    expect(lock.locked).toBe(false);
    expect(document.body.style.overflow).toBe('clip');
    document.body.style.overflow = '';
  });

  it('coordinates nested locks from the same consumer', () => {
    const lock = createScrollLock(document);

    lock.lock();
    lock.lock();
    lock.unlock();

    expect(document.body.style.overflow).toBe('hidden');

    lock.unlock();

    expect(document.body.style.overflow).toBe('');
  });

  it('coordinates multiple independent consumers regardless of unlock order', () => {
    document.body.style.overflow = 'auto';
    const first = createScrollLock(document);
    const second = createScrollLock(document);

    first.lock();
    second.lock();
    first.unlock();

    expect(document.body.style.overflow).toBe('hidden');

    second.unlock();

    expect(document.body.style.overflow).toBe('auto');
    document.body.style.overflow = '';
  });

  it('destroy releases all outstanding locks for that consumer', () => {
    const first = createScrollLock(document);
    const second = createScrollLock(document);

    first.lock();
    first.lock();
    second.lock();
    first.destroy();

    expect(first.locked).toBe(false);
    expect(document.body.style.overflow).toBe('hidden');

    second.destroy();

    expect(document.body.style.overflow).toBe('');
  });

  it('is a no-op without a browser window', () => {
    const fakeDocument = { body: { style: { overflow: 'auto' } }, defaultView: null };
    const lock = createScrollLock(fakeDocument as unknown as Document);

    expect(() => {
      lock.lock();
      lock.unlock();
      lock.destroy();
    }).not.toThrow();
    expect(lock.locked).toBe(false);
    expect(fakeDocument.body.style.overflow).toBe('auto');
  });
});
