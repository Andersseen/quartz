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
});
