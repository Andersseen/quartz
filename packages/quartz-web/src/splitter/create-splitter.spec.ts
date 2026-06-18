import { describe, it, expect, afterEach } from 'vitest';
import { createSplitter } from './create-splitter';

describe('createSplitter', () => {
  let instance: ReturnType<typeof createSplitter> | null = null;

  afterEach(() => {
    instance?.destroy();
    instance = null;
  });

  function createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.innerHTML = `
      <div qz-splitter-panel="primary">Primary</div>
      <div qz-splitter-handle></div>
      <div qz-splitter-panel="secondary">Secondary</div>
    `;
    document.body.appendChild(container);
    return container;
  }

  it('should create a splitter instance', () => {
    const container = createContainer();
    instance = createSplitter(container);

    expect(instance.container).toBe(container);
    expect(container.classList.contains('qz-splitter-container')).toBe(true);
  });

  it('should throw if required children are missing', () => {
    const container = document.createElement('div');
    expect(() => createSplitter(container)).toThrow();
  });

  it('should apply initial panel sizes', () => {
    const container = createContainer();
    instance = createSplitter(container, { defaultPosition: 40, orientation: 'horizontal' });

    const primary = container.querySelector<HTMLElement>('[qz-splitter-panel="primary"]');
    expect(primary?.style.width).toBe('40%');
  });

  it('should update position imperatively', () => {
    const container = createContainer();
    instance = createSplitter(container, { defaultPosition: 50 });
    instance.setPosition(75);

    const primary = container.querySelector<HTMLElement>('[qz-splitter-panel="primary"]');
    expect(primary?.style.width).toBe('75%');
  });
});
