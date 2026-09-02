import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { TemplateRef, ViewContainerRef } from '@angular/core';
import { DialogService } from './dialog.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('DialogService', () => {
  let service: DialogService;
  let document: Document;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [DialogService],
    });
    service = TestBed.inject(DialogService);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    document
      .querySelectorAll('[data-qz-dialog-backdrop], [data-qz-dialog-wrapper]')
      .forEach((el) => el.remove());
    document.body.style.overflow = '';
  });

  it('should create a dialog with backdrop and panel', () => {
    const panel = document.createElement('div');
    const { templateRef, viewContainerRef } = createTemplateMocks(panel);

    const ref = service.open(templateRef, viewContainerRef);

    const backdrop = document.querySelector('[data-qz-dialog-backdrop]');
    const wrapper = document.querySelector('[data-qz-dialog-wrapper]');

    expect(backdrop).not.toBeNull();
    expect(wrapper).not.toBeNull();
    expect(panel.parentElement?.getAttribute('role')).toBe('dialog');
    expect(panel.parentElement?.getAttribute('aria-modal')).toBe('true');

    ref.close();
  });

  it('keeps backdrop styles structural and does not impose a visual background', () => {
    const panel = document.createElement('div');
    const { templateRef, viewContainerRef } = createTemplateMocks(panel);

    const ref = service.open(templateRef, viewContainerRef);
    const backdrop = document.querySelector<HTMLElement>('[data-qz-dialog-backdrop]');

    expect(backdrop?.style.position).toBe('fixed');
    expect(backdrop?.style.pointerEvents).toBe('auto');
    expect(backdrop?.style.background).toBe('');

    ref.close();
  });

  it('should close when Escape is pressed', () => {
    const panel = document.createElement('div');
    const { templateRef, viewContainerRef } = createTemplateMocks(panel);
    const ref = service.open(templateRef, viewContainerRef);
    const closed = vi.fn();

    ref.closed$.subscribe(closed);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(closed).toHaveBeenCalled();
    expect(document.querySelector('[data-qz-dialog-wrapper]')).toBeNull();
  });

  it('should close when backdrop is clicked', () => {
    const panel = document.createElement('div');
    const { templateRef, viewContainerRef } = createTemplateMocks(panel);
    const ref = service.open(templateRef, viewContainerRef);
    const closed = vi.fn();

    ref.closed$.subscribe(closed);

    const backdrop = document.querySelector('[data-qz-dialog-backdrop]');
    backdrop?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

    expect(closed).toHaveBeenCalled();
    expect(document.querySelector('[data-qz-dialog-wrapper]')).toBeNull();
  });

  it('should lock body scroll while at least one dialog is open', () => {
    const panel = document.createElement('div');
    const { templateRef, viewContainerRef } = createTemplateMocks(panel);

    expect(document.body.style.overflow).toBe('');

    const ref1 = service.open(templateRef, viewContainerRef);
    expect(document.body.style.overflow).toBe('hidden');

    const ref2 = service.open(templateRef, viewContainerRef);
    expect(document.body.style.overflow).toBe('hidden');

    ref1.close();
    expect(document.body.style.overflow).toBe('hidden');

    ref2.close();
    expect(document.body.style.overflow).toBe('');
  });

  it('should only close the topmost dialog on Escape', () => {
    const panel = document.createElement('div');
    const { templateRef, viewContainerRef } = createTemplateMocks(panel);

    const ref1 = service.open(templateRef, viewContainerRef);
    const ref2 = service.open(templateRef, viewContainerRef);

    const closed1 = vi.fn();
    const closed2 = vi.fn();
    ref1.closed$.subscribe(closed1);
    ref2.closed$.subscribe(closed2);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(closed2).toHaveBeenCalled();
    expect(closed1).not.toHaveBeenCalled();

    ref1.close();
  });

  it('should restore focus to the previously focused element on close', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();

    const panel = document.createElement('div');
    const { templateRef, viewContainerRef } = createTemplateMocks(panel);

    const ref = service.open(templateRef, viewContainerRef);
    ref.close();

    expect(document.activeElement).toBe(button);

    document.body.removeChild(button);
  });

  it('should not create backdrop when backdrop option is false', () => {
    const panel = document.createElement('div');
    const { templateRef, viewContainerRef } = createTemplateMocks(panel);

    const ref = service.open(templateRef, viewContainerRef, { backdrop: false });

    expect(document.querySelector('[data-qz-dialog-backdrop]')).toBeNull();
    expect(document.querySelector('[data-qz-dialog-wrapper]')).not.toBeNull();

    ref.close();
  });

  it('should apply panel and backdrop classes', () => {
    const panel = document.createElement('div');
    const { templateRef, viewContainerRef } = createTemplateMocks(panel);

    const ref = service.open(templateRef, viewContainerRef, {
      panelClass: 'my-panel extra',
      backdropClass: ['my-backdrop', 'dim'],
    });

    const panelEl = document.querySelector('[role="dialog"]');
    const backdrop = document.querySelector('[data-qz-dialog-backdrop]');

    expect(panelEl?.classList.contains('my-panel')).toBe(true);
    expect(panelEl?.classList.contains('extra')).toBe(true);
    expect(backdrop?.classList.contains('my-backdrop')).toBe(true);
    expect(backdrop?.classList.contains('dim')).toBe(true);

    ref.close();
  });

  it('should not close on Tab key and should handle focus trap without throwing', () => {
    const firstButton = document.createElement('button');
    const lastLink = document.createElement('a');
    lastLink.setAttribute('href', '#');

    const panel = document.createElement('div');
    panel.appendChild(firstButton);
    panel.appendChild(lastLink);

    const { templateRef, viewContainerRef } = createTemplateMocks(panel);
    const ref = service.open(templateRef, viewContainerRef);
    const closed = vi.fn();
    ref.closed$.subscribe(closed);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
    );

    expect(closed).not.toHaveBeenCalled();
    expect(document.querySelector('[data-qz-dialog-wrapper]')).not.toBeNull();

    ref.close();
  });

  it('should expose DialogRef and ARIA IDs as template context', () => {
    const panel = document.createElement('div');
    let contextRef: unknown;

    const templateRef = {} as TemplateRef<unknown>;
    const viewContainerRef = {
      createEmbeddedView: (_tpl: TemplateRef<unknown>, ctx: unknown) => {
        contextRef = ctx;
        return {
          rootNodes: [panel],
          detectChanges: () => {},
          onDestroy: () => {},
          destroy: () => panel.remove(),
        };
      },
    } as unknown as ViewContainerRef;

    const ref = service.open(templateRef, viewContainerRef);

    expect(contextRef).toEqual({
      $implicit: ref,
      ariaLabelledBy: expect.stringContaining('qz-dialog-title-'),
      ariaDescribedBy: expect.stringContaining('qz-dialog-desc-'),
    });

    ref.close();
  });

  it('should apply custom aria-labelledby and aria-describedby', () => {
    const panel = document.createElement('div');
    const { templateRef, viewContainerRef } = createTemplateMocks(panel);

    const ref = service.open(templateRef, viewContainerRef, {
      ariaLabelledBy: 'my-title',
      ariaDescribedBy: 'my-desc',
    });

    const panelEl = document.querySelector('[role="dialog"]');
    expect(panelEl?.getAttribute('aria-labelledby')).toBe('my-title');
    expect(panelEl?.getAttribute('aria-describedby')).toBe('my-desc');

    ref.close();
  });

  it('should trap focus including contenteditable elements', () => {
    const contenteditable = document.createElement('div');
    contenteditable.setAttribute('contenteditable', 'true');

    const panel = document.createElement('div');
    panel.appendChild(contenteditable);

    const { templateRef, viewContainerRef } = createTemplateMocks(panel);
    const ref = service.open(templateRef, viewContainerRef);

    expect(document.activeElement).toBe(contenteditable);

    contenteditable.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }));

    expect(document.activeElement).toBe(contenteditable);

    ref.close();
  });

  it('should be safe to close a dialog multiple times', () => {
    const panel = document.createElement('div');
    const { templateRef, viewContainerRef } = createTemplateMocks(panel);
    const ref = service.open(templateRef, viewContainerRef);

    expect(() => {
      ref.close();
      ref.close();
      ref.close();
    }).not.toThrow();

    expect(document.querySelector('[data-qz-dialog-wrapper]')).toBeNull();
  });

  it('should focus the panel itself when the dialog has nothing focusable', () => {
    const panel = document.createElement('div');
    panel.textContent = 'Just text';
    const { templateRef, viewContainerRef } = createTemplateMocks(panel);

    const ref = service.open(templateRef, viewContainerRef);

    const panelEl = document.querySelector<HTMLElement>('[role="dialog"]');
    expect(panelEl).toHaveAttribute('tabindex', '-1');
    expect(document.activeElement).toBe(panelEl);

    ref.close();
  });

  it('should not reference generated aria ids that no element uses', () => {
    const panel = document.createElement('div');
    const { templateRef, viewContainerRef } = createTemplateMocks(panel);

    const ref = service.open(templateRef, viewContainerRef);

    const panelEl = document.querySelector('[role="dialog"]');
    expect(panelEl?.hasAttribute('aria-labelledby')).toBe(false);
    expect(panelEl?.hasAttribute('aria-describedby')).toBe(false);

    ref.close();
  });

  it('should reference generated aria ids once the template binds them', () => {
    const panel = document.createElement('div');
    const title = document.createElement('h2');
    title.id = 'qz-dialog-title-bound';
    panel.appendChild(title);

    const { templateRef, viewContainerRef } = createTemplateMocks(panel);
    const ref = service.open(templateRef, viewContainerRef, {
      ariaLabelledBy: 'qz-dialog-title-bound',
    });

    const panelEl = document.querySelector('[role="dialog"]');
    expect(panelEl?.getAttribute('aria-labelledby')).toBe('qz-dialog-title-bound');

    ref.close();
  });

  it('cleans up backdrop, wrapper, scroll lock and fires closed$ when the host view is destroyed directly, without DialogRef#close() ever being called', () => {
    const panel = document.createElement('div');
    const { templateRef, viewContainerRef, destroyViewDirectly } = createTemplateMocks(panel);
    const ref = service.open(templateRef, viewContainerRef);

    expect(document.querySelector('[data-qz-dialog-backdrop]')).not.toBeNull();
    expect(document.querySelector('[data-qz-dialog-wrapper]')).not.toBeNull();
    expect(document.body.style.overflow).toBe('hidden');

    const closed = vi.fn();
    ref.closed$.subscribe(closed);

    // Simulates Angular tearing down the embedded view directly (e.g. a router navigation
    // away from the dialog's host while it's still open) — DialogRef#close() is never called.
    destroyViewDirectly();

    expect(closed).toHaveBeenCalled();
    expect(document.querySelector('[data-qz-dialog-backdrop]')).toBeNull();
    expect(document.querySelector('[data-qz-dialog-wrapper]')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });
});

