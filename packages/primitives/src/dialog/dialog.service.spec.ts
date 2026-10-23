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

  it('should apply custom aria-labelledby and aria-describedby that exist in the document', () => {
    const title = document.createElement('h2');
    title.id = 'my-title';
    const desc = document.createElement('p');
    desc.id = 'my-desc';
    document.body.append(title, desc);
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
    title.remove();
    desc.remove();
  });

  it('never writes an aria reference whose target does not exist', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const panel = document.createElement('div');
    const { templateRef, viewContainerRef } = createTemplateMocks(panel);

    const ref = service.open(templateRef, viewContainerRef, {
      ariaLabelledBy: 'missing-title',
      ariaDescribedBy: 'missing-desc',
    });

    const panelEl = document.querySelector('[role="dialog"]');
    expect(panelEl?.hasAttribute('aria-labelledby')).toBe(false);
    expect(panelEl?.hasAttribute('aria-describedby')).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);

    ref.close();
    warn.mockRestore();
  });

  it('uses ariaLabel as the accessible name when there is no title element', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const panel = document.createElement('div');
    const { templateRef, viewContainerRef } = createTemplateMocks(panel);

    const ref = service.open(templateRef, viewContainerRef, { ariaLabel: 'Settings' });

    const panelEl = document.querySelector('[role="dialog"]');
    expect(panelEl?.getAttribute('aria-label')).toBe('Settings');
    expect(warn).not.toHaveBeenCalled();

    ref.close();
    warn.mockRestore();
  });

  it('prefers a resolved aria-labelledby over ariaLabel', () => {
    const panel = document.createElement('div');
    const title = document.createElement('h2');
    title.id = 'qz-title-wins';
    panel.appendChild(title);
    const { templateRef, viewContainerRef } = createTemplateMocks(panel);

    const ref = service.open(templateRef, viewContainerRef, {
      ariaLabelledBy: 'qz-title-wins',
      ariaLabel: 'Ignored',
    });

    const panelEl = document.querySelector('[role="dialog"]');
    expect(panelEl?.getAttribute('aria-labelledby')).toBe('qz-title-wins');
    expect(panelEl?.hasAttribute('aria-label')).toBe(false);

    ref.close();
  });

  it('isolates the background while open and restores it on close', () => {
    const app = document.createElement('main');
    document.body.appendChild(app);
    const panel = document.createElement('div');
    const { templateRef, viewContainerRef } = createTemplateMocks(panel);

    const ref = service.open(templateRef, viewContainerRef, { ariaLabel: 'x' });
    expect(app.hasAttribute('inert') || app.getAttribute('aria-hidden') === 'true').toBe(true);
    expect(document.querySelector('[data-qz-dialog-wrapper]')?.hasAttribute('inert')).toBe(false);

    ref.close();
    expect(app.hasAttribute('inert')).toBe(false);
    expect(app.hasAttribute('aria-hidden')).toBe(false);
    app.remove();
  });

  it('emits closed$ once even if teardown throws', () => {
    const panel = document.createElement('div');
    const { templateRef, viewContainerRef } = createTemplateMocks(panel);
    const ref = service.open(templateRef, viewContainerRef, { ariaLabel: 'x' });
    const closed = vi.fn();
    ref.closed$.subscribe(closed);
    ref.close();
    ref.close();
    expect(closed).toHaveBeenCalledTimes(1);
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

  describe('nested dialogs', () => {
    function openWithButtons(label: string, trigger?: HTMLElement) {
      const panel = document.createElement('div');
      panel.innerHTML = `<button id="${label}-1">1</button><button id="${label}-2">2</button>`;
      const { templateRef, viewContainerRef } = createTemplateMocks(panel);
      trigger?.focus();
      const ref = service.open(templateRef, viewContainerRef);
      return { ref, panel };
    }
    const tab = (shiftKey = false) => {
      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true });
      document.dispatchEvent(event);
      return event;
    };

    it('Escape closes only the topmost dialog, then the next', () => {
      const a = openWithButtons('a');
      const b = openWithButtons('b');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(document.body.contains(b.panel)).toBe(false);
      expect(document.body.contains(a.panel)).toBe(true);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(document.body.contains(a.panel)).toBe(false);
    });

    it('only the upper dialog traps Tab; the lower one does not pull focus back', () => {
      const a = openWithButtons('a');
      const b = openWithButtons('b');
      const b2 = b.panel.querySelector<HTMLElement>('#b-2')!;
      b2.focus();
      tab();
      expect(document.activeElement?.id).toBe('b-1');
      b.ref.close();
      const a2 = a.panel.querySelector<HTMLElement>('#a-2')!;
      a2.focus();
      tab();
      expect(document.activeElement?.id).toBe('a-1');
      a.ref.close();
    });

    it('closing B restores focus to its opener inside A, closing A restores A’s opener', () => {
      const outer = document.createElement('button');
      document.body.appendChild(outer);
      const a = openWithButtons('a', outer);
      const inA = a.panel.querySelector<HTMLElement>('#a-2')!;
      const b = openWithButtons('b', inA);
      b.ref.close();
      expect(document.activeElement).toBe(inA);
      a.ref.close();
      expect(document.activeElement).toBe(outer);
      outer.remove();
    });

    it('closing A out of order does not steal focus from the open B, and B closes cleanly after', () => {
      const outer = document.createElement('button');
      document.body.appendChild(outer);
      const a = openWithButtons('a', outer);
      const b = openWithButtons('b', a.panel.querySelector<HTMLElement>('#a-1')!);
      const focusedInB = document.activeElement;
      a.ref.close();
      expect(document.activeElement).toBe(focusedInB);
      expect(document.body.style.overflow).toBe('hidden');
      b.ref.close();
      expect(document.body.style.overflow).toBe('');
      expect(document.querySelector('[data-qz-dialog-wrapper]')).toBeNull();
      outer.remove();
    });

    it('does not restore focus to an opener that was removed while the dialog was open', () => {
      const opener = document.createElement('button');
      document.body.appendChild(opener);
      const a = openWithButtons('a', opener);
      opener.remove();
      expect(() => a.ref.close()).not.toThrow();
      expect(document.activeElement).not.toBe(opener);
    });

    it('releases the scroll lock only after the last dialog closes; double close is safe', () => {
      const a = openWithButtons('a');
      const b = openWithButtons('b');
      b.ref.close();
      b.ref.close();
      expect(document.body.style.overflow).toBe('hidden');
      a.ref.close();
      expect(document.body.style.overflow).toBe('');
    });
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
