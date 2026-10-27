import {
  Directive,
  booleanAttribute,
  contentChildren,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';

export interface FormFieldControlState {
  invalid: boolean;
  touched: boolean;
  dirty: boolean;
  disabled: boolean;
  pending: boolean;
}

/** Accessible relationships for one field. Supply a stable, unique id per field for SSR. */
@Directive({
  selector: '[qzFormField]',
  exportAs: 'qzFormField',
  standalone: true,
  host: {
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.data-touched]': 'isTouched() ? "" : null',
    '[attr.data-dirty]': 'isDirty() ? "" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-pending]': 'isPending() ? "" : null',
  },
})
export class FormFieldDirective {
  readonly id = input.required<string>();
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly dirty = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly #formState = signal<FormFieldControlState | null>(null);

  readonly isInvalid = computed(() => this.#formState()?.invalid ?? this.invalid());
  readonly isTouched = computed(() => this.#formState()?.touched ?? this.touched());
  readonly isDirty = computed(() => this.#formState()?.dirty ?? this.dirty());
  readonly isDisabled = computed(() => this.#formState()?.disabled ?? this.disabled());
  readonly isPending = computed(() => this.#formState()?.pending ?? false);

  setFormState(state: FormFieldControlState | null): void {
    this.#formState.set(state);
  }

  readonly labels = contentChildren(
    forwardRef(() => FormFieldLabelDirective),
    { descendants: true },
  );
  readonly descriptions = contentChildren(
    forwardRef(() => FormFieldDescriptionDirective),
    {
      descendants: true,
    },
  );
  readonly errors = contentChildren(
    forwardRef(() => FormFieldErrorDirective),
    { descendants: true },
  );

  readonly labelIds = computed(() => this.labels().map((part) => part.resolvedId()));
  readonly descriptionIds = computed(() => [
    ...this.descriptions().map((part) => part.resolvedId()),
    ...this.errors().map((part) => part.resolvedId()),
  ]);
  readonly labelledBy = computed(() => this.labelIds().join(' ') || null);
  readonly describedBy = computed(() => this.descriptionIds().join(' ') || null);
}

/** Apply to a native input/textarea/select or a compatible Quartz control host. */
@Directive({
  selector: '[qzFormFieldControl]',
  standalone: true,
  host: {
    '[attr.id]': 'id() || field.id() + "-control"',
    '[attr.aria-labelledby]': 'field.labelledBy()',
    '[attr.aria-describedby]': 'field.describedBy()',
    '[attr.aria-invalid]': 'field.isInvalid() ? "true" : null',
    '[attr.aria-required]': 'field.required() ? "true" : null',
    '[attr.aria-disabled]': 'field.isDisabled() ? "true" : null',
    '[attr.disabled]': 'field.isDisabled() ? "" : null',
    '[attr.data-invalid]': 'field.isInvalid() ? "" : null',
    '[attr.data-disabled]': 'field.isDisabled() ? "" : null',
  },
})
export class FormFieldControlDirective {
  readonly id = input<string>();
  readonly field = inject(FormFieldDirective);
}

/** Use a native label for native controls; use this on a span for button-like controls. */
@Directive({
  selector: '[qzFormFieldLabel]',
  standalone: true,
  host: { '[attr.id]': 'resolvedId()' },
})
export class FormFieldLabelDirective {
  private readonly field = inject(FormFieldDirective);
  readonly id = input<string>();
  readonly resolvedId = computed(() => this.id() || `${this.field.id()}-label`);
}

@Directive({
  selector: '[qzFormFieldDescription]',
  standalone: true,
  host: { '[attr.id]': 'id()' },
})
export class FormFieldDescriptionDirective {
  readonly id = input.required<string>();
  readonly resolvedId = computed(() => this.id());
}

@Directive({
  selector: '[qzFormFieldError]',
  standalone: true,
  host: {
    '[attr.id]': 'id()',
    '[attr.data-invalid]': 'invalid() ? "" : null',
  },
})
export class FormFieldErrorDirective {
  private readonly field = inject(FormFieldDirective);
  readonly id = input.required<string>();
  readonly resolvedId = computed(() => this.id());

  readonly invalid = this.field.isInvalid;
}
