import { Injectable, signal, computed } from '@angular/core';
import { SplitterOrientation, SplitterConfig, DEFAULT_SPLITTER_CONFIG } from './splitter.types';

@Injectable()
export class SplitterService {
  private config = signal<SplitterConfig>(DEFAULT_SPLITTER_CONFIG);

  private _position = signal<number>(DEFAULT_SPLITTER_CONFIG.defaultPosition);
  private _orientation = signal<SplitterOrientation>('horizontal');
  private _isDragging = signal<boolean>(false);
  private _containerRect = signal<DOMRect | null>(null);

  readonly position = this._position.asReadonly();
  readonly orientation = this._orientation.asReadonly();
  readonly isDragging = this._isDragging.asReadonly();
  readonly containerRect = this._containerRect.asReadonly();

  readonly isHorizontal = computed(() => this._orientation() === 'horizontal');
  readonly isVertical = computed(() => this._orientation() === 'vertical');
  readonly minSize = computed(() => this.config().minSize);
  readonly maxSize = computed(() => this.config().maxSize);
  readonly step = computed(() => this.config().step);

  updateConfig(config: Partial<SplitterConfig>): void {
    this.config.update((current) => ({ ...current, ...config }));
  }

  setOrientation(orientation: SplitterOrientation): void {
    this._orientation.set(orientation);
  }

  setContainerRect(rect: DOMRect): void {
    this._containerRect.set(rect);
  }

  setPosition(position: number): void {
    const cfg = this.config();
    const clamped = Math.max(cfg.minSize, Math.min(cfg.maxSize, position));
    const stepped = Math.round(clamped / cfg.step) * cfg.step;
    this._position.set(stepped);
  }

  startDragging(): void {
    this._isDragging.set(true);
  }

  stopDragging(): void {
    this._isDragging.set(false);
  }

  calculatePositionFromEvent(clientX: number, clientY: number): number {
    const rect = this._containerRect();
    if (!rect) return this._position();

    if (this.isHorizontal()) {
      return ((clientX - rect.left) / rect.width) * 100;
    } else {
      return ((clientY - rect.top) / rect.height) * 100;
    }
  }

  calculatePositionFromTouch(touch: Touch): number {
    return this.calculatePositionFromEvent(touch.clientX, touch.clientY);
  }
}
