export const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
  '[contenteditable]:not([contenteditable="false"])',
  'audio[controls]',
  'video[controls]',
  'summary:not([tabindex="-1"])',
  'details[tabindex]:not([tabindex="-1"]) summary',
].join(', ');

export interface FocusTrap {
  handleKeydown(event: KeyboardEvent): void;
  destroy(): void;
}

export interface FocusRestorer {
  restore(): void;
}

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => isFocusable(el) && !hasNegativeTabIndex(el),
  );
}

// Checks the `tabindex` attribute directly rather than the live `tabIndex` IDL property:
// several of FOCUSABLE_SELECTOR's native-tag branches (button, [href], contenteditable, ...)
// don't themselves exclude an explicit tabindex="-1", and jsdom's `tabIndex` getter doesn't
// implement the implicit tabIndex=0 default for contenteditable hosts — reading the attribute
// avoids both problems and matches the actual intent: exclude only an *explicit* negative value.
function hasNegativeTabIndex(el: HTMLElement): boolean {
  const explicit = el.getAttribute('tabindex');
  return explicit !== null && Number(explicit) < 0;
}

/**
 * Whether `element` can receive *programmatic* focus (`element.focus()`) right now.
 *
 * - Must be connected, and match the focusable selector or carry a `tabindex` attribute
 *   (so `tabindex="-1"` is a valid script-focus target; a plain `<div>` is not).
 * - Excluded: `disabled` itself or inside a disabled `<fieldset>`, `hidden`/`inert`/
 *   `aria-hidden="true"` ancestors, `display: none` on the element or any ancestor, and
 *   `visibility: hidden`.
 *
 * Sequential (Tab) reachability is stricter — see `getFocusableElements`, which also drops
 * negative tabindex.
 */
export function isFocusable(element: HTMLElement): boolean {
  if (!element.isConnected) return false;
  if (element.hasAttribute('disabled')) return false;
  if (!matchesFocusTarget(element)) return false;
  if (element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
  if (isInDisabledFieldset(element)) return false;
  const view = element.ownerDocument.defaultView;
  if (!view) return true;
  if (view.getComputedStyle(element).visibility === 'hidden') return false;
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    if (view.getComputedStyle(node).display === 'none') return false;
  }
  return true;
}

function matchesFocusTarget(element: HTMLElement): boolean {
  if (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'hidden') return false;
  return element.hasAttribute('tabindex') || element.matches(FOCUSABLE_SELECTOR);
}

// A control inside `<fieldset disabled>` is disabled unless it sits in the fieldset's first
// `<legend>`.
function isInDisabledFieldset(element: HTMLElement): boolean {
  for (
    let fieldset = element.parentElement?.closest('fieldset[disabled]') ?? null;
    fieldset;
    fieldset = fieldset.parentElement?.closest('fieldset[disabled]') ?? null
  ) {
    const legend = Array.from(fieldset.children).find((child) => child.tagName === 'LEGEND');
    if (!legend?.contains(element)) return true;
  }
  return false;
}

function ensureScriptFocusable(container: HTMLElement): void {
  if (!container.hasAttribute('tabindex')) {
    container.tabIndex = -1;
  }
}

export function focusInitialElement(container: HTMLElement): HTMLElement | null {
  const target = getFocusableElements(container)[0];
  if (!target) {
    ensureScriptFocusable(container);
    return focusSafely(container);
  }
  return focusSafely(target);
}

export function focusSafely(element: HTMLElement | null | undefined): HTMLElement | null {
  if (!element?.ownerDocument.defaultView) return null;
  if (!isFocusable(element)) return null;
  try {
    element.focus();
    return element.ownerDocument.activeElement === element ? element : null;
  } catch {
    return null;
  }
}

/**
 * Captures the currently focused element and returns a restorer for it. `restore()` is a
 * no-op when the captured element was removed from the document, became unfocusable, or was
 * never a real target (`body`/`documentElement`) — it never throws and never reclaims focus
 * for a destroyed target.
 */
export function createFocusRestorer(document: Document): FocusRestorer {
  const previous = document.defaultView ? (document.activeElement as HTMLElement | null) : null;
  return {
    restore: () => {
      if (!previous?.isConnected) return;
      focusSafely(previous);
    },
  };
}

/**
 * Overlay content is rendered in a portal under this container. A focus trap treats focus
 * inside it as belonging to a child popup (menu, select, popover) owned by the trapped layer,
 * so it must not yank focus back into its own container.
 */
const RELATED_PORTAL_SELECTOR = '[data-qz-overlay-container]';

// Traps are scoped per Document; only the most recently created, still-active trap handles
// Tab so stacked modals never compete for the same event.
const trapsByDocument = new WeakMap<Document, object[]>();

export function createFocusTrap(container: HTMLElement, document: Document): FocusTrap {
  const token = {};
  let stack = trapsByDocument.get(document);
  if (!stack) {
    stack = [];
    trapsByDocument.set(document, stack);
  }
  stack.push(token);
  const isActiveTrap = () => {
    const current = trapsByDocument.get(document);
    return !!current && current[current.length - 1] === token;
  };

  return {
    handleKeydown(event: KeyboardEvent): void {
      if (event.key !== 'Tab') return;
      if (!document.defaultView) return;
      if (!isActiveTrap()) return;

      const active = document.activeElement;
      if (active && !container.contains(active) && active.closest(RELATED_PORTAL_SELECTOR)) return;

      const focusable = getFocusableElements(container);
      if (!focusable.length) {
        event.preventDefault();
        ensureScriptFocusable(container);
        focusSafely(container);
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault();
        focusSafely(last);
        return;
      }

      if (!event.shiftKey && (active === last || !container.contains(active))) {
        event.preventDefault();
        focusSafely(first);
      }
    },
    destroy(): void {
      const current = trapsByDocument.get(document);
      const index = current?.indexOf(token) ?? -1;
      if (index !== -1) current!.splice(index, 1);
    },
  };
}
