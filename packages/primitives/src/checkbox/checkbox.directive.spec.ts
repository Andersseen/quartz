import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { CheckboxDirective, type CheckboxState } from './checkbox.directive';

@Component({
  standalone: true,
  imports: [CheckboxDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button qzCheckbox [(checked)]="checked" [disabled]="disabled()">
    Accept terms
  </button>`,
})
class CheckboxHost {
  readonly checked = signal<CheckboxState>(false);
  readonly disabled = signal(false);
}

describe('Checkbox', () => {
  it('exposes ARIA and state hooks for checked, unchecked and indeterminate states', async () => {
    const { fixture } = await render(CheckboxHost);
    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' });

    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    expect(checkbox).toHaveAttribute('data-qz-state', 'unchecked');

    fixture.componentInstance.checked.set('indeterminate');
    fixture.detectChanges();
    expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    expect(checkbox).toHaveAttribute('data-qz-state', 'indeterminate');

    fireEvent.click(checkbox);
    fixture.detectChanges();
    expect(fixture.componentInstance.checked()).toBe(true);
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
  });

  it('uses native button activation without double toggling on Space', async () => {
    const { fixture } = await render(CheckboxHost);
    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' });

    fireEvent.keyDown(checkbox, { key: ' ' });
    fireEvent.click(checkbox);
    fixture.detectChanges();

    expect(fixture.componentInstance.checked()).toBe(true);
  });

  it('does not toggle while disabled', async () => {
    const { fixture } = await render(CheckboxHost);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' });
    fireEvent.click(checkbox);

    expect(fixture.componentInstance.checked()).toBe(false);
    expect(checkbox).toHaveAttribute('aria-disabled', 'true');
    expect(checkbox).toHaveAttribute('data-qz-disabled');
  });
});
