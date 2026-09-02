import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { RadioGroupDirective } from './radio-group.directive';
import { RadioDirective } from './radio.directive';

@Component({
  standalone: true,
  imports: [RadioGroupDirective, RadioDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzRadioGroup
      [(value)]="value"
      [orientation]="orientation()"
      [disabled]="disabled()"
      [attr.dir]="dir()"
      [compareWith]="compareWith"
    >
      <button qzRadio="free">Free</button>
      @if (showPro()) {
        <button qzRadio="pro" [qzRadioDisabled]="proDisabled()">Pro</button>
      }
      <button qzRadio="team">Team</button>
    </div>
  `,
})
class RadioGroupHost {
  readonly value = signal<string | null>(null);
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly disabled = signal(false);
  readonly proDisabled = signal(false);
  readonly showPro = signal(true);
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly compareWith = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
}

@Component({
  standalone: true,
  imports: [RadioGroupDirective, RadioDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div qzRadioGroup [(value)]="value">
      <span qzRadio="free">Free</span>
      <span qzRadio="pro">Pro</span>
    </div>
  `,
})
class NonButtonRadioGroupHost {
  readonly value = signal<string | null>(null);
}

describe('RadioGroup', () => {
  it('selects items and exposes radiogroup ARIA', async () => {
    const { fixture } = await render(RadioGroupHost);
    const group = screen.getByRole('radiogroup');
    const pro = screen.getByRole('radio', { name: 'Pro' });

    expect(group).toHaveAttribute('aria-orientation', 'horizontal');
    fireEvent.click(pro);
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('pro');
    expect(pro).toHaveAttribute('aria-checked', 'true');
    expect(pro).toHaveAttribute('tabindex', '0');
  });

  it('moves selection with arrows, skips disabled items, and respects RTL inline direction', async () => {
    const { fixture } = await render(RadioGroupHost);
    fixture.componentInstance.proDisabled.set(true);
    fixture.componentInstance.dir.set('rtl');
    fixture.detectChanges();

    screen.getByRole('radio', { name: 'Free' }).focus();
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowLeft' });
    fixture.detectChanges();

    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Team' }));
    expect(fixture.componentInstance.value()).toBe('team');
  });

  it('supports Home/End and dynamic item removal', async () => {
    const { fixture } = await render(RadioGroupHost);

    screen.getByRole('radio', { name: 'Free' }).focus();
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'End' });
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('team');

    fixture.componentInstance.showPro.set(false);
    fixture.detectChanges();
    expect(screen.queryByRole('radio', { name: 'Pro' })).toBeNull();
  });

  it('works correctly on a non-button host — click, Space, and arrow-key selection all function (unlike Checkbox/Switch/Toggle, RadioGroup drives selection itself rather than relying on native button activation)', async () => {
    const { fixture } = await render(NonButtonRadioGroupHost);
    const free = screen.getByRole('radio', { name: 'Free' });
    const pro = screen.getByRole('radio', { name: 'Pro' });

    fireEvent.click(pro);
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('pro');

    free.focus();
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: ' ' });
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('free');

    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowDown' });
    fixture.detectChanges();
    expect(document.activeElement).toBe(pro);
    expect(fixture.componentInstance.value()).toBe('pro');
  });
});