function createTemplateMocks(content: HTMLElement): {
  templateRef: TemplateRef<unknown>;
  viewContainerRef: ViewContainerRef;
  /** Simulates Angular tearing down the *most recently created* embedded view directly
   * (bypassing DialogRef#close), e.g. because the host ViewContainerRef itself was
   * destroyed (a route navigation away from the dialog's host while it's still open). */
  destroyViewDirectly: () => void;
} {
  // Scoped per createEmbeddedView() call — a mock viewContainerRef can back more than one
  // open() call (see the multi-dialog specs below), and each embedded view's onDestroy
  // callbacks must stay independent so closing one dialog can't fire another's callback.
  let latestOnDestroyCallbacks: Array<() => void> = [];
  return {
    templateRef: {} as TemplateRef<unknown>,
    viewContainerRef: {
      createEmbeddedView: () => {
        const onDestroyCallbacks: Array<() => void> = [];
        latestOnDestroyCallbacks = onDestroyCallbacks;
        return {
          rootNodes: [content],
          detectChanges: () => {},
          onDestroy: (cb: () => void) => {
            onDestroyCallbacks.push(cb);
          },
          destroy: () => {
            content.remove();
            onDestroyCallbacks.forEach((cb) => cb());
          },
        };
      },
    } as unknown as ViewContainerRef,
    destroyViewDirectly: () => {
      content.remove();
      latestOnDestroyCallbacks.forEach((cb) => cb());
    },
  };
}
