import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { ToggleDirective } from './toggle.directive';

@Component({
  standalone: true,
  imports: [ToggleDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button
    qzToggle
    [(pressed)]="pressed"
    [disabled]="disabled()"
    (pressedChangeCommitted)="commits.push($event)"
  >
    Bold
  </button>`,
})
class ToggleHost {
  readonly pressed = signal(false);
  readonly disabled = signal(false);
  commits: boolean[] = [];
}

describe('Toggle', () => {
  it('exposes aria-pressed and toggles through native button activation', async () => {
    const { fixture } = await render(ToggleHost);
    const toggle = screen.getByRole('button', { name: 'Bold' });

    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveAttribute('data-qz-state', 'off');

    fireEvent.click(toggle);
    fixture.detectChanges();

    expect(fixture.componentInstance.pressed()).toBe(true);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveAttribute('data-qz-state', 'on');
  });

  it('does not toggle while disabled', async () => {
    const { fixture } = await render(ToggleHost);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    const toggle = screen.getByRole('button', { name: 'Bold' });
    fireEvent.click(toggle);

    expect(fixture.componentInstance.pressed()).toBe(false);
    expect(toggle).toHaveAttribute('aria-disabled', 'true');
  });

  it('emits pressedChangeCommitted only for a real user interaction, not a programmatic model write', async () => {
    const { fixture } = await render(ToggleHost);
    const toggle = screen.getByRole('button', { name: 'Bold' });

    fireEvent.click(toggle);
    fixture.detectChanges();
    expect(fixture.componentInstance.commits).toEqual([true]);

    fixture.componentInstance.pressed.set(false);
    fixture.detectChanges();
    expect(fixture.componentInstance.commits).toEqual([true]);
  });
});
