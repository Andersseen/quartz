import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import {
  StepDirective,
  StepPanelDirective,
  StepTriggerDirective,
  StepperDirective,
  StepperNextDirective,
  StepperPreviousDirective,
} from './index';

const STEPPER_IMPORTS = [
  StepperDirective,
  StepDirective,
  StepTriggerDirective,
  StepPanelDirective,
  StepperNextDirective,
  StepperPreviousDirective,
];

@Component({
  standalone: true,
  imports: STEPPER_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzStepper
      [(value)]="value"
      [linear]="linear()"
      [orientation]="orientation()"
      [attr.dir]="dir()"
    >
      @if (showAccount()) {
        <div qzStep="account" [qzStepCompleted]="accountComplete()">
          <button qzStepTrigger>Account</button>
          <section qzStepPanel>Account panel</section>
        </div>
      }
      <div qzStep="profile" [qzStepCompleted]="profileComplete()">
        <button qzStepTrigger>Profile</button>
        <section qzStepPanel>Profile panel</section>
      </div>
      <div qzStep="billing" [qzStepDisabled]="billingDisabled()">
        <button qzStepTrigger>Billing</button>
        <section qzStepPanel>Billing panel</section>
      </div>
      <button qzStepperPrevious>Previous</button>
      <button qzStepperNext>Next</button>
    </div>
  `,
})
class StepperHost {
  readonly value = signal<string | null>(null);
  readonly linear = signal(false);
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly accountComplete = signal(false);
  readonly profileComplete = signal(false);
  readonly billingDisabled = signal(false);
  readonly showAccount = signal(true);
}

describe('Stepper', () => {
  it('selects the first enabled step and wires panel relationships', async () => {
    await render(StepperHost);

    const account = screen.getByRole('button', { name: 'Account' });
    const panel = screen.getByRole('region', { name: 'Account' });

    expect(account).toHaveAttribute('aria-current', 'step');
    expect(account).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', account.id);
  });

  it('blocks future navigation in linear mode until previous enabled steps are completed', async () => {
    const { fixture } = await render(StepperHost);
    fixture.componentInstance.linear.set(true);
    fixture.detectChanges();

    fireEvent.click(screen.getByRole('button', { name: 'Billing' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('account');

    fixture.componentInstance.accountComplete.set(true);
    fixture.componentInstance.profileComplete.set(true);
    fixture.detectChanges();
    fireEvent.click(screen.getByRole('button', { name: 'Billing' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('billing');
  });

  it('supports next, previous and disabled skip', async () => {
    const { fixture } = await render(StepperHost);
    fixture.componentInstance.billingDisabled.set(true);
    fixture.detectChanges();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('profile');

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('profile');

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('account');
  });

  it('uses RTL horizontal keyboard navigation through Collection', async () => {
    const { fixture } = await render(StepperHost);
    fixture.componentInstance.dir.set('rtl');
    fixture.detectChanges();

    screen.getByRole('button', { name: 'Account' }).focus();
    fireEvent.keyDown(fixture.nativeElement.querySelector('[data-qz-stepper]'), {
      key: 'ArrowLeft',
    });

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Profile' }));
    expect(fixture.componentInstance.value()).toBe('account');
  });

  it('recovers when the active step is removed', async () => {
    const { fixture } = await render(StepperHost);
    fireEvent.click(screen.getByRole('button', { name: 'Profile' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('profile');

    fixture.componentInstance.showAccount.set(false);
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('profile');

    fixture.componentInstance.showAccount.set(true);
    fixture.detectChanges();
    fixture.componentInstance.value.set('account');
    fixture.detectChanges();
    fixture.componentInstance.showAccount.set(false);
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('profile');
  });
});
