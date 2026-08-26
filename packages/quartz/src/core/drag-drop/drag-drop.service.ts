import { Injectable, signal, computed } from '@angular/core';

interface DragState {
  isDragging: boolean;
  data: unknown | null;
  sourceElement: HTMLElement | null;
  dragType: string | null;
}

@Injectable({ providedIn: 'root' })
export class DragDropService {
  #state = signal<DragState>({
    isDragging: false,
    data: null,
    sourceElement: null,
    dragType: null,
  });

  readonly isDragging = computed(() => this.#state().isDragging);
  readonly dragData = computed(() => this.#state().data);
  readonly sourceElement = computed(() => this.#state().sourceElement);
  readonly dragType = computed(() => this.#state().dragType);

  startDrag(data: unknown, sourceElement: HTMLElement, dragType?: string): void {
    this.#state.set({
      isDragging: true,
      data,
      sourceElement,
      dragType: dragType || null,
    });
  }

  endDrag(_dropped: boolean): void {
    this.#state.set({
      isDragging: false,
      data: null,
      sourceElement: null,
      dragType: null,
    });
  }

  getDragData<T>(): T | null {
    return this.#state().data as T | null;
  }
}
