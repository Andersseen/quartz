import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AutofillDirective,
  FileDropzoneDirective,
  FileUploadDirective,
  FormFieldControlDirective,
  FormFieldDescriptionDirective,
  FormFieldDirective,
  FormFieldErrorDirective,
  FormFieldLabelDirective,
  InputOtpComponent,
  SwitchDirective,
} from '@quartz-headless/primitives';
import { QUARTZ_FORMS } from '@quartz-headless/primitives/forms';

@Component({
  selector: 'app-controls-014-demo',
  imports: [
    ReactiveFormsModule,
    AutofillDirective,
    FileUploadDirective,
    FileDropzoneDirective,
    FormFieldControlDirective,
    FormFieldDescriptionDirective,
    FormFieldDirective,
    FormFieldErrorDirective,
    FormFieldLabelDirective,
    InputOtpComponent,
    SwitchDirective,
    ...QUARTZ_FORMS,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './controls-014.demo.html',
})
export class Controls014DemoComponent {
  readonly email = new FormControl('', [Validators.required, Validators.email]);
  readonly notifications = new FormControl(false, { nonNullable: true });
  readonly code = new FormControl('');
  readonly query = new FormControl('', { nonNullable: true });
  readonly autofilled = signal(false);
  readonly completedCode = signal('');
  readonly codeDisabled = signal(false);
  readonly files = signal<readonly File[]>([]);
  readonly rejectedFiles = signal<readonly { file: File; reason: 'type' | 'multiple' }[]>([]);

  resetCode(): void {
    this.code.reset('');
    this.completedCode.set('');
  }

  resetEmail(): void {
    this.email.reset('');
  }

  submitEmail(event: Event): void {
    event.preventDefault();
    this.email.markAsTouched();
  }

  submitSearch(event: Event): void {
    event.preventDefault();
  }
}
