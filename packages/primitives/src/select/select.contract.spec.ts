import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { afterEach, describe, expect, it } from 'vitest';
import { SelectContentDirective } from './select-content.directive';
import { SelectDirective } from './select.directive';
import { SelectListboxDirective } from './select-listbox.directive';
import { SelectOptionDirective } from './select-option.directive';
import { SelectTriggerDirective } from './select-trigger.directive';

const IMPORTS = [
  SelectDirective,
  SelectTriggerDirective,
  SelectContentDirective,
  SelectListboxDirective,
  SelectOptionDirective,
];

@Component({
  standalone: true,
  imports: IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button data-testid="before">Before</button>
    <span id="fruit-label">Favourite fruit</span>
    <div
      qzSelect
      #select="qzSelect"
      [(value)]="value"
      [disabled]="disabled()"
      (valueChangeCommitted)="commits.push($event)"
      (touched)="touchedCount = touchedCount + 1"
    >
      <button qzSelectTrigger [attr.aria-labelledby]="labelled() ? 'fruit-label' : null">
        {{ select.selectedLabel() || 'Pick' }}
      </button>
      <ng-template qzSelectContent>
        <div qzSelectListbox [attr.aria-label]="listboxLabel()">
          @for (item of items(); track item) {
            <button [qzSelectOption]="item">{{ item }}</button>
          }
        </div>
      </ng-template>
    </div>
    <button data-testid="after">After</button>
  `,
})
class Host {
  readonly labelled = signal(false);
  touchedCount = 0;
  commits: string[] = [];
  readonly value = signal<string | null>(null);
  readonly disabled = signal(false);
  readonly listboxLabel = signal<string | null>(null);
  readonly items = signal(['Apple', 'Pear', 'Plum']);
}

describe('Select contract (0.9)', () => {
  afterEach(() => {
    document.querySelectorAll('[data-qz-overlay-container]').forEach((el) => el.remove());
  });

  describe('accessible naming', () => {
    it('names the popup after the trigger when nothing else labels it', async () => {
      await render(Host);
      const trigger = screen.getByRole('button', { name: 'Pick' });
      fireEvent.click(trigger);

      const listbox = await screen.findByRole('listbox', { name: 'Pick' });
      expect(trigger.id).not.toBe('');
      expect(listbox).toHaveAttribute('aria-labelledby', trigger.id);
      expect(document.getElementById(listbox.getAttribute('aria-labelledby')!)).toBe(trigger);
    });

    it('inherits the trigger aria-labelledby so trigger and popup share one name', async () => {
      const { fixture } = await render(Host);
      fixture.componentInstance.labelled.set(true);
      await fixture.whenStable();
      fireEvent.click(screen.getByRole('button', { name: 'Favourite fruit' }));

      const listbox = await screen.findByRole('listbox', { name: 'Favourite fruit' });
      expect(listbox).toHaveAttribute('aria-labelledby', 'fruit-label');
    });

    it('lets the consumer label the popup explicitly, without also referencing the trigger', async () => {
      const { fixture } = await render(Host);
      fixture.componentInstance.listboxLabel.set('Fruit options');
      fireEvent.click(screen.getByRole('button', { name: 'Pick' }));

      const listbox = await screen.findByRole('listbox', { name: 'Fruit options' });
      expect(listbox).not.toHaveAttribute('aria-labelledby');
    });

    it('never leaves a dangling aria-controls while closed', async () => {
      await render(Host);
      const trigger = screen.getByRole('button', { name: 'Pick' });
      expect(trigger).not.toHaveAttribute('aria-controls');
      fireEvent.click(trigger);
      const listbox = await screen.findByRole('listbox');
      expect(trigger.getAttribute('aria-controls')).toBe(listbox.id);
      fireEvent.keyDown(listbox, { key: 'Escape' });
      await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
      expect(trigger).not.toHaveAttribute('aria-controls');
    });
  });

  describe('value semantics', () => {
    it('shows a value written before any option exists, and an unknown value, then recovers on null', async () => {
      const { fixture } = await render(Host);
      const host = fixture.componentInstance;
      host.value.set('Kiwi');
      await fixture.whenStable();
      const trigger = screen.getByRole('button', { name: 'Kiwi' });

      fireEvent.click(trigger);
      const options = await screen.findAllByRole('option');
      expect(options.every((o) => o.getAttribute('aria-selected') === 'false')).toBe(true);
      await waitFor(() => expect(document.activeElement).toBe(options[0]));
      fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
      expect(host.value()).toBe('Kiwi');

      host.value.set(null);
      await fixture.whenStable();
      expect(screen.getByRole('button', { name: 'Pick' })).toBeInTheDocument();
    });

    it('commits only user changes: not programmatic writes, not re-selecting the current value', async () => {
      const { fixture } = await render(Host);
      const host = fixture.componentInstance;
      host.value.set('Pear');
      await fixture.whenStable();
      expect(host.commits).toEqual([]);

      fireEvent.click(screen.getByRole('button', { name: 'Pear' }));
      fireEvent.click(await screen.findByRole('option', { name: 'Pear' }));
      expect(host.commits).toEqual([]);

      fireEvent.click(screen.getByRole('button', { name: 'Pear' }));
      fireEvent.click(await screen.findByRole('option', { name: 'Plum' }));
      expect(host.commits).toEqual(['Plum']);
      expect(host.value()).toBe('Plum');
    });

    it('reflects the new selection when options are added and the value changes while open', async () => {
      const { fixture } = await render(Host);
      const host = fixture.componentInstance;
      fireEvent.click(screen.getByRole('button', { name: 'Pick' }));
      await screen.findByRole('listbox');

      host.items.set(['Apple', 'Pear', 'Plum', 'Fig']);
      host.value.set('Fig');
      await fixture.whenStable();
      expect(screen.getByRole('option', { name: 'Fig' })).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('keyboard and focus', () => {
    it('Tab closes the popup without committing and hands focus back to the trigger', async () => {
      const { fixture } = await render(Host);
      const trigger = screen.getByRole('button', { name: 'Pick' });
      fireEvent.click(trigger);
      const listbox = await screen.findByRole('listbox');
      await waitFor(() => expect(listbox.contains(document.activeElement)).toBe(true));

      fireEvent.keyDown(listbox, { key: 'Tab' });

      await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
      expect(document.activeElement).toBe(trigger);
      expect(fixture.componentInstance.value()).toBeNull();
      expect(fixture.componentInstance.commits).toEqual([]);
    });

    it('reopens after selection with the selected option active', async () => {
      const { fixture } = await render(Host);
      const trigger = screen.getByRole('button', { name: 'Pick' });
      fireEvent.click(trigger);
      fireEvent.click(await screen.findByRole('option', { name: 'Plum' }));
      await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
      expect(fixture.componentInstance.value()).toBe('Plum');

      fireEvent.keyDown(screen.getByRole('button', { name: 'Plum' }), { key: 'Enter' });
      const plum = await screen.findByRole('option', { name: 'Plum' });
      await waitFor(() => expect(document.activeElement).toBe(plum));
    });

    it('typeahead moves the active option without selecting it', async () => {
      const { fixture } = await render(Host);
      fireEvent.click(screen.getByRole('button', { name: 'Pick' }));
      const listbox = await screen.findByRole('listbox');
      await waitFor(() => expect(listbox.contains(document.activeElement)).toBe(true));

      fireEvent.keyDown(listbox, { key: 'p' });
      fireEvent.keyDown(listbox, { key: 'l' });
      await waitFor(() =>
        expect(document.activeElement).toBe(screen.getByRole('option', { name: 'Plum' })),
      );
      expect(fixture.componentInstance.value()).toBeNull();
    });
  });

  describe('touched and disabled', () => {
    it('emits touched on trigger blur while closed, not while the popup takes focus', async () => {
      const { fixture } = await render(Host);
      const host = fixture.componentInstance;
      const trigger = screen.getByRole('button', { name: 'Pick' });
      trigger.focus();
      fireEvent.click(trigger);
      await screen.findByRole('listbox');
      expect(host.touchedCount).toBe(0);

      fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
      await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
      expect(host.touchedCount).toBe(0);
      screen.getByTestId('after').focus();
      expect(host.touchedCount).toBe(1);
    });

    it('emits touched when an outside pointer closes the popup', async () => {
      const { fixture } = await render(Host);
      fireEvent.click(screen.getByRole('button', { name: 'Pick' }));
      await screen.findByRole('listbox');
      fireEvent.pointerDown(screen.getByTestId('after'));
      await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
      expect(fixture.componentInstance.touchedCount).toBe(1);
    });

    it('does not open when disabled and closes an open popup when it becomes disabled', async () => {
      const { fixture } = await render(Host);
      const host = fixture.componentInstance;
      host.disabled.set(true);
      await fixture.whenStable();
      const trigger = screen.getByRole('button', { name: 'Pick' });
      fireEvent.click(trigger);
      fireEvent.keyDown(trigger, { key: 'ArrowDown' });
      expect(screen.queryByRole('listbox')).toBeNull();

      host.disabled.set(false);
      await fixture.whenStable();
      fireEvent.click(trigger);
      await screen.findByRole('listbox');
      host.disabled.set(true);
      await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    });

    it('cleans up the overlay when destroyed while open', async () => {
      const { fixture } = await render(Host);
      fireEvent.click(screen.getByRole('button', { name: 'Pick' }));
      await screen.findByRole('listbox');
      fixture.destroy();
      expect(screen.queryByRole('listbox')).toBeNull();
      document
        .querySelectorAll('[data-qz-overlay-container]')
        .forEach((container) => expect(container.childElementCount).toBe(0));
    });
  });
});
