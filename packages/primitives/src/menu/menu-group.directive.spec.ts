import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { afterEach, describe, expect, it } from 'vitest';
import { MenuDirective } from './menu.directive';
import { MenuGroupDirective, MenuLabelDirective } from './menu-group.directive';
import { MenuItemDirective } from './menu-item.directive';
import { MenuRadioGroupDirective } from './menu-radio-group.directive';
import { MenuRadioItemDirective } from './menu-radio-item.directive';
import { MenuSeparatorDirective } from './menu-separator.directive';
import { MenuTriggerDirective } from './menu-trigger.directive';

@Component({
  standalone: true,
  imports: [
    MenuDirective,
    MenuTriggerDirective,
    MenuItemDirective,
    MenuSeparatorDirective,
    MenuGroupDirective,
    MenuLabelDirective,
    MenuRadioGroupDirective,
    MenuRadioItemDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button qzMenuTrigger [menu]="menu">Open</button>
    <ng-template #menu>
      <div qzMenu>
        <div qzMenuGroup data-testid="account">
          @if (showLabel()) {
            <div qzMenuLabel>Account</div>
          }
          <button qzMenuItem>Profile</button>
          <button qzMenuItem [disabled]="true">Billing</button>
        </div>
        <div qzMenuSeparator></div>
        <div qzMenuRadioGroup value="a" data-testid="radio">
          <div qzMenuLabel>Sort</div>
          <button qzMenuRadioItem value="a">Alpha</button>
          <button qzMenuRadioItem value="b">Beta</button>
        </div>
        <div qzMenuSeparator></div>
        @for (g of groups(); track g) {
          <div qzMenuGroup>
            <div qzMenuLabel>{{ g }}</div>
            <button qzMenuItem>{{ g }}-item</button>
          </div>
        }
      </div>
    </ng-template>
  `,
})
class Host {
  readonly showLabel = signal(true);
  readonly groups = signal<string[]>([]);
}

describe('Menu groups, labels and separators', () => {
  afterEach(() => {
    document.querySelectorAll('[data-qz-overlay-container]').forEach((el) => el.remove());
  });

  async function open() {
    const result = await render(Host);
    fireEvent.click(screen.getByText('Open'));
    await screen.findByRole('menu');
    return result;
  }

  it('names a group with its label via aria-labelledby', async () => {
    await open();
    const group = screen.getByTestId('account');
    expect(group).toHaveAttribute('role', 'group');
    const label = screen.getByText('Account');
    expect(group).toHaveAttribute('aria-labelledby', label.id);
    expect(screen.getByRole('group', { name: 'Account' })).toBe(group);
  });

  it('names a radio group with a label too', async () => {
    await open();
    expect(screen.getByRole('group', { name: 'Sort' })).toBe(screen.getByTestId('radio'));
  });

  it('renders separators with role=separator', async () => {
    await open();
    const separators = screen.getAllByRole('separator');
    expect(separators).toHaveLength(2);
    separators.forEach((sep) => expect(sep).toHaveAttribute('aria-orientation', 'horizontal'));
  });

  it('removes aria-labelledby when the label is removed, leaving no stale reference', async () => {
    const { fixture } = await open();
    fixture.componentInstance.showLabel.set(false);
    fixture.detectChanges();
    await waitFor(() => expect(screen.queryByText('Account')).toBeNull());
    expect(screen.getByTestId('account')).not.toHaveAttribute('aria-labelledby');
  });

  it('supports groups added dynamically', async () => {
    const { fixture } = await open();
    fixture.componentInstance.groups.set(['More']);
    fixture.detectChanges();
    expect(await screen.findByRole('group', { name: 'More' })).toBeTruthy();
    fixture.componentInstance.groups.set([]);
    fixture.detectChanges();
    await waitFor(() => expect(screen.queryByRole('group', { name: 'More' })).toBeNull());
  });

  it('never makes labels or separators menu items or focus destinations', async () => {
    await open();
    const menu = screen.getByRole('menu');
    const items = [...menu.querySelectorAll('[role^="menuitem"]')].map((el) =>
      el.textContent?.trim(),
    );
    expect(items).toEqual(['Profile', 'Billing', 'Alpha', 'Beta']);
    const label = screen.getByText('Account');
    expect(label).not.toHaveAttribute('tabindex');
    expect(label).not.toHaveAttribute('role');
  });

  it('arrow keys, Home and End skip labels, separators and disabled items', async () => {
    await open();
    const menu = screen.getByRole('menu');
    const profile = screen.getByText('Profile');
    profile.focus();
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    // Billing is disabled → next enabled item is Alpha (past the separator and radio label)
    await waitFor(() => expect(document.activeElement).toBe(screen.getByText('Alpha')));
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    await waitFor(() => expect(document.activeElement).toBe(profile));
    fireEvent.keyDown(menu, { key: 'End' });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByText('Beta')));
    fireEvent.keyDown(menu, { key: 'Home' });
    await waitFor(() => expect(document.activeElement).toBe(profile));
  });

  it('typeahead does not land on label text', async () => {
    await open();
    const menu = screen.getByRole('menu');
    screen.getByText('Profile').focus();
    // "Account"/"Sort" are labels; "S" must not focus them (no item starts with S)
    fireEvent.keyDown(menu, { key: 's' });
    expect(document.activeElement).toBe(screen.getByText('Profile'));
  });

  it('typeahead skips disabled items and reaches the next match', async () => {
    await open();
    const menu = screen.getByRole('menu');
    screen.getByText('Profile').focus();
    fireEvent.keyDown(menu, { key: 'b' });
    // Billing is disabled; Beta is the next B item
    await waitFor(() => expect(document.activeElement).toBe(screen.getByText('Beta')));
  });
});
