export interface DismissController {
  destroy(): void;
}

export interface DismissConfig {
  document: Document;
  enabled?: boolean;
  escape?: boolean;
  outsidePointer?: boolean;
  focusOutside?: boolean;
  scroll?: boolean;
  rootElements: () => readonly (HTMLElement | null | undefined)[];
  excludeElements?: () => readonly (HTMLElement | null | undefined)[];
  scrollTargets?: () => readonly EventTarget[];
  onDismiss: (reason: DismissReason, event: Event) => void;
}

export type DismissReason = 'escape' | 'outside-pointer' | 'focus-outside' | 'scroll';

const layers: DismissControllerImpl[] = [];

export function createDismissController(config: DismissConfig): DismissController {
  return new DismissControllerImpl(config);
}

class DismissControllerImpl implements DismissController {
  readonly #config: DismissConfig;
  readonly #document: Document;
  readonly #scrollListeners: Array<{ target: EventTarget; handler: EventListener }> = [];
  #destroyed = false;
  #attached = false;

  constructor(config: DismissConfig) {
    this.#config = config;
    this.#document = config.document;

    if (!this.#enabled() || !this.#document.defaultView) return;

    this.#attached = true;
    layers.push(this);
    if (config.escape) this.#document.addEventListener('keydown', this.#onKeydown, true);
    if (config.outsidePointer) {
      this.#document.addEventListener('pointerdown', this.#onPointer, true);
      this.#document.addEventListener('mousedown', this.#onPointer, true);
      this.#document.addEventListener('click', this.#onPointer, true);
    }
    if (config.focusOutside) this.#document.addEventListener('focusin', this.#onFocusIn, true);
    if (config.scroll) {
      for (const target of config.scrollTargets?.() ?? [this.#document]) {
        const handler = (event: Event) => this.#dismiss('scroll', event);
        target.addEventListener('scroll', handler, { passive: true });
        this.#scrollListeners.push({ target, handler });
      }
    }
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    if (!this.#attached) return;

    const index = layers.indexOf(this);
    if (index !== -1) layers.splice(index, 1);

    this.#document.removeEventListener('keydown', this.#onKeydown, true);
    this.#document.removeEventListener('pointerdown', this.#onPointer, true);
    this.#document.removeEventListener('mousedown', this.#onPointer, true);
    this.#document.removeEventListener('click', this.#onPointer, true);
    this.#document.removeEventListener('focusin', this.#onFocusIn, true);

    for (const { target, handler } of this.#scrollListeners) {
      target.removeEventListener('scroll', handler);
    }
    this.#scrollListeners.length = 0;
  }

  #onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    this.#dismiss('escape', event);
  };

  #onPointer = (event: Event): void => {
    if (!this.#isTopLayer()) return;
    const target = event.target as Node | null;
    if (!target || this.#contains(target)) return;
    this.#dismiss('outside-pointer', event);
  };

  #onFocusIn = (event: FocusEvent): void => {
    if (!this.#isTopLayer()) return;
    const target = event.target as Node | null;
    if (!target || this.#contains(target)) return;
    this.#dismiss('focus-outside', event);
  };

  #dismiss(reason: DismissReason, event: Event): void {
    if (!this.#enabled() || !this.#isTopLayer()) return;
    this.#config.onDismiss(reason, event);
  }

  #contains(target: Node): boolean {
    const roots = this.#config.rootElements().filter(Boolean) as HTMLElement[];
    const excluded = this.#config.excludeElements?.().filter(Boolean) as HTMLElement[] | undefined;
    return [...roots, ...(excluded ?? [])].some((element) => element.contains(target));
  }

  #isTopLayer(): boolean {
    return layers[layers.length - 1] === this;
  }

  #enabled(): boolean {
    return this.#config.enabled ?? true;
  }
}
