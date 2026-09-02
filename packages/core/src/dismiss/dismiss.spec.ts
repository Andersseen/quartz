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

    inside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(onDismiss).not.toHaveBeenCalled();

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(onDismiss).toHaveBeenCalledWith('outside-pointer', expect.any(PointerEvent));

    controller.destroy();
    root.remove();
  });

  it('registers a single pointerdown listener for outside-pointer dismissal, not mousedown/click as well', () => {
    // A single physical outside click must not be able to fire the dismiss callback more
    // than once, and a drag-selection starting inside the root and ending outside it must
    // not trigger dismissal via a trailing click event.
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onDismiss = vi.fn();

    const controller = createDismissController({
      document,
      outsidePointer: true,
      rootElements: () => [root],
      onDismiss,
    });

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onDismiss).toHaveBeenCalledTimes(1);

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

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(innerDismiss).toHaveBeenCalledTimes(1);
    expect(outerDismiss).not.toHaveBeenCalled();

    innerController.destroy();
    outerController.destroy();
    outer.remove();
    inner.remove();
  });

  it('routes Escape to only the topmost layer within its own Document, and does not let a layer registered in a different Document steal that position', () => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const iframeDocument = iframe.contentDocument!;

    const outerDismiss = vi.fn();
    const iframeDismiss = vi.fn();

    // Registered first, in the main document.
    const outerController = createDismissController({
      document,
      escape: true,
      rootElements: () => [],
      onDismiss: outerDismiss,
    });
    // Registered second, in a completely different Document — under the old module-global
    // layer stack this would incorrectly become the "global top", starving the main
    // document's own (legitimately topmost, for its own document) layer.
    const iframeController = createDismissController({
      document: iframeDocument,
      escape: true,
      rootElements: () => [],
      onDismiss: iframeDismiss,
    });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(outerDismiss).toHaveBeenCalledTimes(1);
    expect(iframeDismiss).not.toHaveBeenCalled();

    outerController.destroy();
    iframeController.destroy();
    iframe.remove();
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
