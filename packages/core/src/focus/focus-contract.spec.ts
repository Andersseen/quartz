import { afterEach, describe, expect, it } from 'vitest';
import {
  createFocusRestorer,
  createFocusTrap,
  focusSafely,
  getFocusableElements,
  isFocusable,
} from './focus';

function mount(html: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

function tab(trap: { handleKeydown(e: KeyboardEvent): void }, shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true });
  trap.handleKeydown(event);
  return event;
}

describe('focus contract', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('isFocusable (programmatic focus target)', () => {
    it('rejects non-interactive elements without tabindex', () => {
      const host = mount('<div id="plain">x</div><span id="s">y</span>');
      expect(isFocusable(host.querySelector<HTMLElement>('#plain')!)).toBe(false);
      expect(isFocusable(host.querySelector<HTMLElement>('#s')!)).toBe(false);
    });

    it('accepts native controls, tabindex=0 and tabindex=-1 (script focus)', () => {
      const host = mount(
        '<button id="b">b</button><div id="z" tabindex="0"></div><div id="n" tabindex="-1"></div>',
      );
      for (const id of ['b', 'z', 'n']) {
        expect(isFocusable(host.querySelector<HTMLElement>(`#${id}`)!)).toBe(true);
      }
    });

    it('rejects detached elements', () => {
      const button = document.createElement('button');
      expect(isFocusable(button)).toBe(false);
    });

    it('rejects disabled controls, hidden inputs and disabled-fieldset descendants', () => {
      const host = mount(`
        <button id="d" disabled></button>
        <input id="h" type="hidden" />
        <fieldset disabled><input id="f" /></fieldset>
        <fieldset disabled><legend><input id="l" /></legend></fieldset>`);
      expect(isFocusable(host.querySelector<HTMLElement>('#d')!)).toBe(false);
      expect(isFocusable(host.querySelector<HTMLElement>('#h')!)).toBe(false);
      expect(isFocusable(host.querySelector<HTMLElement>('#f')!)).toBe(false);
      expect(isFocusable(host.querySelector<HTMLElement>('#l')!)).toBe(true);
    });

    it('rejects elements under display:none, hidden, inert and aria-hidden ancestors', () => {
      const host = mount(`
        <div style="display:none"><button id="a"></button></div>
        <div hidden><button id="b"></button></div>
        <div inert><button id="c"></button></div>
        <div aria-hidden="true"><button id="d"></button></div>
        <button id="e" style="visibility:hidden"></button>`);
      for (const id of ['a', 'b', 'c', 'd', 'e']) {
        expect(isFocusable(host.querySelector<HTMLElement>(`#${id}`)!)).toBe(false);
      }
    });
  });

  describe('getFocusableElements (sequential / Tab order)', () => {
    it('excludes tabindex=-1 and plain elements, includes tabindex=0', () => {
      const host = mount(
        '<button>a</button><div tabindex="-1">b</div><div>c</div><div tabindex="0">d</div>',
      );
      expect(getFocusableElements(host).map((e) => e.textContent)).toEqual(['a', 'd']);
    });

    it('returns an empty list for a zero-focusable container', () => {
      expect(getFocusableElements(mount('<p>text</p>'))).toEqual([]);
    });
  });

  describe('createFocusRestorer', () => {
    it('restores the captured element', () => {
      const host = mount('<button id="a"></button><button id="b"></button>');
      const a = host.querySelector<HTMLElement>('#a')!;
      a.focus();
      const restorer = createFocusRestorer(document);
      host.querySelector<HTMLElement>('#b')!.focus();
      restorer.restore();
      expect(document.activeElement).toBe(a);
    });

    it('does not reclaim focus for a removed target', () => {
      const host = mount('<button id="a"></button><button id="b"></button>');
      const a = host.querySelector<HTMLElement>('#a')!;
      const b = host.querySelector<HTMLElement>('#b')!;
      a.focus();
      const restorer = createFocusRestorer(document);
      b.focus();
      a.remove();
      expect(() => restorer.restore()).not.toThrow();
      expect(document.activeElement).toBe(b);
    });

    it('is a no-op when nothing meaningful was focused (body)', () => {
      const host = mount('<button id="b"></button>');
      const restorer = createFocusRestorer(document);
      const b = host.querySelector<HTMLElement>('#b')!;
      b.focus();
      restorer.restore();
      expect(document.activeElement).toBe(b);
    });
  });

  describe('focusSafely', () => {
    it('returns null for a non-focusable plain element', () => {
      const host = mount('<div id="p"></div>');
      expect(focusSafely(host.querySelector<HTMLElement>('#p')!)).toBeNull();
    });
  });

  describe('createFocusTrap stacking', () => {
    it('only the most recent trap handles Tab; the lower one yields', () => {
      const lower = mount('<button id="l1">l1</button><button id="l2">l2</button>');
      const upper = mount('<button id="u1">u1</button><button id="u2">u2</button>');
      const lowerTrap = createFocusTrap(lower, document);
      const upperTrap = createFocusTrap(upper, document);
      upper.querySelector<HTMLElement>('#u2')!.focus();

      const lowerEvent = tab(lowerTrap);
      expect(lowerEvent.defaultPrevented).toBe(false);
      expect(document.activeElement?.id).toBe('u2');

      const upperEvent = tab(upperTrap);
      expect(upperEvent.defaultPrevented).toBe(true);
      expect(document.activeElement?.id).toBe('u1');

      upperTrap.destroy();
      lower.querySelector<HTMLElement>('#l2')!.focus();
      expect(tab(lowerTrap).defaultPrevented).toBe(true);
      expect(document.activeElement?.id).toBe('l1');
      lowerTrap.destroy();
    });

    it('closing traps out of order keeps the remaining top trap active; destroy is idempotent', () => {
      const a = mount('<button id="a1">a1</button>');
      const b = mount('<button id="b1">b1</button>');
      const trapA = createFocusTrap(a, document);
      const trapB = createFocusTrap(b, document);
      trapA.destroy();
      trapA.destroy();
      b.querySelector<HTMLElement>('#b1')!.focus();
      expect(tab(trapB).defaultPrevented).toBe(true);
      trapB.destroy();
    });

    it('wraps Shift+Tab from the first element to the last', () => {
      const host = mount('<button id="x">x</button><button id="y">y</button>');
      const trap = createFocusTrap(host, document);
      host.querySelector<HTMLElement>('#x')!.focus();
      expect(tab(trap, true).defaultPrevented).toBe(true);
      expect(document.activeElement?.id).toBe('y');
      trap.destroy();
    });

    it('keeps focus on the container when it has no focusable children', () => {
      const host = mount('<p>text</p>');
      const trap = createFocusTrap(host, document);
      expect(tab(trap).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(host);
      trap.destroy();
    });

    it('does not pull focus back from a related overlay portal', () => {
      const host = mount('<button id="in">in</button>');
      const portal = document.createElement('div');
      portal.setAttribute('data-qz-overlay-container', '');
      portal.innerHTML = '<button id="pop">pop</button>';
      document.body.appendChild(portal);
      const trap = createFocusTrap(host, document);
      portal.querySelector<HTMLElement>('#pop')!.focus();
      expect(tab(trap).defaultPrevented).toBe(false);
      expect(document.activeElement?.id).toBe('pop');
      trap.destroy();
    });
  });
});
