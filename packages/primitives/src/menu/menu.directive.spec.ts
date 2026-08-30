import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { MenuCheckboxItemDirective } from './menu-checkbox-item.directive';
import { MenuDirective } from './menu.directive';
import { MenuItemDirective } from './menu-item.directive';
import { MenuRadioGroupDirective } from './menu-radio-group.directive';
import { MenuRadioItemDirective } from './menu-radio-item.directive';
import { MenuSeparatorDirective } from './menu-separator.directive';
import { MenuTriggerDirective } from './menu-trigger.directive';

const MENU_IMPORTS = [
  MenuDirective,
  MenuTriggerDirective,
  MenuItemDirective,
  MenuSeparatorDirective,
  MenuCheckboxItemDirective,
  MenuRadioGroupDirective,
  MenuRadioItemDirective,
];

@Component({
  standalone: true,
  imports: MENU_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button qzMenuTrigger [menu]="menu">File</button>
    <ng-template #menu>
      <div qzMenu>
        <button qzMenuItem (selected)="selected.set('new')">New</button>
        <button qzMenuItem [disabled]="disabled()">Open</button>
        <button qzMenuItem (selected)="selected.set('save')">Save</button>
        <div qzMenuSeparator></div>
        <button qzMenuCheckboxItem [(checked)]="checked">Show toolbar</button>
        <div qzMenuRadioGroup [(value)]="alignment">
          <button qzMenuRadioItem value="left">Left</button>
          <button qzMenuRadioItem value="right">Right</button>
        </div>
      </div>
    </ng-template>
  `,
})
class MenuHost {
  readonly selected = signal<string | null>(null);
  readonly disabled = signal(false);
  readonly checked = signal(false);
  readonly alignment = signal<string | null>('left');
}

@Component({
  standalone: true,
  imports: MENU_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button qzMenuTrigger [menu]="menu">Actions</button>
    <ng-template #menu>
      <div qzMenu [dir]="dir()">
        <button qzMenuItem>Alpha</button>
        <button qzMenuItem [submenu]="submenu">Share</button>
        <ng-template #submenu>
          <div qzMenu>
            <button qzMenuItem>Copy link</button>
          </div>
        </ng-template>
      </div>
    </ng-template>
  `,
})
class SubmenuHost {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
}

describe('Menu', () => {
  afterEach(() => {
    document.querySelectorAll('[data-qz-overlay-container]').forEach((el) => el.remove());
  });

  it('opens from the trigger, focuses the first item, and selects plain items', async () => {
    const { fixture } = await render(MenuHost);
    fireEvent.click(screen.getByText('File'));
    const items = await screen.findAllByRole('menuitem');

    await waitFor(() => expect(document.activeElement).toBe(items[0]));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('File')).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(items[0]);
    fixture.detectChanges();

    expect(fixture.componentInstance.selected()).toBe('new');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(screen.getByText('File'));
  });

  it('navigates by keyboard, skips disabled items, and supports typeahead', async () => {
    const { fixture } = await render(MenuHost);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    const trigger = screen.getByText('File');

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const items = await screen.findAllByRole('menuitem');
    await waitFor(() => expect(document.activeElement).toBe(items[0]));

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[2]);

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Home' });
    expect(document.activeElement).toBe(items[0]);

    fireEvent.keyDown(screen.getByRole('menu'), { key: 's' });
    expect(document.activeElement).toBe(items[2]);
  });

  it('toggles checkbox items and updates radio groups without closing by default', async () => {
    const { fixture } = await render(MenuHost);
    fireEvent.click(screen.getByText('File'));

    fireEvent.click(await screen.findByRole('menuitemcheckbox'));
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Right' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.checked()).toBe(true);
    expect(fixture.componentInstance.alignment()).toBe('right');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'Right' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('opens and closes submenus with logical arrow keys', async () => {
    await render(SubmenuHost);
    fireEvent.click(screen.getByText('Actions'));
    const rootMenu = await screen.findByRole('menu');
    fireEvent.keyDown(rootMenu, { key: 'ArrowDown' });
    fireEvent.keyDown(rootMenu, { key: 'ArrowRight' });

    await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(2));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByText('Copy link')));

    fireEvent.keyDown(screen.getAllByRole('menu')[1], { key: 'ArrowLeft' });
    await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(1));
    expect(document.activeElement).toBe(screen.getByText('Share'));
  });

  it('mirrors submenu open key in RTL', async () => {
    const { fixture } = await render(SubmenuHost);
    fixture.componentInstance.dir.set('rtl');
    fixture.detectChanges();

    fireEvent.click(screen.getByText('Actions'));
    const rootMenu = await screen.findByRole('menu');
    fireEvent.keyDown(rootMenu, { key: 'ArrowDown' });
    fireEvent.keyDown(rootMenu, { key: 'ArrowLeft' });

    await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(2));
  });

  it('closes the whole tree on outside pointer and Escape restores trigger focus', async () => {
    await render(SubmenuHost);
    const trigger = screen.getByText('Actions');
    fireEvent.click(trigger);
    const rootMenu = await screen.findByRole('menu');
    fireEvent.keyDown(rootMenu, { key: 'ArrowDown' });
    fireEvent.keyDown(rootMenu, { key: 'ArrowRight' });
    await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(2));
    await new Promise((resolve) => document.defaultView?.setTimeout(resolve));

    fireEvent.pointerDown(document.body);
    await waitFor(() => expect(screen.queryAllByRole('menu')).toHaveLength(0));

    fireEvent.click(trigger);
    await screen.findByRole('menu');
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryAllByRole('menu')).toHaveLength(0));
    expect(document.activeElement).toBe(trigger);
  });

  it('opens submenus after pointer hover intent', async () => {
    vi.useFakeTimers();
    await render(SubmenuHost);
    fireEvent.click(screen.getByText('Actions'));
    const share = await screen.findByText('Share');

    fireEvent.pointerEnter(share);
    vi.advanceTimersByTime(120);

    expect(screen.getAllByRole('menu')).toHaveLength(2);
    vi.useRealTimers();
  });
});
