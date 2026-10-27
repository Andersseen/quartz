import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { ToolbarDirective } from './toolbar.directive';
import { ToolbarItemDirective } from './toolbar-item.directive';

@Component({
  standalone: true,
  imports: [ToolbarDirective, ToolbarItemDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzToolbar
      aria-label="Editor tools"
      [orientation]="orientation()"
      [attr.dir]="dir()"
      [disabled]="disabled()"
    >
      @for (item of items(); track item.id) {
        <button qzToolbarItem [qzToolbarItemDisabled]="item.disabled" [attr.data-item]="item.id">
          {{ item.label }}
        </button>
      }
    </div>
  `,
})
class ToolbarHost {
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly disabled = signal(false);
  readonly items = signal([
    { id: 'one', label: 'One', disabled: false },
    { id: 'two', label: 'Two', disabled: true },
    { id: 'three', label: 'Three', disabled: false },
  ]);
}

describe('Toolbar', () => {
  it('exposes toolbar semantics, one tab stop, and skips disabled items', async () => {
    const { fixture } = await render(ToolbarHost);
    const toolbar = screen.getByRole('toolbar', { name: 'Editor tools' });
    const one = screen.getByRole('button', { name: 'One' });
    const two = screen.getByRole('button', { name: 'Two' });
    const three = screen.getByRole('button', { name: 'Three' });

    expect(toolbar).toHaveAttribute('aria-orientation', 'horizontal');
    expect(one).toHaveAttribute('tabindex', '0');
    expect(two).toHaveAttribute('tabindex', '-1');
    expect(three).toHaveAttribute('tabindex', '-1');

    one.focus();
    fireEvent.keyDown(one, { key: 'ArrowRight' });
    fixture.detectChanges();
    expect(document.activeElement).toBe(three);
    expect(three).toHaveAttribute('tabindex', '0');
  });

  it('uses orientation and RTL physical arrow navigation', async () => {
    const { fixture } = await render(ToolbarHost);
    const host = fixture.componentInstance;
    const one = screen.getByRole('button', { name: 'One' });
    const three = screen.getByRole('button', { name: 'Three' });

    host.dir.set('rtl');
    fixture.detectChanges();
    one.focus();
    fireEvent.keyDown(one, { key: 'ArrowLeft' });
    fixture.detectChanges();
    expect(document.activeElement).toBe(three);

    host.orientation.set('vertical');
    fixture.detectChanges();
    fireEvent.keyDown(three, { key: 'ArrowUp' });
    fixture.detectChanges();
    expect(document.activeElement).toBe(one);
    expect(screen.getByRole('toolbar')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('supports Home and End, remembers focus, and responds to dynamic order and disabled state', async () => {
    const { fixture } = await render(ToolbarHost);
    const host = fixture.componentInstance;
    const one = screen.getByRole('button', { name: 'One' });
    const three = screen.getByRole('button', { name: 'Three' });

    three.focus();
    fireEvent.keyDown(three, { key: 'Home' });
    fixture.detectChanges();
    expect(document.activeElement).toBe(one);
    fireEvent.keyDown(one, { key: 'End' });
    fixture.detectChanges();
    expect(document.activeElement).toBe(three);
    expect(three).toHaveAttribute('tabindex', '0');

    host.items.set([
      { id: 'three', label: 'Three', disabled: false },
      { id: 'one', label: 'One', disabled: false },
    ]);
    fixture.detectChanges();
    three.focus();
    fireEvent.keyDown(three, { key: 'ArrowRight' });
    fixture.detectChanges();
    expect(document.activeElement).toBe(one);
  });

  it('recovers focus when the focused item is removed', async () => {
    const { fixture } = await render(ToolbarHost);
    const host = fixture.componentInstance;
    screen.getByRole('button', { name: 'One' }).focus();
    host.items.set([
      { id: 'two', label: 'Two', disabled: false },
      { id: 'three', label: 'Three', disabled: false },
    ]);
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Three' }));
  });

  it('does not consume keys from nested controls or activate items while focus moves', async () => {
    const { fixture } = await render(
      `<div qzToolbar aria-label="Mixed"><div qzToolbarItem><input aria-label="Search"></div><button qzToolbarItem>Action</button></div>`,
      { imports: [ToolbarDirective, ToolbarItemDirective] },
    );
    const input = screen.getByRole('textbox', { name: 'Search' });
    const action = screen.getByRole('button', { name: 'Action' });
    input.focus();
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fixture.detectChanges();
    expect(document.activeElement).toBe(input);
    action.focus();
    fireEvent.keyDown(action, { key: 'ArrowLeft' });
    fixture.detectChanges();
    expect(document.activeElement).toBe(
      screen.getByRole('toolbar').querySelector('[qzToolbarItem]'),
    );
    expect(action).toHaveAttribute('tabindex', '-1');
  });

  it('leaves arrow keys on a text input toolbar item to the input', async () => {
    await render(
      `<div qzToolbar aria-label="Search tools"><input qzToolbarItem aria-label="Search"><button qzToolbarItem>Submit</button></div>`,
      { imports: [ToolbarDirective, ToolbarItemDirective] },
    );
    const input = screen.getByRole('textbox', { name: 'Search' });
    input.focus();
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(input);
  });
});
