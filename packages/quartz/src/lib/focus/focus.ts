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
    isFocusable,
  );
}

export function isFocusable(element: HTMLElement): boolean {
  if (element.hasAttribute('disabled')) return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;
  if (element.closest('[hidden], [inert]')) return false;
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
  return true;
}

export function focusInitialElement(container: HTMLElement): HTMLElement | null {
  const target = getFocusableElements(container)[0] ?? container;
  return focusSafely(target);
}

export function focusSafely(element: HTMLElement | null | undefined): HTMLElement | null {
  if (!element?.ownerDocument.defaultView) return null;
  try {
    element.focus();
    return element;
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

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        focusSafely(first);
      }
    },
    destroy(): void {
      // Stateless trap: exposed for API symmetry with listener-backed foundations.
    },
  };
}
