import { describe, expect, it } from 'vitest';
import {
  createFocusRestorer,
  createFocusTrap,
  focusInitialElement,
  focusSafely,
  getFocusableElements,
} from './focus';

describe('focus foundation', () => {
  it('finds focusable elements and ignores disabled or hidden elements', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <button>Enabled</button>
      <button disabled>Disabled</button>
      <a href="#" style="display: none">Hidden</a>
      <div contenteditable="true">Editable</div>
    `;
    document.body.appendChild(container);

    expect(getFocusableElements(container).map((el) => el.textContent?.trim())).toEqual([
      'Enabled',
      'Editable',
    ]);

    container.remove();
  });

  it('focuses initial focusable child or falls back to the container', () => {
    const container = document.createElement('div');
    container.tabIndex = -1;
    const button = document.createElement('button');
    container.appendChild(button);
    document.body.appendChild(container);

    expect(focusInitialElement(container)).toBe(button);
    expect(document.activeElement).toBe(button);

    button.remove();
    expect(focusInitialElement(container)).toBe(container);
    expect(document.activeElement).toBe(container);
    container.remove();
  });

  it('restores focus safely', () => {
    const before = document.createElement('button');
    document.body.appendChild(before);
    before.focus();

    const restorer = createFocusRestorer(document);
    const after = document.createElement('button');
    document.body.appendChild(after);
    after.focus();

    restorer.restore();
    expect(document.activeElement).toBe(before);

    before.remove();
    after.remove();
  });

  it('does not restore focus to removed, disabled, or hidden targets', () => {
    const before = document.createElement('button');
    const after = document.createElement('button');
    document.body.append(before, after);
    before.focus();

    const restorer = createFocusRestorer(document);
    before.remove();
    after.focus();

    restorer.restore();
    expect(document.activeElement).toBe(after);

    expect(focusSafely(before)).toBeNull();
    before.disabled = true;
    document.body.appendChild(before);
    expect(focusSafely(before)).toBeNull();
    before.disabled = false;
    before.hidden = true;
    expect(focusSafely(before)).toBeNull();

    before.remove();
    after.remove();
  });

  it('traps Tab and Shift+Tab inside a container', () => {
    const container = document.createElement('div');
    container.tabIndex = -1;
    const first = document.createElement('button');
    const last = document.createElement('button');
    container.append(first, last);
    document.body.appendChild(container);
    const trap = createFocusTrap(container, document);

    last.focus();
    const forward = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    trap.handleKeydown(forward);
    expect(document.activeElement).toBe(first);

    first.focus();
    const backward = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
    trap.handleKeydown(backward);
    expect(document.activeElement).toBe(last);

    trap.destroy();
    container.remove();
  });

  it('is SSR-safe when the document has no defaultView', () => {
    const ssrDocument = Object.create(document, {
      defaultView: { value: null },
      activeElement: { value: null },
    }) as Document;
    const container = document.createElement('div');

    expect(() => createFocusRestorer(ssrDocument).restore()).not.toThrow();
    expect(() =>
      createFocusTrap(container, ssrDocument).handleKeydown(
        new KeyboardEvent('keydown', { key: 'Tab' }),
      ),
    ).not.toThrow();
  });
});
