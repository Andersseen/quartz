import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import {
  ComboboxContentDirective,
  ComboboxDirective,
  ComboboxInputDirective,
  ComboboxListboxDirective,
  ComboboxOptionDirective,
  ComboboxTriggerDirective,
} from '@quartz-headless/primitives';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { ASYNC_SNIPPET, BASIC_SNIPPET, OBJECT_SNIPPET } from './combobox.snippets';

interface User {
  id: number;
  name: string;
  role: string;
  disabled?: boolean;
}

interface Repository {
  id: number;
  name: string;
  language: string;
}

const ALL_REPOSITORIES: Repository[] = [
  { id: 1, name: 'quartz-headless', language: 'TypeScript' },
  { id: 2, name: 'analog-labs', language: 'Angular' },
  { id: 3, name: 'overlay-kit', language: 'TypeScript' },
  { id: 4, name: 'a11y-fixtures', language: 'HTML' },
];

@Component({
  selector: 'app-combobox-page',
  imports: [
    DemoPageComponent,
    CodeBlockComponent,
    ComboboxDirective,
    ComboboxInputDirective,
    ComboboxContentDirective,
    ComboboxListboxDirective,
    ComboboxOptionDirective,
    ComboboxTriggerDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './combobox.page.html',
})
export default class ComboboxPage {
  readonly basicCode = BASIC_SNIPPET;
  readonly objectCode = OBJECT_SNIPPET;
  readonly asyncCode = ASYNC_SNIPPET;

  readonly fruits = ['Apple', 'Apricot', 'Banana', 'Grape', 'Orange'];
  readonly selectedFruit = signal<string | null>(null);

  readonly users = signal<User[]>([
    { id: 1, name: 'Ada Lovelace', role: 'Computing pioneer' },
    { id: 2, name: 'Grace Hopper', role: 'Compiler pioneer' },
    { id: 3, name: 'Katherine Johnson', role: 'Orbital mechanics', disabled: true },
    { id: 4, name: 'Margaret Hamilton', role: 'Apollo software' },
  ]);
  readonly selectedUser = signal<User | null>(null);
  readonly displayUser = (user: User) => user.name;
  readonly compareUsers = (a: User, b: User) => a.id === b.id;

  readonly query = signal('');
  readonly loading = signal(false);
  readonly results = signal<Repository[]>(ALL_REPOSITORIES);
  readonly selectedRepo = signal<Repository | null>(null);
  readonly displayRepository = (repo: Repository) => repo.name;
  readonly repoLabel = computed(() => this.selectedRepo()?.name ?? 'none');
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const query = this.query().trim().toLocaleLowerCase();
      this.loading.set(true);
      if (this.searchTimer !== null) clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.results.set(
          ALL_REPOSITORIES.filter((repo) => repo.name.toLocaleLowerCase().includes(query)),
        );
        this.loading.set(false);
      }, 250);
    });
  }
}
