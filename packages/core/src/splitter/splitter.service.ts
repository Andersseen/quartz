import { Injectable, signal, computed } from '@angular/core';
import { SplitterOrientation, SplitterConfig, DEFAULT_SPLITTER_CONFIG } from './splitter.types';
import type { Direction } from '../directionality';

@Injectable()
export class SplitterService {
  private config = signal<SplitterConfig>(DEFAULT_SPLITTER_CONFIG);

  #position = signal<number>(DEFAULT_SPLITTER_CONFIG.defaultPosition);
  #orientation = signal<SplitterOrientation>('horizontal');
  #isDragging = signal<boolean>(false);
  #containerRect = signal<DOMRect | null>(null);
  #direction = signal<Direction>('ltr');
  #disabled = signal(false);

  readonly position = this.#position.asReadonly();
  readonly orientation = this.#orientation.asReadonly();
  readonly isDragging = this.#isDragging.asReadonly();
  readonly containerRect = this.#containerRect.asReadonly();
  /** Writing direction of the container; flips the horizontal axis in `rtl`. */
  readonly direction = this.#direction.asReadonly();
  /** Whether resizing is turned off (pointer and keyboard). */
  readonly disabled = this.#disabled.asReadonly();
  /** `true` while a pointer drag is in progress. Alias of `isDragging`. */
  readonly resizing = this.#isDragging.asReadonly();

  readonly isHorizontal = computed(() => this.#orientation() === 'horizontal');
  readonly isVertical = computed(() => this.#orientation() === 'vertical');
  readonly minSize = computed(() => this.config().minSize);
  readonly maxSize = computed(() => this.config().maxSize);
  readonly step = computed(() => this.config().step);

  /**
   * Units: every size is a percentage (0–100) of the container's main-axis size taken by the
   * primary panel; the secondary panel gets the remainder. `minSize`/`maxSize` bound the
   * primary panel, so the secondary panel's minimum is `100 - maxSize`.
   *
   * Non-finite values fall back to the defaults; `maxSize` is raised to `minSize` when smaller.
   * The current position is re-clamped so dynamic bounds never leave it out of range.
   */
  updateConfig(config: Partial<SplitterConfig>): void {
    this.config.update((current) => sanitizeConfig({ ...current, ...config }));
    this.#position.update((position) => this.#normalize(position));
  }

  setDirection(direction: Direction): void {
    this.#direction.set(direction);
  }

  setDisabled(disabled: boolean): void {
    this.#disabled.set(disabled);
    if (disabled) this.stopDragging();
  }

  setOrientation(orientation: SplitterOrientation): void {
    this.#orientation.set(orientation);
  }

  setContainerRect(rect: DOMRect): void {
    this.#containerRect.set(rect);
  }

  setPosition(position: number): void {
    if (!Number.isFinite(position)) return;
    this.#position.set(this.#normalize(position));
  }

  #normalize(position: number): number {
    const cfg = this.config();
    const clamped = Math.max(cfg.minSize, Math.min(cfg.maxSize, position));
    const stepped = Math.round(clamped / cfg.step) * cfg.step;
    // Rounding to a step can land outside the bounds when they are not step multiples.
    return Math.max(cfg.minSize, Math.min(cfg.maxSize, stepped));
  }

  startDragging(): void {
    if (this.#disabled()) return;
    this.#isDragging.set(true);
  }

  stopDragging(): void {
    this.#isDragging.set(false);
  }

  calculatePositionFromEvent(clientX: number, clientY: number): number {
    const rect = this.#containerRect();
    if (!rect) return this.#position();

    const horizontal = this.isHorizontal();
    const length = horizontal ? rect.width : rect.height;
    // A collapsed container has no geometry to measure against: keep the current position.
    if (!(length > 0)) return this.#position();

    let distance: number;
    if (horizontal) {
      distance = this.#direction() === 'rtl' ? rect.right - clientX : clientX - rect.left;
    } else {
      distance = clientY - rect.top;
    }
    const result = (distance / length) * 100;
    return Number.isFinite(result) ? result : this.#position();
  }

  calculatePositionFromTouch(touch: Touch): number {
    return this.calculatePositionFromEvent(touch.clientX, touch.clientY);
  }
}

function sanitizeConfig(config: SplitterConfig): SplitterConfig {
  const finiteOr = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);
  const minSize = Math.min(
    100,
    Math.max(0, finiteOr(config.minSize, DEFAULT_SPLITTER_CONFIG.minSize)),
  );
  const maxSize = Math.min(
    100,
    Math.max(minSize, finiteOr(config.maxSize, DEFAULT_SPLITTER_CONFIG.maxSize)),
  );
  const step = finiteOr(config.step, 1) > 0 ? config.step : 1;
  return {
    minSize,
    maxSize,
    step,
    defaultPosition: finiteOr(config.defaultPosition, DEFAULT_SPLITTER_CONFIG.defaultPosition),
  };
}
