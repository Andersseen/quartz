import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { ToggleGroupDirective } from './toggle-group.directive';
import { ToggleItemDirective } from './toggle-item.directive';

@Component({
  standalone: true,
  imports: [ToggleGroupDirective, ToggleItemDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzToggleGroup
      [(value)]="value"
      [type]="type()"
      [orientation]="orientation()"
      [loop]="loop()"
      [allowDeselection]="allowDeselection()"
      [disabled]="groupDisabled()"
      (valueChangeCommitted)="committed.push($event)"
      [attr.dir]="dir()"
    >
      <button qzToggleItem="left">Left</button>
      <button qzToggleItem="center" [qzToggleItemDisabled]="centerDisabled()">Center</button>
      <button qzToggleItem="right">Right</button>
    </div>
  `,
})
class ToggleGroupHost {
  readonly value = signal<string | readonly string[] | null>(null);
  readonly type = signal<'single' | 'multiple'>('single');
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly loop = signal(true);
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly centerDisabled = signal(false);
  readonly allowDeselection = signal(true);
  readonly groupDisabled = signal(false);
  readonly committed: unknown[] = [];
}

describe('ToggleGroup', () => {
  it('supports single and multiple selection with aria-pressed state', async () => {
    const { fixture } = await render(ToggleGroupHost);
    const left = screen.getByRole('button', { name: 'Left' });
    const right = screen.getByRole('button', { name: 'Right' });

    fireEvent.click(left);
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('left');
    expect(left).toHaveAttribute('aria-pressed', 'true');

    fixture.componentInstance.type.set('multiple');
    fixture.componentInstance.value.set([]);
    fixture.detectChanges();
    fireEvent.click(left);
    fireEvent.click(right);
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual(['left', 'right']);
  });

  it('uses roving tabindex and RTL-aware arrow navigation', async () => {
    const { fixture } = await render(ToggleGroupHost);
    fixture.componentInstance.centerDisabled.set(true);
    fixture.componentInstance.dir.set('rtl');
    fixture.detectChanges();

    screen.getByRole('button', { name: 'Left' }).focus();
    fireEvent.keyDown(screen.getByRole('group'), { key: 'ArrowLeft' });
    fixture.detectChanges();

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Right' }));
    expect(screen.getByRole('button', { name: 'Left' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('button', { name: 'Right' })).toHaveAttribute('tabindex', '0');
  });

  describe('selection contract', () => {
    it('allowDeselection=true clears the single value; false keeps it and emits nothing', async () => {
      const { fixture } = await render(ToggleGroupHost);
      const host = fixture.componentInstance;
      const left = screen.getByRole('button', { name: 'Left' });

      fireEvent.click(left);
      fireEvent.click(left);
      fixture.detectChanges();
      expect(host.value()).toBeNull();
      expect(host.committed).toEqual(['left', null]);

      host.allowDeselection.set(false);
      fixture.detectChanges();
      fireEvent.click(left);
      fireEvent.click(left);
      fixture.detectChanges();
      expect(host.value()).toBe('left');
      expect(left).toHaveAttribute('aria-pressed', 'true');
      expect(host.committed).toEqual(['left', null, 'left']);
    });

    it('multiple mode toggles members, supports empty arrays and emits one array per click', async () => {
      const { fixture } = await render(ToggleGroupHost);
      const host = fixture.componentInstance;
      host.type.set('multiple');
      host.value.set([]);
      fixture.detectChanges();
      const left = screen.getByRole('button', { name: 'Left' });
      const right = screen.getByRole('button', { name: 'Right' });

      fireEvent.click(left);
      fireEvent.click(right);
      fireEvent.click(left);
      fixture.detectChanges();
      expect(host.value()).toEqual(['right']);
      expect(host.committed).toEqual([['left'], ['left', 'right'], ['right']]);
      expect(left).toHaveAttribute('aria-pressed', 'false');
    });

    it('programmatic writes reflect in the DOM without committing; focus never commits', async () => {
      const { fixture } = await render(ToggleGroupHost);
      const host = fixture.componentInstance;
      host.value.set('center');
      fixture.detectChanges();
      expect(screen.getByRole('button', { name: 'Center' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      screen.getByRole('button', { name: 'Right' }).focus();
      fireEvent.keyDown(screen.getByRole('group'), { key: 'ArrowLeft' });
      fixture.detectChanges();
      expect(host.committed).toEqual([]);
      expect(host.value()).toBe('center');
    });

    it('ignores clicks on disabled items and a disabled group', async () => {
      const { fixture } = await render(ToggleGroupHost);
      const host = fixture.componentInstance;
      host.centerDisabled.set(true);
      fixture.detectChanges();
      fireEvent.click(screen.getByRole('button', { name: 'Center' }));
      expect(host.committed).toEqual([]);
      host.groupDisabled.set(true);
      fixture.detectChanges();
      fireEvent.click(screen.getByRole('button', { name: 'Left' }));
      expect(host.committed).toEqual([]);
      expect(screen.getByRole('group')).toHaveAttribute('aria-disabled', 'true');
    });

    it('keeps the value when a pressed item is removed (no phantom update)', async () => {
      const value = signal<string | null>('b');
      const items = signal(['a', 'b']);
      const { fixture } = await render(
        `<div qzToggleGroup [(value)]="value" aria-label="g">@for (i of items(); track i) {<button [qzToggleItem]="i">{{ i }}</button>}</div>`,
        {
          imports: [ToggleGroupDirective, ToggleItemDirective],
          componentProperties: { value, items },
        },
      );
      items.set(['a']);
      fixture.detectChanges();
      expect(value()).toBe('b');
    });
  });
});
