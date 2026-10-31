import { JsonPipe } from '@angular/common';
import { Component, ElementRef, afterNextRender, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AutofillDirective } from '@quartz-headless/primitives';

interface LogEntry {
  seq: number;
  field: string;
  autofilled: boolean;
}

/**
 * Autofill lab for GENUINE browser autofill (docs/releases/0.19-autofill-verification.md).
 *
 * Uses the documented production CSS (`:-webkit-autofill` -> `qz-autofill-start`, see styles.css) and
 * plain `autocomplete` tokens, so only a real browser autofill can move a field into the detected
 * state. Every observable the verification procedure asks about is printed on the page.
 */
@Component({
  selector: 'app-autofill-page',
  imports: [ReactiveFormsModule, AutofillDirective, JsonPipe],
  template: `
    <h1>Autofill lab</h1>
    <p>
      Use synthetic, non-sensitive data only (for example "Ada Example", "ada&#64;example.test").
      Save it as a profile in a throwaway browser profile, then trigger the browser's autofill on a
      field. Nothing on this page is sent anywhere.
    </p>

    @if (showFields()) {
      <form
        [formGroup]="form"
        autocomplete="on"
        data-testid="lab-fields"
        (submit)="$event.preventDefault()"
      >
        @for (f of fields; track f.name) {
          <p>
            <label
              >{{ f.label }}
              <input
                qzAutofill
                class="af-real"
                type="text"
                [attr.name]="f.name"
                [attr.autocomplete]="f.autocomplete"
                [formControlName]="f.name"
                [attr.data-testid]="'lab-' + f.name"
                (autofilledChange)="onChange(f.name, $event)"
              />
            </label>
          </p>
        }
        <p>
          <button type="button" data-testid="lab-reset" (click)="reset()">Reset form values</button>
        </p>
      </form>
    }
    <p>
      <button type="button" data-testid="lab-toggle" (click)="showFields.set(!showFields())">
        {{ showFields() ? 'Destroy fields' : 'Recreate fields' }}
      </button>
      <a href="/forms">Navigate to another route</a>
    </p>

    <h2>Observed state</h2>
    <dl>
      <dt>Angular Forms value</dt>
      <dd data-testid="lab-form-value">{{ form.getRawValue() | json }}</dd>
      <dt><code>autofilledChange</code> emissions</dt>
      <dd data-testid="lab-count">{{ log().length }}</dd>
      <dt>Live regions inside the form (the directive adds none)</dt>
      <dd data-testid="lab-live">{{ liveRegions() }}</dd>
    </dl>
    <h2>Emission log</h2>
    <ol data-testid="lab-log" aria-label="autofilledChange emission log">
      @for (e of log(); track e.seq) {
        <li>#{{ e.seq }} {{ e.field }} → {{ e.autofilled }}</li>
      } @empty {
        <li>none yet</li>
      }
    </ol>
  `,
})
export class AutofillPage {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly fields = [
    { name: 'name', label: 'Full name', autocomplete: 'name' },
    { name: 'email', label: 'Email', autocomplete: 'email' },
    { name: 'tel', label: 'Phone', autocomplete: 'tel' },
    { name: 'street', label: 'Street address', autocomplete: 'address-line1' },
    { name: 'postal', label: 'Postal code', autocomplete: 'postal-code' },
  ];
  readonly form = new FormGroup(
    Object.fromEntries(
      this.fields.map((f) => [f.name, new FormControl('', { nonNullable: true })]),
    ),
  );
  readonly showFields = signal(true);
  readonly log = signal<LogEntry[]>([]);
  readonly liveRegions = signal(0);

  constructor() {
    afterNextRender(() => this.countLiveRegions());
  }

  onChange(field: string, autofilled: boolean): void {
    this.log.update((log) => [...log, { seq: log.length + 1, field, autofilled }]);
    this.countLiveRegions();
  }

  reset(): void {
    this.form.reset();
  }

  private countLiveRegions(): void {
    this.liveRegions.set(
      this.#host.nativeElement.querySelectorAll(
        'form [aria-live]:not([aria-live="off"]), form [role="status"], form [role="alert"]',
      ).length,
    );
  }
}
