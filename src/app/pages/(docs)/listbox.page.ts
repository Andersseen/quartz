import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ListboxDirective, ListboxOptionDirective } from '@quartz-headless/primitives';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { BASIC_SNIPPET, MULTI_SNIPPET } from './listbox.snippets';

@Component({
  selector: 'app-listbox-page',
  imports: [ListboxDirective, ListboxOptionDirective, DemoPageComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './listbox.page.html',
})
export default class ListboxPage {
  readonly selectedPlan = signal<string | null>('pro');
  readonly selectedTags = signal<string[]>(['angular']);
  readonly basicCode = BASIC_SNIPPET;
  readonly multiCode = MULTI_SNIPPET;

  setSelectedPlan(value: string | string[] | null): void {
    this.selectedPlan.set(typeof value === 'string' ? value : null);
  }

  setSelectedTags(value: string | string[] | null): void {
    this.selectedTags.set(Array.isArray(value) ? value : []);
  }
}
