import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { afterEach, describe, expect, it } from 'vitest';
import { SelectContentDirective } from './select-content.directive';
import {
  SelectGroupDirective,
  SelectGroupLabelDirective,
  SelectSeparatorDirective,
} from './select-group.directive';
import { SelectListboxDirective } from './select-listbox.directive';
import { SelectOptionDirective } from './select-option.directive';
import { SelectTriggerDirective } from './select-trigger.directive';
import { SelectDirective } from './select.directive';

interface Tag {
  id: number;
  name: string;
}

@Component({
  standalone: true,
  imports: [
    SelectDirective,
    SelectTriggerDirective,
    SelectContentDirective,
    SelectListboxDirective,
    SelectOptionDirective,
    SelectGroupDirective,
    SelectGroupLabelDirective,
    SelectSeparatorDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzSelect
      #select="qzSelect"
      multiple
      [(values)]="selected"
      [closeOnSelect]="closeOnSelect()"
      [displayWith]="display"
      [compareWith]="compare"
      (valuesChangeCommitted)="commits.push($event)"
    >
      <button qzSelectTrigger aria-label="Tags">
        {{ select.selectedLabel() || 'Pick tags' }}
      </button>
      <ng-template qzSelectContent>
        <div qzSelectListbox>
          <div qzSelectGroup>
            <div qzSelectGroupLabel>Frontend</div>
            @for (tag of frontend(); track tag.id) {
              <button [qzSelectOption]="tag" [qzSelectOptionDisabled]="tag.id === 2">
                {{ tag.name }}
              </button>
            }
          </div>
          <div qzSelectSeparator></div>
          <div qzSelectGroup>
            <div qzSelectGroupLabel>Backend</div>
            <button [qzSelectOption]="{ id: 10, name: 'Node' }">Node</button>
          </div>
        </div>
      </ng-template>
    </div>
    <button>After</button>
  `,
})
class MultiHost {
  readonly selected = signal<readonly Tag[]>([{ id: 99, name: 'Offscreen' }]);
  readonly closeOnSelect = signal<boolean | undefined>(undefined);
  readonly frontend = signal<Tag[]>([
    { id: 1, name: 'Angular' },
    { id: 2, name: 'React' },
    { id: 3, name: 'Svelte' },
  ]);
  readonly commits: (readonly Tag[])[] = [];
  readonly display = (tag: Tag) => tag.name;
  readonly compare = (a: Tag, b: Tag) => a.id === b.id;
}

describe('Select — multiple values and groups', () => {
  afterEach(() => {
    document.querySelectorAll('[data-qz-overlay-container]').forEach((el) => el.remove());
  });

  async function open() {
    const view = await render(MultiHost);
    const trigger = screen.getByRole('button', { name: 'Tags' });
    fireEvent.click(trigger);
    await screen.findByRole('listbox');
    return { ...view, host: view.fixture.componentInstance, trigger };
  }

  it('labels a value whose option is not rendered and marks the listbox multiselectable', async () => {
    const { trigger } = await open();
    expect(trigger).toHaveTextContent('Offscreen');
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
    expect(
      screen.getAllByRole('option').every((o) => o.getAttribute('aria-selected') === 'false'),
    ).toBe(true);
  });

  it('toggles by pointer without closing, using compareWith identity and one commit per toggle', async () => {
    const { host, fixture, trigger } = await open();
    fireEvent.click(screen.getByRole('option', { name: 'Angular' }));
    fireEvent.click(screen.getByRole('option', { name: 'Svelte' }));
    fixture.detectChanges();
    expect(host.selected().map((t) => t.id)).toEqual([99, 1, 3]);
    expect(host.commits).toHaveLength(2);
    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(screen.getByRole('option', { name: 'Angular' }));
    expect(host.selected().map((t) => t.id)).toEqual([99, 3]);
    expect(trigger).toHaveTextContent('Offscreen, Svelte');
    // a structurally equal but different object is the same option
    expect(screen.getByRole('option', { name: 'Svelte' })).toHaveAttribute('aria-selected', 'true');
  });

  it('toggles with Space/Enter, skips disabled options and groups, keeps focus on the active option', async () => {
    const { host, fixture } = await open();
    const options = screen.getAllByRole('option');
    await waitFor(() => expect(document.activeElement).toBe(options[0]));
    const listbox = screen.getByRole('listbox');
    fireEvent.keyDown(listbox, { key: ' ' });
    fireEvent.keyDown(listbox, { key: 'ArrowDown' }); // React is disabled
    expect(document.activeElement).toBe(options[2]);
    fireEvent.keyDown(listbox, { key: 'Enter' });
    fireEvent.keyDown(listbox, { key: 'ArrowDown' }); // crosses the separator and a group label
    expect(document.activeElement).toBe(options[3]);
    fixture.detectChanges();
    expect(host.selected().map((t) => t.id)).toEqual([99, 1, 3]);
    expect(screen.getByRole('listbox')).toBeTruthy();
  });

  it('exposes accessible groups and keeps separators out of the options', async () => {
    await open();
    const groups = screen.getAllByRole('group');
    expect(groups.map((g) => g.getAttribute('aria-labelledby'))).toEqual(
      groups.map((g) => g.querySelector('[qzSelectGroupLabel]')!.id),
    );
    expect(screen.getByRole('group', { name: 'Frontend' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Backend' })).toBeTruthy();
    expect(screen.getByRole('separator')).toBeTruthy();
    expect(screen.getAllByRole('option')).toHaveLength(4);
  });

  it('closes on selection when closeOnSelect is true and restores focus to the trigger', async () => {
    const { host, fixture, trigger } = await open();
    host.closeOnSelect.set(true);
    fixture.detectChanges();
    fireEvent.click(screen.getByRole('option', { name: 'Angular' }));
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it('does not emit commits for programmatic value changes', async () => {
    const { host, fixture } = await open();
    host.selected.set([{ id: 1, name: 'Angular' }]);
    fixture.detectChanges();
    expect(host.commits).toHaveLength(0);
    expect(screen.getByRole('option', { name: 'Angular' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
