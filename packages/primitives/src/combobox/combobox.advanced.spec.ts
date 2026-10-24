import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { afterEach, describe, expect, it } from 'vitest';
import { ComboboxContentDirective } from './combobox-content.directive';
import {
  ComboboxGroupDirective,
  ComboboxGroupLabelDirective,
  ComboboxSeparatorDirective,
} from './combobox-group.directive';
import { ComboboxInputDirective } from './combobox-input.directive';
import { ComboboxListboxDirective } from './combobox-listbox.directive';
import { ComboboxOptionDirective } from './combobox-option.directive';
import { createLatestRequest } from './combobox-request';
import { ComboboxDirective } from './combobox.directive';

const IMPORTS = [
  ComboboxDirective,
  ComboboxInputDirective,
  ComboboxContentDirective,
  ComboboxListboxDirective,
  ComboboxOptionDirective,
  ComboboxGroupDirective,
  ComboboxGroupLabelDirective,
  ComboboxSeparatorDirective,
];

@Component({
  standalone: true,
  imports: IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzCombobox
      #combo="qzCombobox"
      [options]="items"
      [multiple]="multiple()"
      [allowDeselect]="allowDeselect()"
      [(value)]="value"
      [(values)]="values"
      (valueChangeCommitted)="valueCommits.push($event)"
      (valuesChangeCommitted)="valuesCommits.push($event)"
      (queryChanged)="queries.push($event)"
    >
      <input aria-label="Fruit" qzComboboxInput />
      <ng-template qzComboboxContent>
        <ul qzComboboxListbox aria-label="Fruits">
          <li qzComboboxGroup>
            <span qzComboboxGroupLabel>Citrus</span>
            @for (item of combo.filteredOptions(); track item) {
              <div [qzComboboxOption]="item" [qzComboboxOptionDisabled]="item === 'Banana'">
                {{ item }}
              </div>
            }
          </li>
        </ul>
      </ng-template>
    </div>
  `,
})
class Host {
  readonly items = ['Apple', 'Banana', 'Apricot', 'Cherry'];
  readonly multiple = signal(false);
  readonly allowDeselect = signal(false);
  readonly value = signal<string | null>(null);
  readonly values = signal<readonly string[]>([]);
  readonly valueCommits: (string | null)[] = [];
  readonly valuesCommits: (readonly string[])[] = [];
  readonly queries: string[] = [];
}

describe('Combobox — advanced contract', () => {
  afterEach(() => {
    document.querySelectorAll('[data-qz-overlay-container]').forEach((el) => el.remove());
  });

  const input = () => screen.getByRole('combobox') as HTMLInputElement;
  const type = (value: string) => {
    input().value = value;
    fireEvent.input(input());
  };

  it('does not filter, commit or rewrite the query during IME composition', async () => {
    const { fixture } = await render(Host);
    const host = fixture.componentInstance;
    input().focus();
    fireEvent.compositionStart(input());
    input().value = 'ap';
    fireEvent.input(input(), { isComposing: true });
    fireEvent.keyDown(input(), { key: 'Enter', isComposing: true });
    expect(host.queries).toEqual([]);
    expect(input().value).toBe('ap');
    expect(screen.queryByRole('listbox')).toBeNull();

    input().value = 'apr';
    fireEvent.compositionEnd(input());
    await screen.findByRole('listbox');
    expect(host.queries).toEqual(['apr']);
    expect(screen.getAllByRole('option').map((o) => o.textContent?.trim())).toEqual(['Apricot']);
    expect(host.valueCommits).toEqual([]);
  });

  it('single: typing is not a commit; choosing commits once; editing a selection clears it', async () => {
    const { fixture } = await render(Host);
    const host = fixture.componentInstance;
    type('ch');
    fireEvent.click(await screen.findByRole('option', { name: 'Cherry' }));
    fixture.detectChanges();
    expect(host.value()).toBe('Cherry');
    expect(host.valueCommits).toEqual(['Cherry']);
    expect(input().value).toBe('Cherry');

    type('Cherr');
    expect(host.value()).toBeNull();
    expect(host.valueCommits).toEqual(['Cherry', null]);
    type('Cher'); // no selection left: pure typing commits nothing
    expect(host.valueCommits).toEqual(['Cherry', null]);
  });

  it('allowDeselect clears the selection when the selected option is chosen again', async () => {
    const { fixture } = await render(Host);
    const host = fixture.componentInstance;
    host.allowDeselect.set(true);
    fixture.detectChanges();
    type('app');
    fireEvent.click(await screen.findByRole('option', { name: 'Apple' }));
    fixture.detectChanges();
    expect(host.value()).toBe('Apple');
    type('Apple');
    expect(host.value()).toBe('Apple');
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('option', { name: 'Apple' }));
    fixture.detectChanges();
    expect(host.value()).toBeNull();
    expect(input().value).toBe('');
    expect(host.valueCommits).toEqual(['Apple', null]);
  });

  it('multiple: toggles values, keeps the popup open, resets the query and exposes ARIA', async () => {
    const { fixture } = await render(Host);
    const host = fixture.componentInstance;
    host.multiple.set(true);
    fixture.detectChanges();
    type('a');
    const listbox = await screen.findByRole('listbox');
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    fireEvent.click(screen.getByRole('option', { name: 'Apple' }));
    fireEvent.click(screen.getByRole('option', { name: 'Apricot' }));
    fixture.detectChanges();
    expect(host.values()).toEqual(['Apple', 'Apricot']);
    expect(host.valuesCommits).toHaveLength(2);
    expect(input().value).toBe('');
    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(input()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('option', { name: 'Apple' }));
    expect(host.values()).toEqual(['Apricot']);
    expect(screen.getByRole('group', { name: 'Citrus' })).toBeTruthy();
  });

  it('keeps aria-controls/activedescendant free of dangling references', async () => {
    await render(Host);
    expect(input()).not.toHaveAttribute('aria-controls');
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    const listbox = await screen.findByRole('listbox');
    expect(input()).toHaveAttribute('aria-controls', listbox.id);
    expect(input()).toHaveAttribute('aria-autocomplete', 'list');
    fireEvent.keyDown(input(), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(input()).toHaveAttribute('aria-expanded', 'false');
    expect(input()).not.toHaveAttribute('aria-controls');
    expect(input()).not.toHaveAttribute('aria-activedescendant');
  });
});

describe('createLatestRequest', () => {
  @Component({ standalone: true, template: '', changeDetection: ChangeDetectionStrategy.OnPush })
  class Probe {
    readonly latest = createLatestRequest();
  }

  const deferred = <T>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => (resolve = r));
    return { promise, resolve };
  };

  it('discards stale results and aborts the superseded request', async () => {
    const { fixture } = await render(Probe);
    const { latest } = fixture.componentInstance;
    const first = deferred<string>();
    const second = deferred<string>();
    let firstSignal!: AbortSignal;
    const a = latest.run((signal) => ((firstSignal = signal), first.promise));
    const b = latest.run(() => second.promise);
    expect(firstSignal.aborted).toBe(true);
    second.resolve('new');
    first.resolve('old'); // arrives last, but is stale
    expect(await b).toBe('new');
    expect(await a).toBeUndefined();
  });

  it('aborts the in-flight request on destroy and swallows its abort error', async () => {
    const { fixture } = await render(Probe);
    const { latest } = fixture.componentInstance;
    let captured!: AbortSignal;
    const pending = latest.run(
      (signal) =>
        new Promise<string>((_, reject) => {
          captured = signal;
          signal.addEventListener('abort', () => reject(new DOMException('x', 'AbortError')));
        }),
    );
    fixture.destroy();
    expect(captured.aborted).toBe(true);
    expect(await pending).toBeUndefined();
  });

  it('propagates real errors of the current request', async () => {
    const { fixture } = await render(Probe);
    await expect(
      fixture.componentInstance.latest.run(() => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');
  });
});
