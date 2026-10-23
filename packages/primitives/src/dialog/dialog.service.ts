import {
  Injectable,
  TemplateRef,
  ViewContainerRef,
  inject,
  DOCUMENT,
  EmbeddedViewRef,
  isDevMode,
} from '@angular/core';
import { DialogConfig, DEFAULT_DIALOG_CONFIG, DialogPosition } from './dialog.types';
import { DialogRef } from './dialog-ref';
import { isolateBackground, type ModalIsolation } from './modal-isolation';
import {
  createDismissController,
  createScrollLock,
  type DismissController,
  createFocusRestorer,
  createFocusTrap,
  focusInitialElement,
  type FocusTrap,
} from '@quartz-headless/core';

let dialogId = 0;

@Injectable({ providedIn: 'root' })
export class DialogService {
  private document = inject(DOCUMENT);
  #openDialogs = new Set<DialogRef>();
  #scrollLock = createScrollLock(this.document);

  open(
    templateRef: TemplateRef<unknown>,
    viewContainerRef: ViewContainerRef,
    config: Partial<DialogConfig> = {},
  ): DialogRef {
    const resolvedConfig: DialogConfig = { ...DEFAULT_DIALOG_CONFIG, ...config };

    // SSR guard: do not manipulate the DOM when there is no browser window.
    // Return a closed no-op ref so consumers can still subscribe to closed$ safely.
    if (!this.document.defaultView) {
      const noOpRef = new DialogRef(() => void 0);
      noOpRef.close();
      return noOpRef;
    }

    const instanceId = ++dialogId;
    const ariaLabelledBy = resolvedConfig.ariaLabelledBy ?? `qz-dialog-title-${instanceId}`;
    const ariaDescribedBy = resolvedConfig.ariaDescribedBy ?? `qz-dialog-desc-${instanceId}`;

    // -- Backdrop ----------------------------------------------------------------
    let backdropEl: HTMLElement | null = null;
    if (resolvedConfig.backdrop) {
      backdropEl = this.document.createElement('div');
      backdropEl.setAttribute('data-qz-dialog-backdrop', '');
      backdropEl.style.cssText = [
        'position:fixed',
        'inset:0',
        'z-index:9998',
        'pointer-events:auto',
      ].join(';');
      if (resolvedConfig.backdropClass) {
        backdropEl.classList.add(...this.#toClassList(resolvedConfig.backdropClass));
      }
      this.document.body.appendChild(backdropEl);
    }

    // -- Panel wrapper -----------------------------------------------------------
    const wrapperEl = this.document.createElement('div');
    wrapperEl.setAttribute('data-qz-dialog-wrapper', '');
    wrapperEl.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:9999',
      'pointer-events:none',
      'display:flex',
    ].join(';');
    this.#applyPositionStyles(wrapperEl, resolvedConfig.position);
    this.document.body.appendChild(wrapperEl);

    // -- Panel element -----------------------------------------------------------
    const panelEl = this.document.createElement('div');
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-modal', 'true');
    // Focus target of last resort: a dialog with no focusable content must still take
    // focus, or the user keeps tabbing through the page behind the modal.
    panelEl.setAttribute('tabindex', '-1');
    panelEl.style.cssText = [
      'pointer-events:auto',
      'max-width:100%',
      'max-height:100%',
      'overflow:auto',
    ].join(';');
    if (resolvedConfig.width) panelEl.style.width = resolvedConfig.width;
    if (resolvedConfig.height) panelEl.style.height = resolvedConfig.height;
    if (resolvedConfig.panelClass) {
      panelEl.classList.add(...this.#toClassList(resolvedConfig.panelClass));
    }

    // -- Build DialogRef (cleanup uses closures captured above) -----------------
    let focusTrap: FocusTrap | null = null;
    let dismissController: DismissController | null = null;
    let isolation: ModalIsolation | null = null;
    let viewDestroying = false;
    const focusRestorer = createFocusRestorer(this.document);
    let viewRef!: EmbeddedViewRef<unknown>;

    const ref = new DialogRef(() => {
      this.#performClose(
        ref,
        backdropEl,
        wrapperEl,
        viewRef,
        focusTrap,
        dismissController,
        isolation,
        focusRestorer,
        viewDestroying,
      );
    });

    // -- Render template with DialogRef as $implicit context --------------------
    viewRef = viewContainerRef.createEmbeddedView(
      templateRef as TemplateRef<{
        $implicit: DialogRef;
        ariaLabelledBy: string;
        ariaDescribedBy: string;
      }>,
      { $implicit: ref, ariaLabelledBy, ariaDescribedBy },
    );
    viewRef.detectChanges();
    // Safety net: if the host ViewContainerRef is destroyed while the dialog is still open
    // (e.g. a router navigation away from the host), Angular tears down viewRef directly
    // without going through DialogRef#close() — without this, the backdrop/wrapper, scroll
    // lock, and document keydown listener would all leak permanently, and closed$ would
    // never fire. ref.close() is idempotent, so this is a no-op when already closed.
    viewRef.onDestroy(() => {
      viewDestroying = true;
      ref.close();
    });

    for (const node of viewRef.rootNodes) {
      if (node instanceof HTMLElement) panelEl.appendChild(node);
    }
    wrapperEl.appendChild(panelEl);

    // Accessible name / description. A reference is only written when its target exists, so the
    // dialog never carries a dangling `aria-labelledby`: a configured id must resolve somewhere
    // in the document, a generated fallback id must have been bound inside the template.
    const labelled = this.#applyAriaReference(
      panelEl,
      'aria-labelledby',
      ariaLabelledBy,
      !!resolvedConfig.ariaLabelledBy,
    );
    this.#applyAriaReference(
      panelEl,
      'aria-describedby',
      ariaDescribedBy,
      !!resolvedConfig.ariaDescribedBy,
    );
    if (!labelled && resolvedConfig.ariaLabel) {
      panelEl.setAttribute('aria-label', resolvedConfig.ariaLabel);
    }
    if (!panelEl.hasAttribute('aria-labelledby') && !panelEl.hasAttribute('aria-label')) {
      this.#warnUnnamed();
    }

    // -- Modal isolation -----------------------------------------------------------
    // Backdrop and wrapper stay live; everything else that was in the document is inert until
    // this dialog closes. Overlay panels opened later from inside the dialog stay interactive.
    isolation = isolateBackground(this.document, [backdropEl, wrapperEl]);

    // -- Focus management -------------------------------------------------------
    focusInitialElement(panelEl);
    focusTrap = createFocusTrap(panelEl, this.document);

    // -- Scroll lock -------------------------------------------------------------
    this.#scrollLock.lock();
    this.#openDialogs.add(ref);

    // -- Event listeners --------------------------------------------------------
    dismissController = createDismissController({
      document: this.document,
      escape: resolvedConfig.closeOnEscape,
      outsidePointer: resolvedConfig.closeOnBackdropClick,
      rootElements: () => [panelEl],
      onDismiss: (reason, event) => {
        if (reason === 'outside-pointer' && backdropEl && event.target !== backdropEl) return;
        ref.close();
      },
    });
    this.document.addEventListener('keydown', focusTrap.handleKeydown, true);

    return ref;
  }

  #applyPositionStyles(el: HTMLElement, position: DialogPosition): void {
    const s = el.style;
    switch (position) {
      case 'center':
        s.alignItems = 'center';
        s.justifyContent = 'center';
        break;
      case 'left':
        s.alignItems = 'stretch';
        s.justifyContent = 'flex-start';
        break;
      case 'right':
        s.alignItems = 'stretch';
        s.justifyContent = 'flex-end';
        break;
      case 'top':
        s.flexDirection = 'column';
        s.alignItems = 'stretch';
        s.justifyContent = 'flex-start';
        break;
      case 'bottom':
        s.flexDirection = 'column';
        s.alignItems = 'stretch';
        s.justifyContent = 'flex-end';
        break;
    }
  }

  #toClassList(value: string | string[]): string[] {
    if (Array.isArray(value)) return value.flatMap((c) => c.split(/\s+/).filter(Boolean));
    return value.split(/\s+/).filter(Boolean);
  }

  #performClose(
    ref: DialogRef,
    backdrop: HTMLElement | null,
    wrapper: HTMLElement,
    view: EmbeddedViewRef<unknown>,
    focusTrap: FocusTrap | null,
    dismissController: DismissController | null,
    isolation: ModalIsolation | null,
    focusRestorer: { restore(): void },
    viewDestroying: boolean,
  ): void {
    if (!this.#openDialogs.has(ref)) return;
    this.#openDialogs.delete(ref);
    dismissController?.destroy();
    if (focusTrap) {
      this.document.removeEventListener('keydown', focusTrap.handleKeydown, true);
      focusTrap.destroy();
    }
    // Restore focus only if this dialog still owns it (or focus was lost to <body>). Closing
    // a lower dialog out of order, or while a child popup/dialog holds focus, must not pull
    // focus away from the layer the user is actually in.
    const active = this.document.activeElement;
    const ownsFocus =
      !active ||
      active === this.document.body ||
      active === this.document.documentElement ||
      wrapper.contains(active);
    backdrop?.remove();
    wrapper.remove();
    // Never destroy a view Angular is already destroying: re-entrant destruction detaches it
    // mid-walk and makes Angular skip the cleanup of its ancestors.
    if (!viewDestroying) view.destroy();
    this.#scrollLock.unlock();
    // The background must be live again before focus returns to an opener that lives in it.
    isolation?.release();
    if (ownsFocus) focusRestorer.restore();
  }

  /** Returns whether the reference was written. */
  #applyAriaReference(
    panel: HTMLElement,
    attribute: string,
    id: string,
    isExplicit: boolean,
  ): boolean {
    const target = isExplicit
      ? this.document.getElementById(id)
      : panel.querySelector(`[id="${id}"]`);
    if (!target) return false;
    panel.setAttribute(attribute, id);
    return true;
  }

  #warnUnnamed(): void {
    if (!isDevMode()) return;
    console.warn(
      '[quartz] Dialog has no accessible name. Bind the `ariaLabelledBy` template context value ' +
        'to a title element, pass `ariaLabelledBy` / `ariaLabel` in the dialog config.',
    );
  }
}
