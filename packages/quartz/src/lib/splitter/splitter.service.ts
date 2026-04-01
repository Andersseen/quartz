import { Injectable, signal, computed } from '@angular/core';
import { SplitterOrientation } from './splitter.model';

interface SplitterState {
  orientation: SplitterOrientation;
  isDragging: boolean;
  containerSize: number;
  leftPanelSize: number; // percentage
  rightPanelSize: number; // percentage
  minSize: number;
  maxSize: number;
  step: number;
}

@Injectable()
export class SplitterService {
  // Private state
  private readonly _state = signal<SplitterState>({
    orientation: 'horizontal',
    isDragging: false,
    containerSize: 0,
    leftPanelSize: 50,
    rightPanelSize: 50,
    minSize: 0,
    maxSize: 100,
    step: 1,
  });

  // Public readonly state
  readonly state = this._state.asReadonly();

  // Computed values
  readonly orientation = computed(() => this._state().orientation);
  readonly isDragging = computed(() => this._state().isDragging);
  readonly leftPanelSize = computed(() => this._state().leftPanelSize);
  readonly rightPanelSize = computed(() => this._state().rightPanelSize);
  readonly isHorizontal = computed(() => this._state().orientation === 'horizontal');

  // Actions
  setOrientation(orientation: SplitterOrientation): void {
    this._state.update((state) => ({ ...state, orientation }));
  }

  setConfig(minSize: number, maxSize: number, step: number): void {
    this._state.update((state) => ({
      ...state,
      minSize,
      maxSize,
      step,
    }));
  }

  setContainerSize(size: number): void {
    this._state.update((state) => ({ ...state, containerSize: size }));
  }

  startDrag(): void {
    this._state.update((state) => ({ ...state, isDragging: true }));
  }

  endDrag(): void {
    this._state.update((state) => ({ ...state, isDragging: false }));
  }

  updateSplit(position: number): void {
    const state = this._state();
    
    // Clamp to min/max
    let clamped = Math.max(state.minSize, Math.min(state.maxSize, position));
    
    // Apply step
    if (state.step > 0) {
      clamped = Math.round(clamped / state.step) * state.step;
    }
    
    // Ensure we don't exceed bounds after stepping
    clamped = Math.max(state.minSize, Math.min(state.maxSize, clamped));
    
    this._state.update((s) => ({
      ...s,
      leftPanelSize: clamped,
      rightPanelSize: 100 - clamped,
    }));
  }

  // Calculate position from mouse/touch event
  calculatePositionFromEvent(
    clientX: number,
    clientY: number,
    containerRect: DOMRect
  ): number {
    const state = this._state();
    
    if (state.orientation === 'horizontal') {
      return ((clientX - containerRect.left) / containerRect.width) * 100;
    } else {
      return ((clientY - containerRect.top) / containerRect.height) * 100;
    }
  }

  // Adjust by keyboard
  adjustByStep(direction: 'increase' | 'decrease'): void {
    const state = this._state();
    const delta = direction === 'increase' ? state.step : -state.step;
    this.updateSplit(state.leftPanelSize + delta);
  }

  setToMin(): void {
    this.updateSplit(this._state().minSize);
  }

  setToMax(): void {
    this.updateSplit(this._state().maxSize);
  }
}
