import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import {
  ListboxGroupDirective,
  ListboxGroupLabelDirective,
  ListboxSeparatorDirective,
} from './listbox-group.directive';
import { ListboxOptionDirective } from './listbox-option.directive';
import { ListboxDirective } from './listbox.directive';

@Component({
  standalone: true,
  imports: [
    ListboxDirective,
    ListboxOptionDirective,
    ListboxGroupDirective,
    ListboxGroupLabelDirective,
    ListboxSeparatorDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzListbox
      aria-label="Fruit"
      [(value)]="value"
      (valueChangeCommitted)="commits.push($event)"
    >
      <div qzListboxGroup>
        <div qzListboxGroupLabel>Citrus</div>
        <div qzListboxOption="lemon">Lemon</div>
        <div qzListboxOption="lime" qzListboxOptionDisabled>Lime</div>
      </div>
      <div qzListboxSeparator></div>
      @if (showBerries()) {
        <div qzListboxGroup>
          <div qzListboxGroupLabel>Berries</div>
          <div qzListboxOption="fig">Fig</div>
        </div>
      }
      <div qzListboxGroup>
        <div qzListboxGroupLabel>Stone</div>
        <div qzListboxOption="plum">Plum</div>
      </div>
    </div>
  `,
})
class GroupedHost {
  readonly value = signal<string | null>(null);
  readonly showBerries = signal(true);
  readonly commits: unknown[] = [];
}

describe('Listbox sections', () => {
  it('names groups from their label, excludes headers/separators from options and navigation', async () => {
    const { fixture } = await render(GroupedHost);
    expect(screen.getByRole('group', { name: 'Citrus' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Berries' })).toBeTruthy();
    expect(screen.queryByRole('separator')).toBeNull();
    expect(document.querySelector('[qzListboxSeparator]')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByRole('option')).toHaveLength(4);

    const listbox = screen.getByRole('listbox');
    const active = () => listbox.getAttribute('aria-activedescendant');
    fireEvent.keyDown(listbox, { key: 'Home' });
    expect(active()).toBe(screen.getByRole('option', { name: 'Lemon' }).id);
    fireEvent.keyDown(listbox, { key: 'ArrowDown' }); // skips disabled Lime + label/separator
    expect(active()).toBe(screen.getByRole('option', { name: 'Fig' }).id);
    fireEvent.keyDown(listbox, { key: 'End' });
    expect(active()).toBe(screen.getByRole('option', { name: 'Plum' }).id);
    expect(fixture.componentInstance.value()).toBeNull();
    expect(fixture.componentInstance.commits).toHaveLength(0);
  });

  it('keeps selection independent of the active option and commits once', async () => {
    const { fixture } = await render(GroupedHost);
    const listbox = screen.getByRole('listbox');
    fireEvent.click(screen.getByRole('option', { name: 'Fig' }));
    fireEvent.keyDown(listbox, { key: 'End' });
    expect(listbox.getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: 'Plum' }).id,
    );
    expect(screen.getByRole('option', { name: 'Fig' })).toHaveAttribute('aria-selected', 'true');
    expect(fixture.componentInstance.commits).toEqual(['fig']);
  });

  it('typeahead ignores labels and handles dynamic sections', async () => {
    const { fixture } = await render(GroupedHost);
    const listbox = screen.getByRole('listbox');
    fireEvent.keyDown(listbox, { key: 'Home' });
    const before = listbox.getAttribute('aria-activedescendant');
    fireEvent.keyDown(listbox, { key: 'b' }); // "Berries" label must not match
    expect(listbox.getAttribute('aria-activedescendant')).toBe(before);
    await new Promise((resolve) => setTimeout(resolve, 600)); // typeahead buffer expires
    fireEvent.keyDown(listbox, { key: 'p' });
    expect(listbox.getAttribute('aria-activedescendant')).toBe(
      screen.getByRole('option', { name: 'Plum' }).id,
    );
    fixture.componentInstance.showBerries.set(false);
    fixture.detectChanges();
    expect(screen.queryByRole('group', { name: 'Berries' })).toBeNull();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });
});
