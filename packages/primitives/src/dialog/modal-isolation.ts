/**
 * Background isolation for modal dialogs (internal — not exported from the package).
 *
 * A modal makes everything outside itself inert. Instead of marking `document.body`, it marks the
 * *siblings along the path* from each kept element up to `<html>`, so the dialog and the portals
 * it owns stay operable:
 *
 * - the dialog's own backdrop and wrapper;
 * - Quartz-owned portals: the shared overlay container (Menu / Popover / Select / Tooltip
 *   panels), text tooltips and the Toast portal.
 *
 * Overlay wrappers that were already open when the modal opened are *not* owned by it: they are
 * marked individually, while wrappers opened afterwards (from inside the modal) stay interactive.
 *
 * State is reference-counted per element and per Document, so nested modals, out-of-order closes
 * and unrelated pre-existing `inert` / `aria-hidden` values all restore exactly. Browsers without
 * native `inert` fall back to `aria-hidden="true"` on the same elements.
 */

/** Quartz portals that are always allowed to stay interactive inside a modal. */
const OWNED_PORTAL_SELECTOR = '[data-qz-overlay-container], [data-qz-tooltip], .qz-toast-portal';

/** Dialog layers belong to whichever modal created them; never treated as stray background. */
const DIALOG_LAYER_SELECTOR = '[data-qz-dialog-wrapper], [data-qz-dialog-backdrop]';

const NON_RENDERED_TAGS = new Set([
  'HEAD',
  'SCRIPT',
  'STYLE',
  'LINK',
  'META',
  'TEMPLATE',
  'NOSCRIPT',
]);

interface Hold {
  count: number;
  /** The element was already `inert` before Quartz touched it — leave it alone on release. */
  hadInert: boolean;
  /** Original `aria-hidden` when the fallback overwrote it (`undefined` = fallback not used). */
  ariaHidden?: string | null;
}

const holdsByDocument = new WeakMap<Document, Map<Element, Hold>>();

export interface ModalIsolation {
  /** Restores every element this isolation touched. Safe to call more than once. */
  release(): void;
}

export function isolateBackground(
  document: Document,
  keep: readonly (HTMLElement | null | undefined)[],
): ModalIsolation {
  const view = document.defaultView;
  const kept = keep.filter((el): el is HTMLElement => !!el && el.isConnected);
  if (!view || !document.body || !kept.length) return { release() {} };

  const holds = getHolds(document);
  const nativeInert = 'inert' in view.HTMLElement.prototype;
  const touched = new Set<Element>();

  // At open time another modal's layers are background; a layer that *appears later* belongs to
  // a modal opened after this one, which isolates this one itself.
  const isOwned = (el: Element, laterDialogLayer = false) =>
    kept.includes(el as HTMLElement) ||
    el.matches(OWNED_PORTAL_SELECTOR) ||
    (laterDialogLayer && el.matches(DIALOG_LAYER_SELECTOR)) ||
    NON_RENDERED_TAGS.has(el.tagName);

  const isolate = (el: Element) => {
    if (touched.has(el)) return;
    touched.add(el);
    const existing = holds.get(el);
    if (existing) {
      existing.count++;
      return;
    }
    const hold: Hold = { count: 1, hadInert: el.hasAttribute('inert') };
    if (!hold.hadInert) el.setAttribute('inert', '');
    if (!nativeInert) {
      hold.ariaHidden = el.getAttribute('aria-hidden');
      el.setAttribute('aria-hidden', 'true');
    }
    holds.set(el, hold);
  };

  // Strict ancestors of every kept element (up to <html>) are the only nodes whose children are
  // candidates for isolation. Ancestors stay un-inert, otherwise the dialog would be inert too.
  const ancestors = new Set<Element>();
  for (const el of [...kept, ...Array.from(document.querySelectorAll(OWNED_PORTAL_SELECTOR))]) {
    for (let node = el.parentElement; node; node = node.parentElement) ancestors.add(node);
  }

  for (const ancestor of ancestors) {
    for (const child of Array.from(ancestor.children)) {
      if (!ancestors.has(child) && !isOwned(child)) isolate(child);
    }
  }

  // Overlays already open belong to somebody else: isolate their wrappers but keep the container.
  for (const container of Array.from(document.querySelectorAll('[data-qz-overlay-container]'))) {
    for (const wrapper of Array.from(container.children)) isolate(wrapper);
  }

  // Siblings that appear while the modal is open (dynamic route content, third-party portals).
  let observer: MutationObserver | null = null;
  if (view.MutationObserver) {
    observer = new view.MutationObserver((records) => {
      for (const record of records) {
        for (const node of Array.from(record.addedNodes)) {
          // Skip nodes that already moved on: Angular inserts a template's root nodes next to
          // its host before Dialog / Overlay re-parent them into their own wrapper, and the
          // observer callback runs after that move.
          if (node.nodeType !== 1 || node.parentNode !== record.target) continue;
          if (!isOwned(node as Element, true)) isolate(node as Element);
        }
      }
    });
    for (const ancestor of ancestors) observer.observe(ancestor, { childList: true });
  }

  let released = false;
  return {
    release() {
      if (released) return;
      released = true;
      observer?.disconnect();
      observer = null;
      for (const el of touched) {
        const hold = holds.get(el);
        if (!hold || --hold.count > 0) continue;
        holds.delete(el);
        if (!hold.hadInert) el.removeAttribute('inert');
        if (hold.ariaHidden !== undefined) {
          if (hold.ariaHidden === null) el.removeAttribute('aria-hidden');
          else el.setAttribute('aria-hidden', hold.ariaHidden);
        }
      }
      touched.clear();
    },
  };
}

function getHolds(document: Document): Map<Element, Hold> {
  let holds = holdsByDocument.get(document);
  if (!holds) {
    holds = new Map();
    holdsByDocument.set(document, holds);
  }
  return holds;
}
