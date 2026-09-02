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

export function isFocusable(element: HTMLElement): boolean {
  if (element.hasAttribute('disabled')) return false;
  if (element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
  return true;
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

export function createFocusRestorer(document: Document): FocusRestorer {
  const previous = document.defaultView ? (document.activeElement as HTMLElement | null) : null;
  return {
    restore: () => focusSafely(previous),
  };
}

export function createFocusTrap(container: HTMLElement, document: Document): FocusTrap {
  return {
    handleKeydown(event: KeyboardEvent): void {
      if (event.key !== 'Tab') return;
      if (!document.defaultView) return;

      const focusable = getFocusableElements(container);
      if (!focusable.length) {
        event.preventDefault();
        ensureScriptFocusable(container);
        focusSafely(container);
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

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
      // Stateless trap: exposed for API symmetry with listener-backed foundations.
    },
  };
}
