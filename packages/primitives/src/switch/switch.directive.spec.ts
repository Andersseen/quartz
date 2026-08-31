import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { SwitchDirective } from './switch.directive';

@Component({
  standalone: true,
  imports: [SwitchDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button qzSwitch [(checked)]="checked" [disabled]="disabled()">Notifications</button>`,
})
class SwitchHost {
  readonly checked = signal(false);
  readonly disabled = signal(false);
}

describe('Switch', () => {
  it('exposes switch ARIA and toggles on click', async () => {
    const { fixture } = await render(SwitchHost);
    const control = screen.getByRole('switch', { name: 'Notifications' });

    expect(control).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(control);
    fixture.detectChanges();

    expect(fixture.componentInstance.checked()).toBe(true);
    expect(control).toHaveAttribute('aria-checked', 'true');
  });

  it('does not toggle while disabled', async () => {
    const { fixture } = await render(SwitchHost);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    const control = screen.getByRole('switch', { name: 'Notifications' });
    fireEvent.click(control);

    expect(fixture.componentInstance.checked()).toBe(false);
    expect(control).toHaveAttribute('aria-disabled', 'true');
  });
});
