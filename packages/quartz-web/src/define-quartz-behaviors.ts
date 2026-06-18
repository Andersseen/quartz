import { createDraggable } from './drag-drop/create-draggable';
import { createDropZone } from './drag-drop/create-drop-zone';
import { createSplitter } from './splitter/create-splitter';
import type { SplitterOrientation } from './splitter/types';

export interface QuartzBehaviorsOptions {
  /** Root element to scan. Defaults to `document.body`. */
  root?: HTMLElement;
  /** Whether to watch for newly added elements and initialize them automatically. */
  observe?: boolean;
}

interface QuartzInstance {
  destroy(): void;
}

function parseNumber(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseList(value: string | null): string[] | undefined {
  if (value === null) return undefined;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function initSplitters(root: HTMLElement, instances: QuartzInstance[]): void {
  root.querySelectorAll<HTMLElement>('[qz-splitter]').forEach((container) => {
    const orientation =
      (container.getAttribute('qz-splitter') as SplitterOrientation) || 'horizontal';

    instances.push(
      createSplitter(container, {
        orientation,
        minSize: parseNumber(container.getAttribute('qz-splitter-min'), 0),
        maxSize: parseNumber(container.getAttribute('qz-splitter-max'), 100),
        step: parseNumber(container.getAttribute('qz-splitter-step'), 1),
        defaultPosition: parseNumber(container.getAttribute('qz-splitter-default-position'), 50),
      }),
    );
  });
}

function initDraggables(root: HTMLElement, instances: QuartzInstance[]): void {
  root.querySelectorAll<HTMLElement>('[qz-draggable]').forEach((element) => {
    instances.push(
      createDraggable(element, {
        data: element.getAttribute('qz-draggable-data') ?? undefined,
        handle: element.getAttribute('qz-draggable-handle') ?? undefined,
        disabled: element.hasAttribute('qz-draggable-disabled'),
      }),
    );
  });
}

function initDropZones(root: HTMLElement, instances: QuartzInstance[]): void {
  root.querySelectorAll<HTMLElement>('[qz-drop-zone]').forEach((element) => {
    const instance = createDropZone(element, {
      accept: parseList(element.getAttribute('qz-drop-zone-accept')),
      sortable: element.hasAttribute('qz-drop-zone-sortable'),
      disabled: element.hasAttribute('qz-drop-zone-disabled'),
    });

    // Auto-reorder sortable drop zones out of the box.
    if (element.hasAttribute('qz-drop-zone-sortable')) {
      element.addEventListener('qz-drop', (event) => {
        const detail = (event as CustomEvent).detail;
        if (!detail.source || !detail.target || detail.index === undefined) return;

        const children = Array.from(detail.target.children);
        const before = children[detail.index];
        if (before && before !== detail.source) {
          detail.target.insertBefore(detail.source, before);
        } else if (!before) {
          detail.target.appendChild(detail.source);
        }
      });
    }

    instances.push(instance);
  });
}

/**
 * Scans the DOM for `[qz-*]` attributes and wires up Quartz behaviors.
 * Returns a cleanup function that destroys all created instances.
 */
export function defineQuartzBehaviors(options: QuartzBehaviorsOptions = {}): () => void {
  const root = options.root ?? document.body;
  const instances: QuartzInstance[] = [];

  initSplitters(root, instances);
  initDraggables(root, instances);
  initDropZones(root, instances);

  let observer: MutationObserver | null = null;

  if (options.observe) {
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) {
            initSplitters(node, instances);
            initDraggables(node, instances);
            initDropZones(node, instances);
          }
        }
      }
    });

    observer.observe(root, { childList: true, subtree: true });
  }

  return () => {
    instances.forEach((instance) => instance.destroy());
    instances.length = 0;
    observer?.disconnect();
    observer = null;
  };
}
