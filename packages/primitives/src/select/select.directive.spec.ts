import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { afterEach, describe, expect, it } from 'vitest';
import { SelectContentDirective } from './select-content.directive';
import { SelectDirective } from './select.directive';
import { SelectListboxDirective } from './select-listbox.directive';
import { SelectOptionDirective } from './select-option.directive';
import { SelectTriggerDirective } from './select-trigger.directive';

const SELECT_IMPORTS = [
  SelectDirective,
  SelectTriggerDirective,
  SelectContentDirective,
  SelectListboxDirective,
  SelectOptionDirective,
];

@Component({
  standalone: true,
  imports: SELECT_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div qzSelect #select="qzSelect" [(value)]="value">
      <button qzSelectTrigger>{{ select.selectedLabel() || 'Choose' }}</button>
      <ng-template qzSelectContent>
        <div qzSelectListbox>
          @for (item of items(); track item) {
            <button [qzSelectOption]="item" [qzSelectOptionDisabled]="item === disabledItem()">
              {{ item }}
            </button>
          }
        </div>
      </ng-template>
    </div>
    <button>After</button>
  `,
})
class StringSelectHost {
  readonly value = signal<string | null>(null);
  readonly items = signal(['Spain', 'France', 'Germany']);
  readonly disabledItem = signal('France');
}

interface Country {
  code: string;
  name: string;
}

@Component({
  standalone: true,
  imports: SELECT_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzSelect
      #select="qzSelect"
      [(value)]="value"
      [displayWith]="displayCountry"
      [compareWith]="compareCountry"
    >
      <button qzSelectTrigger>{{ select.selectedLabel() }}</button>
      <ng-template qzSelectContent>
        <div qzSelectListbox>
          @for (country of countries(); track country.code) {
            <button [qzSelectOption]="country" [qzSelectOptionLabel]="country.name">
              {{ country.name }}
            </button>
          }
        </div>
      </ng-template>
    </div>
  `,
})
class ObjectSelectHost {
  readonly countries = signal<Country[]>([
    { code: 'es', name: 'Spain' },
    { code: 'fr', name: 'France' },
  ]);
  readonly value = signal<Country | null>({ code: 'fr', name: 'France' });
  readonly displayCountry = (country: Country) => country.name;
  readonly compareCountry = (a: Country, b: Country) => a.code === b.code;
}

describe('Select', () => {
  afterEach(() => {
    document.querySelectorAll('[data-qz-overlay-container]').forEach((el) => el.remove());
  });

  it('opens a listbox from the trigger and exposes ARIA state', async () => {
    await render(StringSelectHost);
    const trigger = screen.getByRole('button', { name: 'Choose' });

    fireEvent.click(trigger);

    const listbox = await screen.findByRole('listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', listbox.id);
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('selects an option, closes, and restores focus to the trigger', async () => {
    const { fixture } = await render(StringSelectHost);
    const trigger = screen.getByRole('button', { name: 'Choose' });

    fireEvent.click(trigger);
    fireEvent.click(await screen.findByRole('option', { name: 'Germany' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('Germany');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it('opens from keyboard, skips disabled options, and selects the active option', async () => {
    const { fixture } = await render(StringSelectHost);
    const trigger = screen.getByRole('button', { name: 'Choose' });

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const options = await screen.findAllByRole('option');
    await waitFor(() => expect(document.activeElement).toBe(options[0]));

    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(options[2]);

    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Enter' });
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('Germany');
  });

  it('closes with Escape without changing the value', async () => {
    const { fixture } = await render(StringSelectHost);
    const trigger = screen.getByRole('button', { name: 'Choose' });

    fireEvent.click(trigger);
    await screen.findByRole('listbox');
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });

    expect(fixture.componentInstance.value()).toBeNull();
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it('supports object values with displayWith and compareWith', async () => {
    await render(ObjectSelectHost);
    const trigger = screen.getByRole('button', { name: 'France' });

    fireEvent.click(trigger);

    const options = await screen.findAllByRole('option');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
  });
});
