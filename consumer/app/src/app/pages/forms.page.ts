import { Component, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AutofillDirective,
  CheckboxDirective,
  ComboboxContentDirective,
  ComboboxDirective,
  ComboboxInputDirective,
  ComboboxListboxDirective,
  ComboboxOptionDirective,
  FileDropzoneDirective,
  FileUploadDirective,
  FormFieldControlDirective,
  FormFieldDescriptionDirective,
  FormFieldDirective,
  FormFieldErrorDirective,
  FormFieldLabelDirective,
  InputOtpComponent,
  RadioDirective,
  RadioGroupDirective,
  SelectContentDirective,
  SelectDirective,
  SelectListboxDirective,
  SelectOptionDirective,
  SelectTriggerDirective,
  SwitchDirective,
} from '@quartz-headless/primitives';
import { QUARTZ_FORMS } from '@quartz-headless/primitives/forms';

@Component({
  selector: 'app-forms-page',
  imports: [
    ReactiveFormsModule,
    AutofillDirective,
    CheckboxDirective,
    ComboboxContentDirective,
    ComboboxDirective,
    ComboboxInputDirective,
    ComboboxListboxDirective,
    ComboboxOptionDirective,
    FileDropzoneDirective,
    FileUploadDirective,
    FormFieldControlDirective,
    FormFieldDescriptionDirective,
    FormFieldDirective,
    FormFieldErrorDirective,
    FormFieldLabelDirective,
    InputOtpComponent,
    RadioDirective,
    RadioGroupDirective,
    SelectContentDirective,
    SelectDirective,
    SelectListboxDirective,
    SelectOptionDirective,
    SelectTriggerDirective,
    SwitchDirective,
    ...QUARTZ_FORMS,
  ],
  template: `
    <h1>Forms</h1>
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate aria-label="Profile">
      <section>
        <div qzFormField id="email-field" required>
          <label qzFormFieldLabel for="email-field-control">Email</label>
          <p qzFormFieldDescription id="email-field-hint">Work address.</p>
          @if (showError('email')) {
            <p qzFormFieldError id="email-field-error" role="alert" class="err">
              Enter a valid email.
            </p>
          }
          <input
            qzFormFieldControl
            qzAutofill
            type="email"
            formControlName="email"
            (autofilledChange)="autofilled.set($event)"
          />
        </div>
        <div qzFormField id="message-field" required>
          <label qzFormFieldLabel for="message-field-control">Message</label>
          @if (showError('message')) {
            <p qzFormFieldError id="message-field-error" role="alert" class="err">
              Message needs 5 characters.
            </p>
          }
          <textarea qzFormFieldControl formControlName="message"></textarea>
        </div>
      </section>

      <section>
        <button qzCheckbox formControlName="terms" aria-label="Accept terms" data-testid="terms">
          Terms
        </button>
        <button qzSwitch formControlName="notify" aria-label="Notifications" data-testid="notify">
          Notify
        </button>
        <div qzRadioGroup formControlName="plan" aria-label="Plan">
          <button qzRadio="free">Free</button>
          <button qzRadio="pro">Pro</button>
        </div>
        <div qzSelect formControlName="fruit" data-testid="fruit">
          <button qzSelectTrigger [attr.aria-label]="'Fruit: ' + (fruit() ?? 'none')">
            {{ fruit() ?? '—' }}
          </button>
          <ng-template qzSelectContent>
            <div qzSelectListbox class="panel">
              <div qzSelectOption="apple">Apple</div>
              <div qzSelectOption="pear">Pear</div>
            </div>
          </ng-template>
        </div>
        <div qzCombobox formControlName="city" [options]="cities" #city="qzCombobox">
          <input aria-label="City" qzComboboxInput />
          <ng-template qzComboboxContent>
            <ul qzComboboxListbox class="panel">
              @for (c of city.filteredOptions(); track c) {
                <li [qzComboboxOption]="c">{{ c }}</li>
              }
            </ul>
          </ng-template>
        </div>
      </section>

      <section>
        <qz-input-otp
          class="otp"
          ariaLabel="One-time code"
          [length]="6"
          formControlName="otp"
          (completed)="otpDone.set($event)"
        />
        <output data-testid="otp-done">{{ otpDone() }}</output>
      </section>

      <section>
        <div qzFileDropzone data-testid="dropzone">
          <input
            #upload="qzFileUpload"
            type="file"
            qzFileUpload
            aria-label="Attachments"
            accept=".txt"
            multiple
            (filesChange)="files.set($event.length)"
          />
          <button type="button" (click)="upload.openPicker()">Browse files</button>
        </div>
        <output data-testid="file-count">{{ files() }}</output>
      </section>

      <button type="submit">Submit</button>
      <button type="button" (click)="reset()">Reset</button>
      @if (submitted()) {
        <p role="status" data-testid="status">
          {{ form.valid ? 'Submitted' : 'Please fix the errors' }}
        </p>
      }
    </form>
    <output data-testid="autofilled">{{ autofilled() }}</output>
  `,
})
export class FormsPage {
  readonly cities = ['Madrid', 'Paris', 'Prague'];
  readonly submitted = signal(false);
  readonly autofilled = signal(false);
  readonly otpDone = signal('');
  readonly files = signal(0);

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    message: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5)],
    }),
    terms: new FormControl<boolean | 'indeterminate'>(false, { nonNullable: true }),
    notify: new FormControl(true, { nonNullable: true }),
    plan: new FormControl<string | null>(null),
    fruit: new FormControl<string | null>('apple'),
    city: new FormControl<string | null>(null),
    otp: new FormControl('', { nonNullable: true }),
  });

  readonly fruit = toSignal(this.form.controls.fruit.valueChanges, {
    initialValue: 'apple' as string | null,
  });

  showError(name: 'email' | 'message'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  submit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
  }

  reset(): void {
    this.submitted.set(false);
    this.otpDone.set('');
    this.form.reset({ notify: true, fruit: 'apple', terms: false });
  }
}
