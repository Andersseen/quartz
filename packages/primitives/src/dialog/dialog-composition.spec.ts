import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewContainerRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { afterEach, describe, expect, it } from 'vitest';
import { MenuDirective } from '../menu/menu.directive';
import { MenuItemDirective } from '../menu/menu-item.directive';
import { MenuTriggerDirective } from '../menu/menu-trigger.directive';
import { PopoverDirective } from '../popover/popover.directive';
import { PopoverTriggerDirective } from '../popover/popover-trigger.directive';
import { DialogService } from './dialog.service';

@Component({
  standalone: true,
  imports: [
    MenuDirective,
    MenuItemDirective,
    MenuTriggerDirective,
    PopoverDirective,
    PopoverTriggerDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="app"><button id="bg">Background</button></main>
    <p id="closed">{{ closed() }}</p>
    @if (alive()) {
      <button #host id="open" (click)="open()">Open</button>
    }
    <ng-template #tpl let-labelledBy="ariaLabelledBy">
      <div id="content">
        <h2 [id]="labelledBy">Title</h2>
        <button id="menu-trigger" qzMenuTrigger [menu]="menu">Menu</button>
        <button id="pop-trigger" qzPopoverTrigger [popover]="pop">Popover</button>
        <button id="kill" (click)="alive.set(false)">Kill</button>
      </div>
    </ng-template>
    <ng-template #menu
      ><div qzMenu id="menu"><button qzMenuItem>One</button></div></ng-template
    >
    <ng-template #pop><div qzPopover id="pop">Popover body</div></ng-template>
  `,
})
class Host {
  readonly alive = signal(true);
  readonly closed = signal('');
  private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
  private readonly host = viewChild('host', { read: ViewContainerRef });
  private readonly dialogs = inject(DialogService);

  open(): void {
    const ref = this.dialogs.open(this.tpl(), this.host()!);
    // Writing a signal from `closed$` must work even when the close happens during rendering.
    ref.closed$.subscribe(() => this.closed.update((value) => value + 'closed;'));
  }
}

const isolated = (selector: string) =>
  !!document.querySelector(selector)?.closest('[inert], [aria-hidden="true"]');

const residue = () => ({
  wrappers: document.querySelectorAll('[data-qz-dialog-wrapper]').length,
  backdrops: document.querySelectorAll('[data-qz-dialog-backdrop]').length,
  overlays: document.querySelectorAll('[data-qz-overlay-container] > *').length,
  inert: document.querySelectorAll('[inert], [aria-hidden="true"]').length,
  overflow: document.body.style.overflow,
});

describe('Dialog composed with Menu / Popover', () => {
  afterEach(() => {
    document
      .querySelectorAll('[data-qz-overlay-container], [data-qz-dialog-wrapper]')
      .forEach((el) => el.remove());
    document.body.style.overflow = '';
  });

  it.each([
    ['a menu', 'menu-trigger', 'menu'],
    ['a popover', 'pop-trigger', 'pop'],
  ])(
    'removing the host while %s is open releases the dialog, overlay, isolation and scroll lock',
    async (_name, triggerId, panelId) => {
      const { fixture } = await render(Host);
      fireEvent.click(screen.getByText('Open'));
      await screen.findByRole('dialog');
      expect(isolated('#app')).toBe(true);

      fireEvent.click(document.getElementById(triggerId)!);
      await waitFor(() => expect(document.getElementById(panelId)).not.toBeNull());

      document.getElementById('kill')!.click();
      fixture.detectChanges();

      await waitFor(() => expect(fixture.componentInstance.closed()).toBe('closed;'));
      expect(residue()).toEqual({
        wrappers: 0,
        backdrops: 0,
        overlays: 0,
        inert: 0,
        overflow: '',
      });
    },
  );

  it('a menu opened inside the dialog is not isolated, the background is', async () => {
    await render(Host);
    fireEvent.click(screen.getByText('Open'));
    await screen.findByRole('dialog');
    fireEvent.click(document.getElementById('menu-trigger')!);
    const menu = await screen.findByRole('menu');

    expect(menu.closest('[inert], [aria-hidden="true"]')).toBeNull();
    expect(isolated('#app')).toBe(true);
  });

  it('labels the dialog through the template context id', async () => {
    await render(Host);
    fireEvent.click(screen.getByText('Open'));
    const dialog = await screen.findByRole('dialog');
    const labelId = dialog.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    expect(document.getElementById(labelId!)?.textContent).toBe('Title');
  });
});
