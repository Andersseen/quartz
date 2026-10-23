export const BASIC_SNIPPET = `accepted = signal(false);

<button qzCheckbox [(checked)]="accepted">
  Accept terms
</button>`;

export const INDETERMINATE_SNIPPET = `state = signal<boolean | 'indeterminate'>('indeterminate');

<button qzCheckbox [(checked)]="state">
  Select all
</button>`;

export const FORMS_SNIPPET = `import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { CheckboxDirective } from '@quartz-headless/primitives';
import { CheckboxControlDirective } from '@quartz-headless/primitives/forms';

@Component({
  imports: [ReactiveFormsModule, CheckboxDirective, CheckboxControlDirective],
  template: \`<button qzCheckbox [formControl]="terms">Accept terms</button>\`,
})
class Terms {
  terms = new FormControl(false, { nonNullable: true, validators: Validators.requiredTrue });
}`;
