import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import {
  FormFieldControlDirective,
  FormFieldDescriptionDirective,
  FormFieldDirective,
  FormFieldErrorDirective,
  FormFieldLabelDirective,
} from '@quartz-headless/primitives';
import { FormFieldStateDirective } from './form-field-state.directive';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormFieldDirective,
    FormFieldControlDirective,
    FormFieldLabelDirective,
    FormFieldDescriptionDirective,
    FormFieldErrorDirective,
    FormFieldStateDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div qzFormField id="name-field">
      <label qzFormFieldLabel for="name-field-control">Name</label>
      <p qzFormFieldDescription id="name-hint">Required.</p>
      <p qzFormFieldError id="name-error">Name is invalid.</p>
      @if (showControl()) {
        <input qzFormFieldControl [formControl]="name" />
      }
    </div>
  `,
})
class FormStateHost {
  readonly name = new FormControl('', { nonNullable: true });
  readonly showControl = signal(true);
}

describe('FormFieldStateDirective', () => {
  it('tracks invalid/touched/dirty/disabled and reset transitions from Angular Forms', async () => {
    const { fixture } = await render(FormStateHost);
    const host = fixture.componentInstance;
    host.name.setErrors({ required: true });
    await fixture.whenStable();
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(document.querySelector('[qzFormField]')).toHaveAttribute('data-invalid');

    host.name.markAsTouched();
    fireEvent.input(input, { target: { value: 'Ada' } });
    await fixture.whenStable();
    expect(document.querySelector('[qzFormField]')).toHaveAttribute('data-touched');
    expect(document.querySelector('[qzFormField]')).toHaveAttribute('data-dirty');

    host.name.disable();
    await fixture.whenStable();
    expect(input).toHaveAttribute('aria-disabled', 'true');
    host.name.reset('');
    await fixture.whenStable();
    expect(document.querySelector('[qzFormField]')).not.toHaveAttribute('data-touched');
    expect(document.querySelector('[qzFormField]')).not.toHaveAttribute('data-dirty');
    expect(input).toHaveAttribute('aria-disabled', 'true');
    host.name.enable();
    await fixture.whenStable();
    expect(input).not.toHaveAttribute('aria-disabled');
  });

  it('clears mirrored state when its projected Angular control is removed', async () => {
    const { fixture } = await render(FormStateHost);
    const host = fixture.componentInstance;
    host.name.markAsTouched();
    await fixture.whenStable();
    expect(document.querySelector('[qzFormField]')).toHaveAttribute('data-touched');

    host.showControl.set(false);
    await fixture.whenStable();
    expect(document.querySelector('[qzFormField]')).not.toHaveAttribute('data-touched');
    expect(document.querySelector('[qzFormField]')).not.toHaveAttribute('data-dirty');
  });

  it('tracks pending validation and clears it when validation settles', async () => {
    const { fixture } = await render(FormStateHost);
    const host = fixture.componentInstance;
    host.name.markAsPending();
    await fixture.whenStable();
    expect(document.querySelector('[qzFormField]')).toHaveAttribute('data-pending');

    host.name.setErrors(null);
    await fixture.whenStable();
    expect(document.querySelector('[qzFormField]')).not.toHaveAttribute('data-pending');
  });
});
