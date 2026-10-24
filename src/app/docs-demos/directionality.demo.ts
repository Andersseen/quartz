import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  CollectionStore,
  OverlayTriggerDirective,
  inlineStartKey,
  inlineEndKey,
  type CollectionItem,
  type Direction,
} from '@quartz-headless/core';
import { VoltButton } from '@voltui/components';

@Component({
  selector: 'app-directionality-demo',
  imports: [VoltButton, OverlayTriggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './directionality.demo.html',
})
export class DirectionalityDemoComponent {
  private readonly document = inject(DOCUMENT);

  readonly direction = signal<Direction>('ltr');
  readonly inlineStart = computed(() => inlineStartKey(this.direction()));
  readonly inlineEnd = computed(() => inlineEndKey(this.direction()));

  readonly items: CollectionItem[] = [
    { id: 'alpha', label: 'Alpha' },
    { id: 'bravo', label: 'Bravo' },
    { id: 'charlie', label: 'Charlie' },
  ];

  readonly store = new CollectionStore<CollectionItem>(
    { orientation: 'horizontal', wrap: true },
    this.document,
  );

  readonly activeId = this.store.activeId;
  constructor() {
    this.items.forEach((item) => this.store.register(item));
  }

  toggleDirection(): void {
    const next: Direction = this.direction() === 'ltr' ? 'rtl' : 'ltr';
    this.direction.set(next);
    this.store.configure({ direction: next });
  }

  onKeydown(event: KeyboardEvent): void {
    this.store.handleKeydown(event, { focus: true });
  }
}
