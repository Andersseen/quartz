import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { render, screen, fireEvent } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { ListboxDirective } from './listbox.directive';
import { ListboxOptionDirective } from './listbox-option.directive';

@Component({
  standalone: true,
  imports: [ListboxDirective, ListboxOptionDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzListbox
      [value]="selected()"
      (valueChange)="selected.set($event)"
      [multiple]="multiple()"
    >
      <div qzListboxOption="one">One</div>
      <div qzListboxOption="two" [qzListboxOptionDisabled]="disabled()">Two</div>
      <div qzListboxOption="three">Three</div>
    </div>
  `,
})
class Host {
  readonly selected = signal<string | string[] | null>(null);
  readonly multiple = signal(false);
  readonly disabled = signal(false);
}

describe('ListboxDirective', () => {
  it('applies listbox semantics and activates the first enabled option', async () => {
    await render(Host);
    const listbox = screen.getByRole('listbox');
    const options = screen.getAllByRole('option');
    expect(listbox).toHaveAttribute('tabindex', '0');
    expect(listbox).toHaveAttribute('aria-activedescendant', options[0].id);
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('navigates with arrows and skips disabled options', async () => {
    const { fixture } = await render(Host);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    const listbox = screen.getByRole('listbox');
    const options = screen.getAllByRole('option');
    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    fixture.detectChanges();
    expect(listbox).toHaveAttribute('aria-activedescendant', options[2].id);
  });

  it('selects the active option with Enter and reflects programmatic values', async () => {
    const { fixture } = await render(Host);
    const listbox = screen.getByRole('listbox');
    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    fireEvent.keyDown(listbox, { key: 'Enter' });
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe('two');
    expect(screen.getByText('Two')).toHaveAttribute('data-qz-selected', '');

    fixture.componentInstance.selected.set('three');
    fixture.detectChanges();
    expect(screen.getByText('Three')).toHaveAttribute('aria-selected', 'true');
  });

  it('toggles values in multi-select mode', async () => {
    const { fixture } = await render(Host);
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    fireEvent.click(screen.getByText('One'));
    fireEvent.click(screen.getByText('Three'));
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toEqual(['one', 'three']);
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
  });

  it('supports Home, End and type-ahead', async () => {
    const { fixture } = await render(Host);
    const listbox = screen.getByRole('listbox');
    const options = screen.getAllByRole('option');
    fireEvent.keyDown(listbox, { key: 'End' });
    expect(listbox).toHaveAttribute('aria-activedescendant', options[2].id);
    fireEvent.keyDown(listbox, { key: 'Home' });
    expect(listbox).toHaveAttribute('aria-activedescendant', options[0].id);
    fireEvent.keyDown(listbox, { key: 't' });
    fixture.detectChanges();
    expect(listbox).toHaveAttribute('aria-activedescendant', options[1].id);
  });
});
