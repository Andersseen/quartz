import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewContainerRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  CheckboxDirective,
  DialogService,
  ListboxDirective,
  ListboxOptionDirective,
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

/**
 * Browser-contract fixture for the Quartz 0.9 selection controls + Angular Forms adapters.
 * Not documentation: Playwright drives it to assert real form values, focus and DOM semantics.
 * `?dir=rtl` renders the whole form right-to-left. Intentionally unstyled.
 */
@Component({
  selector: 'app-e2e-forms',
  imports: [
    ReactiveFormsModule,
    CheckboxDirective,
    SwitchDirective,
    RadioGroupDirective,
    RadioDirective,
    SelectDirective,
    SelectTriggerDirective,
    SelectContentDirective,
    SelectListboxDirective,
    SelectOptionDirective,
    ListboxDirective,
    ListboxOptionDirective,
    ...QUARTZ_FORMS,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="app" style="padding: 24px" [attr.dir]="dir">
      <h1>Forms</h1>
      <form id="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div>
          <button id="terms" type="button" qzCheckbox formControlName="terms" aria-label="Terms">
            Accept terms
          </button>
          @if (form.controls.terms.touched && form.controls.terms.invalid) {
            <p id="terms-error" role="alert">You must accept the terms</p>
          }
        </div>

        <div>
          <button id="notify" type="button" qzSwitch formControlName="notify" aria-label="Notify">
            Notifications
          </button>
        </div>

        <div
          id="plan"
          qzRadioGroup
          orientation="horizontal"
          formControlName="plan"
          aria-label="Plan"
        >
          <button type="button" qzRadio="free">Free</button>
          <button type="button" qzRadio="pro">Pro</button>
          <button type="button" qzRadio="team">Team</button>
        </div>
        @if (form.controls.plan.touched && form.controls.plan.invalid) {
          <p id="plan-error" role="alert">Choose a plan</p>
        }

        <span id="country-label">Country</span>
        <div qzSelect #country="qzSelect" formControlName="country">
          <button
            id="country"
            type="button"
            qzSelectTrigger
            aria-labelledby="country-label country"
          >
            {{ country.selectedLabel() || 'Choose a country' }}
          </button>
          <ng-template qzSelectContent>
            <div qzSelectListbox style="background: white">
              <button type="button" qzSelectOption="Spain">Spain</button>
              <button type="button" qzSelectOption="France">France</button>
              <button type="button" qzSelectOption="Germany">Germany</button>
            </div>
          </ng-template>
        </div>
        @if (form.controls.country.touched && form.controls.country.invalid) {
          <p id="country-error" role="alert">Choose a country</p>
        }

        <div id="tags" qzListbox [multiple]="true" formControlName="tags" aria-label="Tags">
          <div qzListboxOption="alpha">Alpha</div>
          <div qzListboxOption="beta">Beta</div>
          <div qzListboxOption="gamma">Gamma</div>
        </div>

        <button id="submit" type="submit">Submit</button>
        <button id="reset" type="button" (click)="reset()">Reset</button>
        <button id="prefill" type="button" (click)="prefill()">Prefill</button>
        <button id="toggle-disabled" type="button" (click)="toggleDisabled()">
          Toggle disabled
        </button>
        <button id="open-dialog" type="button" (click)="openDialog()">Open dialog</button>
      </form>

      <p id="valid">{{ form.valid ? 'valid' : 'invalid' }}</p>
      <p id="dirty">{{ form.dirty ? 'dirty' : 'pristine' }}</p>
      <p id="live-value">{{ liveValue() }}</p>
      <pre id="submitted">{{ submitted() }}</pre>
      <p id="dialog-value">{{ dialogValue() }}</p>
    </main>

    <ng-template #dialogTpl let-ref let-labelledBy="ariaLabelledBy">
      <div id="dialog-content" style="background: white; padding: 16px">
        <h2 [id]="labelledBy">Pick a size</h2>
        <div qzSelect #size="qzSelect" [formControl]="dialogChoice">
          <button id="size" type="button" qzSelectTrigger aria-label="Size">
            {{ size.selectedLabel() || 'Choose a size' }}
          </button>
          <ng-template qzSelectContent>
            <div qzSelectListbox style="background: white">
              <button type="button" qzSelectOption="S">Small</button>
              <button type="button" qzSelectOption="M">Medium</button>
            </div>
          </ng-template>
        </div>
        <button id="dialog-close" type="button" (click)="ref.close()">Close</button>
      </div>
    </ng-template>
  `,
})
export default class E2eFormsPage {
  private readonly dialogs = inject(DialogService);
  private readonly vcr = inject(ViewContainerRef);
  private readonly dialogTpl = viewChild.required<TemplateRef<unknown>>('dialogTpl');
  protected readonly dir = inject(ActivatedRoute).snapshot.queryParamMap.get('dir') ?? 'ltr';

  readonly dialogChoice = new FormControl<string | null>(null);
  readonly form = new FormGroup({
    terms: new FormControl<boolean>(false, {
      nonNullable: true,
      validators: Validators.requiredTrue,
    }),
    notify: new FormControl<boolean>(false, { nonNullable: true }),
    plan: new FormControl<string | null>(null, Validators.required),
    country: new FormControl<string | null>(null, Validators.required),
    tags: new FormControl<string[] | null>(null),
  });

  readonly submitted = signal('');
  readonly liveValue = signal(JSON.stringify(this.form.getRawValue()));
  readonly dialogValue = signal('none');

  constructor() {
    this.form.valueChanges.subscribe(() =>
      this.liveValue.set(JSON.stringify(this.form.getRawValue())),
    );
    this.dialogChoice.valueChanges.subscribe((value) => this.dialogValue.set(value ?? 'none'));
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.submitted.set(JSON.stringify(this.form.getRawValue()));
  }

  reset(): void {
    this.form.reset({ terms: false, notify: false, plan: null, country: null, tags: null });
    this.submitted.set('');
  }

  prefill(): void {
    this.form.patchValue({
      terms: true,
      notify: true,
      plan: 'team',
      country: 'France',
      tags: ['alpha', 'gamma'],
    });
  }

  toggleDisabled(): void {
    if (this.form.disabled) this.form.enable();
    else this.form.disable();
  }

  openDialog(): void {
    this.dialogs.open(this.dialogTpl(), this.vcr, { width: '320px' });
  }
}
