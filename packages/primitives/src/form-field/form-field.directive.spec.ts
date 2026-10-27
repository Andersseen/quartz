import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import {
  FormFieldControlDirective,
  FormFieldDescriptionDirective,
  FormFieldDirective,
  FormFieldErrorDirective,
  FormFieldLabelDirective,
} from './form-field.directive';

@Component({
  standalone: true,
  imports: [
    FormFieldDirective,
    FormFieldControlDirective,
    FormFieldLabelDirective,
    FormFieldDescriptionDirective,
    FormFieldErrorDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div qzFormField id="email-field" [invalid]="invalid()">
      <label qzFormFieldLabel for="email-field-control">Email</label>
      <p qzFormFieldDescription id="email-hint">Use your work address.</p>
      @if (invalid()) {
        <p qzFormFieldError id="email-error">Enter a valid email.</p>
      }
      <input qzFormFieldControl type="email" />
    </div>
    <div qzFormField id="phone-field">
      <label qzFormFieldLabel for="phone-field-control">Phone</label>
      <p qzFormFieldDescription id="phone-hint">Include your country code.</p>
      <input qzFormFieldControl id="phone-field-control" type="tel" />
    </div>
  `,
})
class FormFieldHost {
  readonly invalid = signal(false);
}

describe('FormField', () => {
  it('connects a native control to its label and dynamically projected descriptions', async () => {
    const { fixture } = await render(FormFieldHost);
    const control = screen.getByRole('textbox', { name: 'Email' });
    expect(control).toHaveAttribute('id', 'email-field-control');
    expect(control).toHaveAttribute(
      'aria-labelledby',
      expect.stringContaining('email-field-label'),
    );
    expect(control).toHaveAttribute('aria-describedby', 'email-hint');
    expect(control).not.toHaveAttribute('aria-invalid');

    fixture.componentInstance.invalid.set(true);
    await fixture.whenStable();
    expect(control).toHaveAttribute('aria-describedby', 'email-hint email-error');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(document.getElementById('email-error')).toBeTruthy();
  });

  it('uses the explicit ids unchanged for deterministic server/client relationships', async () => {
    await render(FormFieldHost);
    const control = screen.getByRole('textbox', { name: 'Email' });
    expect(
      document.getElementById(control.getAttribute('aria-labelledby')!.split(' ')[0]!),
    ).toBeTruthy();
    expect(document.getElementById('email-hint')).toBeTruthy();
  });

  it('keeps relationships unique across multiple fields in one application view', async () => {
    await render(FormFieldHost);
    const email = screen.getByRole('textbox', { name: 'Email' });
    const phone = screen.getByRole('textbox', { name: 'Phone' });
    expect(email).toHaveAttribute('aria-describedby', 'email-hint');
    expect(phone).toHaveAttribute('aria-describedby', 'phone-hint');
    expect(email).toHaveAttribute('aria-labelledby', 'email-field-label');
    expect(phone).toHaveAttribute('aria-labelledby', 'phone-field-label');
    expect(document.querySelectorAll('#email-field-label')).toHaveLength(1);
    expect(document.querySelectorAll('#phone-field-label')).toHaveLength(1);
  });
});
