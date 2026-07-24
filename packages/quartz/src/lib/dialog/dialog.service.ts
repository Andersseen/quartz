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

let dialogId = 0;

const FOCUSABLE_SELECTOR = [
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
    panelEl.setAttribute('aria-labelledby', ariaLabelledBy);
    if (ariaDescribedBy) {
      panelEl.setAttribute('aria-describedby', ariaDescribedBy);
    }
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
    let onKeyDown!: (e: KeyboardEvent) => void;

    const ref = new DialogRef(() => {
      this.#performClose(ref, backdropEl, wrapperEl, viewRef, onKeyDown, previousActiveElement);
    });

    // -- Render template with DialogRef as $implicit context --------------------
    const viewRef = viewContainerRef.createEmbeddedView(
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

    // -- Focus management -------------------------------------------------------
    const previousActiveElement = this.document.activeElement as HTMLElement | null;
    this.#focusFirstFocusable(panelEl);

    // -- Scroll lock -------------------------------------------------------------
    if (this.#openDialogs.size === 0) {
      this.#originalBodyOverflow = this.document.body.style.overflow;
      this.document.body.style.overflow = 'hidden';
    }
    this.#openDialogs.add(ref);

    // -- Event listeners --------------------------------------------------------
    if (resolvedConfig.closeOnBackdropClick && backdropEl) {
      backdropEl.addEventListener('click', () => ref.close(), { once: true });
    }

    onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!resolvedConfig.closeOnEscape) return;
        const dialogs = [...this.#openDialogs];
        if (dialogs[dialogs.length - 1] === ref) ref.close();
        return;
      }
      if (event.key === 'Tab') {
        this.#trapFocus(panelEl, event);
      }
    };
    this.document.addEventListener('keydown', onKeyDown);

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
    onKeyDown: (e: KeyboardEvent) => void,
    previousActiveElement: HTMLElement | null,
  ): void {
    if (!this.#openDialogs.has(ref)) return;
    this.#openDialogs.delete(ref);
    this.document.removeEventListener('keydown', onKeyDown);
    backdrop?.remove();
    wrapper.remove();
    view.destroy();
    if (this.#openDialogs.size === 0) {
      this.document.body.style.overflow = this.#originalBodyOverflow;
      this.#originalBodyOverflow = '';
    }
    previousActiveElement?.focus();
  }

  #focusFirstFocusable(panel: HTMLElement): void {
    const first = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    first?.focus();
  }

  #trapFocus(panel: HTMLElement, event: KeyboardEvent): void {
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey) {
      if (this.document.activeElement === first) {
        last.focus();
        event.preventDefault();
      }
    } else {
      if (this.document.activeElement === last) {
        first.focus();
        event.preventDefault();
      }
    }
  }
}
