import {
  Injectable,
  TemplateRef,
  ViewContainerRef,
  inject,
  DOCUMENT,
  EmbeddedViewRef,
} from '@angular/core';
import { DialogConfig, DEFAULT_DIALOG_CONFIG, DialogPosition } from './dialog.types';
import { DialogRef } from './dialog-ref';
import {
  createDismissController,
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
  #originalBodyOverflow = '';

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
        'background:rgba(0,0,0,0.55)',
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
        focusRestorer,
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

    for (const node of viewRef.rootNodes) {
      if (node instanceof HTMLElement) panelEl.appendChild(node);
    }
    wrapperEl.appendChild(panelEl);

    // A configured id is applied as-is (it may point anywhere in the document). A
    // *generated* fallback id is only useful once the consumer has bound it to a title /
    // description element in the template, so it is applied only when that element exists
    // — a dangling reference gives the dialog no accessible name at all.
    this.#applyAriaReference(
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

    // -- Focus management -------------------------------------------------------
    focusInitialElement(panelEl);
    focusTrap = createFocusTrap(panelEl, this.document);

    // -- Scroll lock -------------------------------------------------------------
    if (this.#openDialogs.size === 0) {
      this.#originalBodyOverflow = this.document.body.style.overflow;
      this.document.body.style.overflow = 'hidden';
    }
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
    focusRestorer: { restore(): void },
  ): void {
    if (!this.#openDialogs.has(ref)) return;
    this.#openDialogs.delete(ref);
    dismissController?.destroy();
    if (focusTrap) {
      this.document.removeEventListener('keydown', focusTrap.handleKeydown, true);
      focusTrap.destroy();
    }
    backdrop?.remove();
    wrapper.remove();
    view.destroy();
    if (this.#openDialogs.size === 0) {
      this.document.body.style.overflow = this.#originalBodyOverflow;
      this.#originalBodyOverflow = '';
    }
    focusRestorer.restore();
  }

  #applyAriaReference(
    panel: HTMLElement,
    attribute: string,
    id: string,
    isExplicit: boolean,
  ): void {
    if (!isExplicit && !panel.querySelector(`[id="${id}"]`)) return;
    panel.setAttribute(attribute, id);
  }
}
