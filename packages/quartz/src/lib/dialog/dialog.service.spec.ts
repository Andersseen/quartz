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
    backdrop?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

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
});

function createTemplateMocks(content: HTMLElement): {
  templateRef: TemplateRef<unknown>;
  viewContainerRef: ViewContainerRef;
} {
  return {
    templateRef: {} as TemplateRef<unknown>,
    viewContainerRef: {
      createEmbeddedView: () => ({
        rootNodes: [content],
        detectChanges: () => {},
        destroy: () => content.remove(),
      }),
    } as unknown as ViewContainerRef,
  };
}
