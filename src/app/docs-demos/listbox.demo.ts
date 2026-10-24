import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ListboxDirective, ListboxOptionDirective } from '@quartz-headless/primitives';

@Component({
  selector: 'app-listbox-demo',
  imports: [ListboxDirective, ListboxOptionDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './listbox.demo.html',
})
export class ListboxDemoComponent {
  readonly selectedPlan = signal<string | null>('pro');
  readonly selectedTags = signal<string[]>(['angular']);
  setSelectedPlan(value: string | string[] | null): void {
    this.selectedPlan.set(typeof value === 'string' ? value : null);
  }

  setSelectedTags(value: string | string[] | null): void {
    this.selectedTags.set(Array.isArray(value) ? value : []);
  }
}
