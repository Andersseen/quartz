import { describe, it, expect, afterEach } from 'vitest';
import { defineQuartzBehaviors } from './define-quartz-behaviors';

describe('defineQuartzBehaviors', () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  it('should wire up a splitter from attributes', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div qz-splitter="horizontal" qz-splitter-default-position="40">
        <div qz-splitter-panel="primary">Primary</div>
        <div qz-splitter-handle></div>
        <div qz-splitter-panel="secondary">Secondary</div>
      </div>
    `;
    document.body.appendChild(root);

    cleanup = defineQuartzBehaviors({ root });

    const primary = root.querySelector<HTMLElement>('[qz-splitter-panel="primary"]');
    expect(primary?.style.width).toBe('40%');
  });

  it('should wire up drag and drop from attributes', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div qz-draggable>Drag me</div>
      <div qz-drop-zone>Drop here</div>
    `;

    cleanup = defineQuartzBehaviors({ root });

    const draggable = root.querySelector<HTMLElement>('[qz-draggable]');
    const dropZone = root.querySelector<HTMLElement>('[qz-drop-zone]');

    expect(draggable?.getAttribute('draggable')).toBe('true');
    expect(dropZone?.classList.contains('qz-drop-zone')).toBe(true);
  });

  it('should clean up all behaviors', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div qz-splitter="horizontal">
        <div qz-splitter-panel="primary">Primary</div>
        <div qz-splitter-handle></div>
        <div qz-splitter-panel="secondary">Secondary</div>
      </div>
      <div qz-draggable>Drag me</div>
      <div qz-drop-zone>Drop here</div>
    `;

    cleanup = defineQuartzBehaviors({ root });
    cleanup();
    cleanup = null;

    const container = root.querySelector<HTMLElement>('[qz-splitter]');
    const draggable = root.querySelector<HTMLElement>('[qz-draggable]');
    const dropZone = root.querySelector<HTMLElement>('[qz-drop-zone]');

    expect(container?.classList.contains('qz-splitter-container')).toBe(false);
    expect(draggable?.getAttribute('draggable')).toBeNull();
    expect(dropZone?.classList.contains('qz-drop-zone')).toBe(false);
  });
});
