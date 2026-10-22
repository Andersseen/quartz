import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDismissController, type DismissController } from './dismiss';

function layer(
  doc: Document,
  root: HTMLElement,
  onDismiss: (reason: string) => void,
  extra: Partial<Parameters<typeof createDismissController>[0]> = {},
): DismissController {
  return createDismissController({
    document: doc,
    escape: true,
    outsidePointer: true,
    rootElements: () => [root],
    onDismiss,
    ...extra,
  });
}

function el(): HTMLElement {
  const node = document.createElement('div');
  document.body.appendChild(node);
  return node;
}

const escape = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

describe('dismiss layer ownership', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('Escape closes only the topmost layer, then the next one', () => {
    const a = vi.fn();
    const b = vi.fn();
    const ca = layer(document, el(), a);
    const cb = layer(document, el(), b);

    escape();
    expect(b).toHaveBeenCalledTimes(1);
    expect(a).not.toHaveBeenCalled();

    cb.destroy();
    escape();
    expect(a).toHaveBeenCalledTimes(1);
    ca.destroy();
  });

  it('one physical pointer event dismisses exactly one layer even if the top layer closes itself', () => {
    const dismissed: string[] = [];
    const ca = layer(document, el(), () => dismissed.push('A'));
    const cb: DismissController = layer(document, el(), () => {
      dismissed.push('B');
      cb.destroy();
    });

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(dismissed).toEqual(['B']);
    ca.destroy();
  });

  it('a pointer event on a lower layer root does not dismiss the lower layer while a child is open', () => {
    const rootA = el();
    const rootB = el();
    const a = vi.fn();
    const b = vi.fn();
    const ca = layer(document, rootA, a);
    const cb = layer(document, rootB, b);

    rootA.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledWith('outside-pointer', expect.anything());
    ca.destroy();
    cb.destroy();
  });

  it('a layer closing out of order leaves the top layer in charge', () => {
    const a = vi.fn();
    const b = vi.fn();
    const ca = layer(document, el(), a);
    const cb = layer(document, el(), b);
    ca.destroy();
    ca.destroy();
    escape();
    expect(b).toHaveBeenCalledTimes(1);
    expect(a).not.toHaveBeenCalled();
    cb.destroy();
  });

  it('stacks are per Document', () => {
    const other = document.implementation.createHTMLDocument('other');
    const a = vi.fn();
    const b = vi.fn();
    const ca = layer(document, el(), a);
    const root = other.createElement('div');
    other.body.appendChild(root);
    // jsdom's secondary documents have no defaultView, so the controller is inert there.
    const cb = layer(other, root, b);
    escape();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();
    ca.destroy();
    cb.destroy();
  });

  it('removes every document listener on destroy', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const c = layer(document, el(), vi.fn(), { focusOutside: true });
    c.destroy();
    const added = add.mock.calls.map(([type]) => type).sort();
    const removed = remove.mock.calls.map(([type]) => type).sort();
    expect(removed).toEqual(added);
    add.mockRestore();
    remove.mockRestore();
  });
});
