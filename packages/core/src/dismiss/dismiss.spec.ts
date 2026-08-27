import { describe, expect, it, vi } from 'vitest';
import { createDismissController } from './dismiss';

describe('dismiss foundation', () => {
  it('dismisses on Escape and cleans up listeners', () => {
    const onDismiss = vi.fn();
    const controller = createDismissController({
      document,
      escape: true,
      rootElements: () => [],
      onDismiss,
    });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onDismiss).toHaveBeenCalledWith('escape', expect.any(KeyboardEvent));

    controller.destroy();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses for outside pointer but ignores inside pointer', () => {
    const root = document.createElement('div');
    const inside = document.createElement('button');
    root.appendChild(inside);
    document.body.appendChild(root);
    const onDismiss = vi.fn();

    const controller = createDismissController({
      document,
      outsidePointer: true,
      rootElements: () => [root],
      onDismiss,
    });

    inside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(onDismiss).not.toHaveBeenCalled();

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(onDismiss).toHaveBeenCalledWith('outside-pointer', expect.any(MouseEvent));

    controller.destroy();
    root.remove();
  });

  it('only dismisses the topmost nested layer', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    document.body.append(outer, inner);
    const outerDismiss = vi.fn();
    const innerDismiss = vi.fn();

    const outerController = createDismissController({
      document,
      outsidePointer: true,
      rootElements: () => [outer],
      onDismiss: outerDismiss,
    });
    const innerController = createDismissController({
      document,
      outsidePointer: true,
      rootElements: () => [inner],
      onDismiss: innerDismiss,
    });

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(innerDismiss).toHaveBeenCalledTimes(1);
    expect(outerDismiss).not.toHaveBeenCalled();

    innerController.destroy();
    outerController.destroy();
    outer.remove();
    inner.remove();
  });

  it('dismisses on focus outside and scroll', () => {
    const root = document.createElement('div');
    const outside = document.createElement('button');
    document.body.append(root, outside);
    const onDismiss = vi.fn();

    const controller = createDismissController({
      document,
      focusOutside: true,
      scroll: true,
      rootElements: () => [root],
      scrollTargets: () => [document],
      onDismiss,
    });

    outside.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    document.dispatchEvent(new Event('scroll'));

    expect(onDismiss).toHaveBeenCalledWith('focus-outside', expect.any(FocusEvent));
    expect(onDismiss).toHaveBeenCalledWith('scroll', expect.any(Event));

    controller.destroy();
    root.remove();
    outside.remove();
  });

  it('is SSR-safe when the document has no defaultView', () => {
    const ssrDocument = Object.create(document, {
      defaultView: { value: null },
    }) as Document;
    const onDismiss = vi.fn();

    const controller = createDismissController({
      document: ssrDocument,
      escape: true,
      outsidePointer: true,
      rootElements: () => [],
      onDismiss,
    });

    expect(() => controller.destroy()).not.toThrow();
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
