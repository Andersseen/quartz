export const BASIC_SNIPPET = `plan = signal('pro');

<div qzRadioGroup [(value)]="plan">
  <button qzRadio="free">Free</button>
  <button qzRadio="pro">Pro</button>
  <button qzRadio="team">Team</button>
</div>`;

export const FORMS_SNIPPET = `import { RadioGroupDirective, RadioDirective } from '@quartz-headless/primitives';
import { RadioGroupControlDirective } from '@quartz-headless/primitives/forms';

@Component({
  imports: [ReactiveFormsModule, RadioGroupDirective, RadioDirective, RadioGroupControlDirective],
  template: \`
    <div qzRadioGroup formControlName="plan" aria-label="Plan">
      <button qzRadio="free">Free</button>
      <button qzRadio="pro">Pro</button>
    </div>\`,
})
class Plan {}`;
