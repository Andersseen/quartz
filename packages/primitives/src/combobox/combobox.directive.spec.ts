import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { afterEach, describe, expect, it } from 'vitest';
import { ComboboxContentDirective } from './combobox-content.directive';
import { ComboboxDirective } from './combobox.directive';
import { ComboboxInputDirective } from './combobox-input.directive';
import { ComboboxListboxDirective } from './combobox-listbox.directive';
import { ComboboxOptionDirective } from './combobox-option.directive';
import { ComboboxTriggerDirective } from './combobox-trigger.directive';

const COMBOBOX_IMPORTS = [
  ComboboxDirective,
  ComboboxInputDirective,
  ComboboxContentDirective,
  ComboboxListboxDirective,
  ComboboxOptionDirective,
  ComboboxTriggerDirective,
];

@Component({
  standalone: true,
  imports: COMBOBOX_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzCombobox
      #combo="qzCombobox"
      [options]="items()"
      [(value)]="selected"
      [(inputValue)]="query"
      [(open)]="open"
      [filter]="filter()"
      [loading]="loading()"
      [allowFreeform]="allowFreeform()"
    >
      <input aria-label="Fruit" qzComboboxInput />
      <button qzComboboxTrigger>Toggle</button>

      <ng-template qzComboboxContent>
        <ul qzComboboxListbox>
          @for (item of combo.filteredOptions(); track item) {
            <li [qzComboboxOption]="item" [qzComboboxOptionDisabled]="item === disabledItem()">
              {{ item }}
            </li>
          }
          @if (combo.empty() && !combo.loading()) {
            <li>No results</li>
          }
          @if (combo.loading()) {
            <li>Loading</li>
          }
        </ul>
      </ng-template>
    </div>
    <button>After</button>
  `,
})
class StringHost {
  readonly items = signal(['Apple', 'Banana', 'Apricot']);
  readonly selected = signal<string | null>(null);
  readonly query = signal('');
  readonly open = signal(false);
  readonly loading = signal(false);
  readonly allowFreeform = signal(false);
  readonly disabledItem = signal('Banana');
  readonly filter = signal<((option: string, query: string, label: string) => boolean) | null>(
    (option, query, label) => label.toLowerCase().includes(query.toLowerCase()),
  );
}

interface User {
  id: number;
  name: string;
}

@Component({
  standalone: true,
  imports: COMBOBOX_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzCombobox
      #combo="qzCombobox"
      [options]="users()"
      [(value)]="selected"
      [displayWith]="displayUser"
      [compareWith]="compareUsers"
    >
      <input aria-label="User" qzComboboxInput />

      <ng-template qzComboboxContent>
        <div qzComboboxListbox>
          @for (user of combo.filteredOptions(); track user.id) {
            <div [qzComboboxOption]="user" [qzComboboxOptionLabel]="user.name">
              {{ user.name }}
            </div>
          }
        </div>
      </ng-template>
    </div>
  `,
})
class ObjectHost {
  readonly users = signal<User[]>([
    { id: 1, name: 'Ada' },
    { id: 2, name: 'Grace' },
  ]);
  readonly selected = signal<User | null>({ id: 2, name: 'Grace' });
  readonly displayUser = (user: User) => user.name;
  readonly compareUsers = (a: User, b: User) => a.id === b.id;
}

describe('Combobox', () => {
  afterEach(() => {
    document.querySelectorAll('[data-qz-overlay-container]').forEach((el) => el.remove());
  });

  it('applies combobox ARIA to the input and opens from typing', async () => {
    const { fixture } = await render(StringHost);
    const input = screen.getByRole('combobox', { name: 'Fruit' });

    expect(input).toHaveAttribute('aria-expanded', 'false');
    fireEvent.input(input, { target: { value: 'ap' } });
    fixture.detectChanges();

    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent?.trim())).toEqual(['Apple', 'Apricot']);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
  });

  it('keeps focus on the input while arrows update the active descendant', async () => {
    const { fixture } = await render(StringHost);
    const input = screen.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement;
    input.focus();

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fixture.detectChanges();
    const options = await screen.findAllByRole('option');

    expect(document.activeElement).toBe(input);
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fixture.detectChanges();

    expect(document.activeElement).toBe(input);
    expect(input).toHaveAttribute('aria-activedescendant', options[2].id);
    expect(options[1]).toHaveAttribute('aria-disabled', 'true');
  });

  it('selects the active option with Enter and closes', async () => {
    const { fixture } = await render(StringHost);
    const input = screen.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement;

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    await screen.findAllByRole('option');
    fireEvent.keyDown(input, { key: 'Enter' });
    fixture.detectChanges();

    expect(fixture.componentInstance.selected()).toBe('Apple');
    expect(fixture.componentInstance.query()).toBe('Apple');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(input));
  });

  it('closes on Escape and restores strict input text without selecting active option', async () => {
    const { fixture } = await render(StringHost);
    const input = screen.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement;

    fireEvent.input(input, { target: { value: 'app' } });
    await screen.findAllByRole('option');
    fireEvent.keyDown(input, { key: 'Escape' });
    fixture.detectChanges();

    expect(fixture.componentInstance.selected()).toBeNull();
    expect(fixture.componentInstance.query()).toBe('');
    expect(input.value).toBe('');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
  });

  it('lets Tab move natively while closing the popup', async () => {
    await render(StringHost);
    const input = screen.getByRole('combobox', { name: 'Fruit' });

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    await screen.findByRole('listbox');

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    input.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
  });

  it('supports controlled open state, empty content and loading state', async () => {
    const { fixture } = await render(StringHost);
    fixture.componentInstance.filter.set(() => false);
    fixture.componentInstance.loading.set(true);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    expect(await screen.findByText('Loading')).toBeInTheDocument();
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-busy', 'true');

    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();

    expect(await screen.findByText('No results')).toBeInTheDocument();
  });

  it('supports object values with displayWith and compareWith across async-style replacement', async () => {
    const { fixture } = await render(ObjectHost);
    const input = screen.getByRole('combobox', { name: 'User' }) as HTMLInputElement;

    expect(input.value).toBe('Grace');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    await screen.findAllByRole('option');
    fixture.componentInstance.users.set([
      { id: 1, name: 'Ada' },
      { id: 2, name: 'Grace Hopper' },
    ]);
    fixture.detectChanges();

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Grace Hopper' })).toHaveAttribute(
        'data-qz-selected',
        '',
      ),
    );
  });

  it('does not select with Enter during IME composition and filters after compositionend', async () => {
    const { fixture } = await render(StringHost);
    const input = screen.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement;

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    await screen.findAllByRole('option');
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: 'Enter' });
    fixture.detectChanges();

    expect(fixture.componentInstance.selected()).toBeNull();
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    input.value = 'ban';
    fireEvent.compositionEnd(input);
    fixture.detectChanges();

    expect(fixture.componentInstance.query()).toBe('ban');
    expect(await screen.findByRole('option', { name: 'Banana' })).toBeInTheDocument();
  });

  it('dismisses from outside pointer without committing the active option', async () => {
    const { fixture } = await render(StringHost);
    const input = screen.getByRole('combobox', { name: 'Fruit' });

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    await screen.findByRole('listbox');
    await new Promise((resolve) => document.defaultView?.setTimeout(resolve, 10));

    const outside = document.createElement('button');
    outside.textContent = 'Outside';
    document.body.appendChild(outside);

    fireEvent.pointerDown(outside);
    fixture.detectChanges();

    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(fixture.componentInstance.selected()).toBeNull();

    outside.remove();
  });
});
