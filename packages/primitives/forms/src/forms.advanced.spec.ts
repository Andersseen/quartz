import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import {
  ComboboxContentDirective,
  ComboboxDirective,
  ComboboxInputDirective,
  ComboboxListboxDirective,
  ComboboxOptionDirective,
  SelectContentDirective,
  SelectDirective,
  SelectListboxDirective,
  SelectOptionDirective,
  SelectTriggerDirective,
} from '@quartz-headless/primitives';
import { afterEach, describe, expect, it } from 'vitest';
import { QUARTZ_FORMS } from './public-api';

interface Tag {
  id: number;
  name: string;
}
const TAGS: Tag[] = [
  { id: 1, name: 'Angular' },
  { id: 2, name: 'Signals' },
];

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SelectDirective,
    SelectTriggerDirective,
    SelectContentDirective,
    SelectListboxDirective,
    SelectOptionDirective,
    ComboboxDirective,
    ComboboxInputDirective,
    ComboboxContentDirective,
    ComboboxListboxDirective,
    ComboboxOptionDirective,
    ...QUARTZ_FORMS,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form">
      <div
        qzSelect
        multiple
        formControlName="tags"
        #tags="qzSelect"
        [compareWith]="same"
        [displayWith]="name"
      >
        <button qzSelectTrigger aria-label="Tags">{{ tags.selectedLabel() || 'Pick' }}</button>
        <ng-template qzSelectContent>
          <div qzSelectListbox>
            @for (tag of all; track tag.id) {
              <button [qzSelectOption]="tag">{{ tag.name }}</button>
            }
          </div>
        </ng-template>
      </div>
      <div qzCombobox formControlName="city" #city="qzCombobox" [options]="cities">
        <input aria-label="City" qzComboboxInput />
        <ng-template qzComboboxContent>
          <ul qzComboboxListbox>
            @for (c of city.filteredOptions(); track c) {
              <li [qzComboboxOption]="c">{{ c }}</li>
            }
          </ul>
        </ng-template>
      </div>
      <div qzCombobox formControlName="langs" multiple #langs="qzCombobox" [options]="cities">
        <input aria-label="Langs" qzComboboxInput />
        <ng-template qzComboboxContent>
          <ul qzComboboxListbox>
            @for (c of langs.filteredOptions(); track c) {
              <li [qzComboboxOption]="c">{{ c }}</li>
            }
          </ul>
        </ng-template>
      </div>
    </form>
    <button>outside</button>
  `,
})
class FormsHost {
  readonly all = TAGS;
  readonly cities = ['Madrid', 'Paris', 'Prague'];
  readonly same = (a: Tag, b: Tag) => a.id === b.id;
  readonly name = (t: Tag) => t.name;
  readonly form = new FormGroup({
    tags: new FormControl<Tag[] | null>([{ id: 1, name: 'Angular' }]),
    city: new FormControl<string | null>('Paris'),
    langs: new FormControl<string[] | null>(['Madrid']),
  });
  readonly changes: string[] = [];
  constructor() {
    this.form.controls.tags.valueChanges.subscribe(() => this.changes.push('tags'));
    this.form.controls.city.valueChanges.subscribe(() => this.changes.push('city'));
    this.form.controls.langs.valueChanges.subscribe(() => this.changes.push('langs'));
  }
}

describe('Forms — advanced selection adapters', () => {
  afterEach(() => {
    document.querySelectorAll('[data-qz-overlay-container]').forEach((el) => el.remove());
  });

  async function setup() {
    const view = await render(FormsHost);
    return { ...view, host: view.fixture.componentInstance };
  }
  const city = () => screen.getByRole('combobox', { name: 'City' }) as HTMLInputElement;
  const langs = () => screen.getByRole('combobox', { name: 'Langs' }) as HTMLInputElement;
  const typeInto = (el: HTMLInputElement, value: string) => {
    el.value = value;
    fireEvent.input(el);
  };

  it('writes initial and programmatic values silently', async () => {
    const { host, fixture } = await setup();
    expect(screen.getByRole('button', { name: 'Tags' })).toHaveTextContent('Angular');
    expect(city().value).toBe('Paris');
    host.form.patchValue({ tags: [TAGS[1]], city: 'Madrid', langs: [] });
    await fixture.whenStable();
    expect(screen.getByRole('button', { name: 'Tags' })).toHaveTextContent('Signals');
    expect(city().value).toBe('Madrid');
    expect(host.changes).toEqual(['tags', 'city', 'langs']); // only the programmatic patch itself
    expect(host.form.dirty).toBe(false);
    expect(host.form.touched).toBe(false);
  });

  it('multiple Select: one array onChange per toggle, [] when emptied, null on reset', async () => {
    const { host, fixture } = await setup();
    fireEvent.click(screen.getByRole('button', { name: 'Tags' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Signals' }));
    expect(host.form.controls.tags.value).toEqual([TAGS[0], TAGS[1]]);
    fireEvent.click(screen.getByRole('option', { name: 'Angular' }));
    fireEvent.click(screen.getByRole('option', { name: 'Signals' }));
    expect(host.form.controls.tags.value).toEqual([]);
    expect(host.changes).toHaveLength(3);
    expect(host.form.controls.tags.dirty).toBe(true);

    host.form.controls.tags.reset();
    await fixture.whenStable();
    expect(host.form.controls.tags.value).toBeNull();
    expect(screen.getByRole('button', { name: 'Tags' })).toHaveTextContent('Pick');
    expect(screen.getByRole('option', { name: 'Angular' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('Combobox: typing does not notify Forms; choosing commits once', async () => {
    const { host } = await setup();
    typeInto(city(), 'pra');
    expect(host.changes.filter((c) => c === 'city')).toHaveLength(1); // clearing "Paris" by editing
    expect(host.form.controls.city.value).toBeNull();
    typeInto(city(), 'prag');
    expect(host.changes.filter((c) => c === 'city')).toHaveLength(1);
    fireEvent.click(await screen.findByRole('option', { name: 'Prague' }));
    expect(host.form.controls.city.value).toBe('Prague');
    expect(host.changes.filter((c) => c === 'city')).toHaveLength(2);
    expect(city().value).toBe('Prague');
  });

  it('Combobox: reset clears value and text silently; touched on blur; disabled blocks input', async () => {
    const { host, fixture } = await setup();
    typeInto(city(), 'x');
    const before = host.changes.length;
    host.form.controls.city.reset();
    await fixture.whenStable();
    expect(city().value).toBe('');
    expect(host.changes.length).toBe(before + 1); // the reset itself

    city().focus();
    fireEvent.keyDown(city(), { key: 'Tab' });
    city().blur();
    expect(host.form.controls.city.touched).toBe(true);

    host.form.controls.city.disable();
    await fixture.whenStable();
    expect(city()).toBeDisabled();
    host.form.controls.city.enable();
    await fixture.whenStable();
    expect(city()).toBeEnabled();
  });

  it('multiple Combobox: array commits, query resets, null writes []', async () => {
    const { host, fixture } = await setup();
    typeInto(langs(), 'par');
    fireEvent.click(await screen.findByRole('option', { name: 'Paris' }));
    expect(host.form.controls.langs.value).toEqual(['Madrid', 'Paris']);
    expect(langs().value).toBe('');
    host.form.controls.langs.setValue(null);
    await fixture.whenStable();
    expect(host.form.controls.langs.value).toBeNull();
    fireEvent.click(langs());
    typeInto(langs(), 'ma');
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Madrid' })).toHaveAttribute(
        'aria-selected',
        'false',
      ),
    );
  });
});
