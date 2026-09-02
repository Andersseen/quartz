import { describe, expect, it } from 'vitest';
import {
  createFocusRestorer,
  createFocusTrap,
  focusInitialElement,
  focusSafely,
  getFocusableElements,
  isFocusable,
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

  it('excludes tabindex="-1" elements even on native-tag selector branches', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <button tabindex="-1">Decoy</button>
      <button>Real1</button>
      <a href="#" tabindex="-1">DecoyLink</a>
      <button>Real2</button>
    `;
    document.body.appendChild(container);

    expect(getFocusableElements(container).map((el) => el.textContent?.trim())).toEqual([
      'Real1',
      'Real2',
    ]);

    container.remove();
  });

  it('excludes elements inside an aria-hidden ancestor', () => {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('aria-hidden', 'true');
    const target = document.createElement('button');
    target.id = 'target';
    wrapper.appendChild(target);
    document.body.appendChild(wrapper);

    expect(isFocusable(target)).toBe(false);

    wrapper.remove();
  });

  it('reclaims focus on a plain Tab when focus has already escaped the container', () => {
    const container = document.createElement('div');
    container.tabIndex = -1;
    const first = document.createElement('button');
    const last = document.createElement('button');
    container.append(first, last);
    document.body.appendChild(container);
    const trap = createFocusTrap(container, document);

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();

    const forward = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    trap.handleKeydown(forward);
    expect(forward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);

    outside.focus();
    const backward = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    trap.handleKeydown(backward);
    expect(document.activeElement).toBe(last);

    trap.destroy();
    outside.remove();
    container.remove();
  });

  it('makes a tabindex-less container script-focusable before falling back to it with zero focusable descendants', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    expect(container.hasAttribute('tabindex')).toBe(false);
    expect(focusInitialElement(container)).toBe(container);
    expect(document.activeElement).toBe(container);

    container.remove();
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
