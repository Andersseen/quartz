import { Injectable, TemplateRef, ViewContainerRef, inject, DOCUMENT, EmbeddedViewRef } from '@angular/core';
import { DialogConfig, DEFAULT_DIALOG_CONFIG, DialogPosition } from './dialog.types';
import { DialogRef } from './dialog-ref';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private document = inject(DOCUMENT);
  #openDialogs = new Set<DialogRef>();

  open(
    templateRef: TemplateRef<unknown>,
    viewContainerRef: ViewContainerRef,
    config: Partial<DialogConfig> = {}
  ): DialogRef {
    const resolvedConfig: DialogConfig = { ...DEFAULT_DIALOG_CONFIG, ...config };

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
      this.#performClose(ref, backdropEl, wrapperEl, viewRef, onKeyDown);
    });

    // -- Render template with DialogRef as $implicit context --------------------
    const viewRef = viewContainerRef.createEmbeddedView(
      templateRef as TemplateRef<{ $implicit: DialogRef }>,
      { $implicit: ref }
    );
    viewRef.detectChanges();

    for (const node of viewRef.rootNodes) {
      if (node instanceof HTMLElement) panelEl.appendChild(node);
    }
    wrapperEl.appendChild(panelEl);

    // -- Scroll lock -------------------------------------------------------------
    if (this.#openDialogs.size === 0) {
      this.document.body.style.overflow = 'hidden';
    }
    this.#openDialogs.add(ref);

    // -- Event listeners --------------------------------------------------------
    if (resolvedConfig.closeOnBackdropClick && backdropEl) {
      backdropEl.addEventListener('click', () => ref.close(), { once: true });
    }

    onKeyDown = (event: KeyboardEvent) => {
      if (resolvedConfig.closeOnEscape && event.key === 'Escape') ref.close();
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
    if (Array.isArray(value)) return value.flatMap(c => c.split(/\s+/).filter(Boolean));
    return value.split(/\s+/).filter(Boolean);
  }

  #performClose(
    ref: DialogRef,
    backdrop: HTMLElement | null,
    wrapper: HTMLElement,
    view: EmbeddedViewRef<unknown>,
    onKeyDown: (e: KeyboardEvent) => void
  ): void {
    if (!this.#openDialogs.has(ref)) return;
    this.#openDialogs.delete(ref);
    this.document.removeEventListener('keydown', onKeyDown);
    backdrop?.remove();
    wrapper.remove();
    view.destroy();
    if (this.#openDialogs.size === 0) {
      this.document.body.style.overflow = '';
    }
  }
}
