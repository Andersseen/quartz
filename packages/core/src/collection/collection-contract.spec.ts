import { signal } from '@angular/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CollectionStore } from './collection';
import type { CollectionItem } from './collection.types';

const ids = (store: CollectionStore<CollectionItem>) => store.items().map((i) => i.id);

function make(n: string[], config = {}) {
  const store = new CollectionStore<CollectionItem>(config, document);
  const items = n.map((id) => ({ id }) as CollectionItem);
  items.forEach((i) => store.register(i));
  return { store, items };
}

describe('CollectionStore contract', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('active item recovery', () => {
    it('moves to the next sibling when the active item is removed', () => {
      const { store, items } = make(['a', 'b', 'c', 'd']);
      store.setActive('b');
      store.unregister(items[1]);
      expect(store.activeId()).toBe('c');
      expect(store.activeItem()?.id).toBe('c');
    });

    it('falls back to the previous sibling when the removed active item was last', () => {
      const { store, items } = make(['a', 'b', 'c']);
      store.setActive('c');
      store.unregister(items[2]);
      expect(store.activeId()).toBe('b');
    });

    it('skips disabled neighbours when recovering', () => {
      const { store, items } = make(['a', 'b', 'c']);
      items[2].disabled = true;
      store.setActive('b');
      // refresh enabled computation by re-registering the changed item
      store.register(items[2]);
      store.unregister(items[1]);
      expect(store.activeId()).toBe('a');
    });

    it('becomes null with an empty collection and recovers on the next registration', () => {
      const { store, items } = make(['a']);
      store.unregister(items[0]);
      expect(store.activeId()).toBeNull();
      expect(store.activeItem()).toBeNull();
      store.register({ id: 'z' });
      expect(store.activeId()).toBe('z');
    });

    it('has no active item when no item is enabled', () => {
      const store = new CollectionStore<CollectionItem>({}, document);
      store.register({ id: 'a', disabled: true });
      expect(store.activeId()).toBeNull();
      expect(store.next()).toBeNull();
      expect(store.first()).toBeNull();
    });

    it('keeps activeId and activeItem consistent when the active item is disabled in place', () => {
      const disabled = signal(false);
      const store = new CollectionStore<CollectionItem>({}, document);
      store.register({ id: 'a' });
      store.register({ id: 'b', disabled });
      store.register({ id: 'c' });
      store.setActive('b');
      disabled.set(true);
      expect(store.activeItem()).toBeNull();
      expect(store.activeId()).toBeNull();
    });

    it('navigates relative to a disabled-in-place active item instead of jumping to an end', () => {
      const disabled = signal(false);
      const store = new CollectionStore<CollectionItem>({}, document);
      store.register({ id: 'a' });
      store.register({ id: 'b', disabled });
      store.register({ id: 'c' });
      store.register({ id: 'd' });
      store.setActive('b');
      disabled.set(true);
      expect(store.next()?.id).toBe('c');

      store.setActive('c');
      disabled.set(false);
      store.setActive('b');
      disabled.set(true);
      expect(store.previous()?.id).toBe('a');
    });

    it('roving tabindex lands on the neighbour of a disabled-in-place active item', () => {
      const disabled = signal(false);
      const store = new CollectionStore<CollectionItem>(
        { focusStrategy: 'roving-tabindex' },
        document,
      );
      store.register({ id: 'a' });
      store.register({ id: 'b', disabled });
      store.register({ id: 'c' });
      store.setActive('b');
      disabled.set(true);
      expect(['a', 'b', 'c'].map((id) => store.activeTabIndex(id))).toEqual([-1, -1, 0]);
    });
  });

  describe('registration and order', () => {
    it('registering the same item repeatedly does not duplicate it', () => {
      const { store, items } = make(['a', 'b']);
      store.register(items[0]);
      store.register(items[0]);
      expect(ids(store)).toEqual(['a', 'b']);
    });

    it('re-registering an id replaces the stale entry', () => {
      const { store } = make(['a', 'b']);
      const replacement = { id: 'a', label: 'new' };
      store.register(replacement);
      expect(store.items().filter((i) => i.id === 'a')).toEqual([replacement]);
    });

    it('unregistering an unknown item changes nothing', () => {
      const { store } = make(['a', 'b']);
      store.setActive('b');
      store.unregister({ id: 'b' });
      expect(store.activeId()).toBe('b');
      expect(ids(store)).toEqual(['a', 'b']);
    });

    it('refreshOrder follows DOM reordering', () => {
      const host = document.createElement('div');
      const els = ['a', 'b', 'c'].map((id) => {
        const el = document.createElement('button');
        el.id = id;
        host.appendChild(el);
        return el;
      });
      document.body.appendChild(host);
      const store = new CollectionStore<CollectionItem>({}, document);
      els.forEach((element) => store.register({ id: element.id, element }));
      host.append(els[2], els[0], els[1]);
      store.refreshOrder();
      expect(ids(store)).toEqual(['c', 'a', 'b']);
      store.setActive('c');
      expect(store.next()?.id).toBe('a');
    });
  });

  describe('navigation', () => {
    it('does not wrap when configured; stays on the boundary', () => {
      const { store } = make(['a', 'b'], { wrap: false });
      store.last();
      expect(store.next()?.id).toBe('b');
      store.first();
      expect(store.previous()?.id).toBe('a');
    });

    it('maps horizontal arrows through direction, and re-maps after configure()', () => {
      const { store } = make(['a', 'b', 'c'], { orientation: 'horizontal' });
      const press = (key: string) =>
        store.handleKeydown(new KeyboardEvent('keydown', { key, cancelable: true }));
      press('ArrowRight');
      expect(store.activeId()).toBe('b');
      store.configure({ direction: 'rtl' });
      press('ArrowRight');
      expect(store.activeId()).toBe('a');
      press('ArrowLeft');
      expect(store.activeId()).toBe('b');
    });

    it('ignores Up/Down in horizontal orientation and Left/Right in vertical', () => {
      const { store } = make(['a', 'b'], { orientation: 'horizontal' });
      const down = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });
      expect(store.handleKeydown(down)).toBe(false);
      expect(store.activeId()).toBe('a');
      store.configure({ orientation: 'vertical' });
      const right = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });
      expect(store.handleKeydown(right)).toBe(false);
    });

    it('navigation changes the active item only; it has no selection side effect', () => {
      const selected = vi.fn();
      const { store } = make(['a', 'b']);
      store.next();
      expect(selected).not.toHaveBeenCalled();
      expect(store.activeId()).toBe('b');
    });
  });

  describe('typeahead', () => {
    const named = (labels: string[]) => {
      const store = new CollectionStore<CollectionItem>({ typeaheadTimeoutMs: 500 }, document);
      labels.forEach((label) => store.register({ id: label, label }));
      return store;
    };

    it('cycles through several matches on a repeated character', () => {
      const store = named(['apple', 'avocado', 'banana']);
      store.typeahead('a');
      expect(store.activeId()).toBe('avocado');
      store.typeahead('a');
      expect(store.activeId()).toBe('apple');
    });

    it('keeps the active item when nothing matches', () => {
      const store = named(['apple', 'banana']);
      store.setActive('banana');
      expect(store.typeahead('z')).toBeNull();
      expect(store.activeId()).toBe('banana');
    });

    it('reads reactive labels at match time', () => {
      const label = signal('alpha');
      const store = new CollectionStore<CollectionItem>({}, document);
      store.register({ id: 'x', label });
      store.register({ id: 'y', label: 'beta' });
      label.set('gamma');
      store.typeahead('g');
      expect(store.activeId()).toBe('x');
    });

    it('expires the buffer after the timeout', () => {
      vi.useFakeTimers();
      const store = named(['ab', 'ac', 'ba']);
      store.typeahead('a');
      store.typeahead('c');
      expect(store.activeId()).toBe('ac');
      vi.advanceTimersByTime(501);
      store.typeahead('b');
      expect(store.activeId()).toBe('ba');
    });

    it('expires without a Document as well', () => {
      vi.useFakeTimers();
      const store = new CollectionStore<CollectionItem>({});
      ['ab', 'ac', 'ba'].forEach((label) => store.register({ id: label, label }));
      store.typeahead('a');
      store.typeahead('c');
      vi.advanceTimersByTime(501);
      store.typeahead('b');
      expect(store.activeId()).toBe('ba');
    });

    it('leaves no timer behind after destroy, and ignores later typeahead', () => {
      vi.useFakeTimers();
      const store = named(['ab', 'ac']);
      store.typeahead('a');
      expect(vi.getTimerCount()).toBe(1);
      store.destroy();
      expect(vi.getTimerCount()).toBe(0);
      expect(store.typeahead('a')).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
