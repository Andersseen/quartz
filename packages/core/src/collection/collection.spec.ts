import { describe, expect, it, vi } from 'vitest';
import { CollectionStore, findRelativeItem } from './collection';
import type { CollectionItem } from './collection.types';

describe('CollectionStore', () => {
  it('registers items in DOM order and skips disabled items', () => {
    const host = document.createElement('div');
    const b = document.createElement('button');
    const a = document.createElement('button');
    host.append(a, b);

    const store = new CollectionStore<CollectionItem>({}, document);
    store.register({ id: 'b', element: b });
    store.register({ id: 'a', element: a, disabled: true });

    expect(store.items().map((item) => item.id)).toEqual(['a', 'b']);
    expect(store.enabledItems().map((item) => item.id)).toEqual(['b']);
    expect(store.activeId()).toBe('b');
  });

  it('moves next, previous, first and last with optional wrapping', () => {
    const store = new CollectionStore<CollectionItem>({ wrap: true }, document);
    store.register({ id: 'one' });
    store.register({ id: 'two', disabled: true });
    store.register({ id: 'three' });

    store.next();
    expect(store.activeId()).toBe('three');
    store.next();
    expect(store.activeId()).toBe('one');
    store.previous();
    expect(store.activeId()).toBe('three');
    store.first();
    expect(store.activeId()).toBe('one');
    store.last();
    expect(store.activeId()).toBe('three');
  });

  it('supports no-wrap navigation', () => {
    const result = findRelativeItem([{ id: 'one' }, { id: 'two' }], 'two', 1, { wrap: false });
    expect(result.item?.id).toBe('two');
  });

  it('handles Home, End, vertical and horizontal keys', () => {
    const store = new CollectionStore<CollectionItem>({ orientation: 'horizontal' }, document);
    store.register({ id: 'one' });
    store.register({ id: 'two' });

    const right = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    store.handleKeydown(right);
    expect(store.activeId()).toBe('two');

    const end = new KeyboardEvent('keydown', { key: 'End' });
    store.handleKeydown(end);
    expect(store.activeId()).toBe('two');

    const home = new KeyboardEvent('keydown', { key: 'Home' });
    store.handleKeydown(home);
    expect(store.activeId()).toBe('one');
  });

  it('defaults horizontal navigation to ltr (ArrowRight = next, ArrowLeft = previous)', () => {
    const store = new CollectionStore<CollectionItem>({ orientation: 'horizontal' }, document);
    store.register({ id: 'one' });
    store.register({ id: 'two' });

    store.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(store.activeId()).toBe('two');

    store.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(store.activeId()).toBe('one');
  });

  it('mirrors horizontal arrow keys in rtl (ArrowLeft = next, ArrowRight = previous)', () => {
    const store = new CollectionStore<CollectionItem>(
      { orientation: 'horizontal', direction: 'rtl' },
      document,
    );
    store.register({ id: 'one' });
    store.register({ id: 'two' });

    store.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(store.activeId()).toBe('two');

    store.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(store.activeId()).toBe('one');
  });

  it('never mirrors vertical Up/Down, regardless of direction', () => {
    const store = new CollectionStore<CollectionItem>(
      { orientation: 'vertical', direction: 'rtl' },
      document,
    );
    store.register({ id: 'one' });
    store.register({ id: 'two' });

    store.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(store.activeId()).toBe('two');

    store.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(store.activeId()).toBe('one');
  });

  it('supports typeahead and clears its buffer', () => {
    vi.useFakeTimers();
    const store = new CollectionStore<CollectionItem>({ typeaheadTimeoutMs: 50 }, document);
    store.register({ id: 'alpha', label: 'Alpha' });
    store.register({ id: 'bravo', label: 'Bravo' });
    store.register({ id: 'charlie', label: 'Charlie' });

    store.typeahead('b');
    expect(store.activeId()).toBe('bravo');
    vi.advanceTimersByTime(60);
    store.typeahead('c');
    expect(store.activeId()).toBe('charlie');
    store.destroy();
    vi.useRealTimers();
  });

  it('cycles repeated typeahead characters instead of searching the repeated string', () => {
    const store = new CollectionStore<CollectionItem>({ typeaheadTimeoutMs: 50 }, document);
    store.register({ id: 'alpha', label: 'Alpha' });
    store.register({ id: 'alpine', label: 'Alpine' });
    store.register({ id: 'bravo', label: 'Bravo' });

    store.typeahead('a');
    expect(store.activeId()).toBe('alpine');
    store.typeahead('a');
    expect(store.activeId()).toBe('alpha');
  });

  it('keeps active id usable when every item becomes disabled', () => {
    let disabled = false;
    const store = new CollectionStore<CollectionItem>({}, document);
    store.register({ id: 'one', disabled: () => disabled });

    disabled = true;
    store.next();

    expect(store.activeItem()).toBeNull();
    expect(store.activeTabIndex('one')).toBe(-1);
  });

  it('handles dynamic add/remove and active item removal', () => {
    const store = new CollectionStore<CollectionItem>({}, document);
    const one = { id: 'one' };
    const two = { id: 'two' };
    store.register(one);
    store.register(two);
    store.setActive('two');

    store.unregister(two);
    expect(store.activeId()).toBe('one');

    store.unregister(one);
    expect(store.activeId()).toBeNull();
  });

  it('provides roving tabindex and focuses the active element', () => {
    const one = document.createElement('button');
    const two = document.createElement('button');
    document.body.append(one, two);
    const store = new CollectionStore<CollectionItem>(
      { focusStrategy: 'roving-tabindex' },
      document,
    );
    store.register({ id: 'one', element: one });
    store.register({ id: 'two', element: two });

    expect(store.activeTabIndex('one')).toBe(0);
    store.setActive('two', { focus: true });
    expect(store.activeTabIndex('one')).toBe(-1);
    expect(store.activeTabIndex('two')).toBe(0);
    expect(document.activeElement).toBe(two);

    one.remove();
    two.remove();
  });
});
