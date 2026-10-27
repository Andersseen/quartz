import { DestroyRef, Directive, OnInit, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormFieldDirective } from '@quartz-headless/primitives';

/** Mirrors Angular Forms state into a structural FormField without acting as a value accessor. */
@Directive({
  selector:
    '[qzFormFieldControl][formControl], [qzFormFieldControl][formControlName], [qzFormFieldControl][ngModel]',
  standalone: true,
})
export class FormFieldStateDirective implements OnInit {
  private readonly field = inject(FormFieldDirective, { skipSelf: true });
  private readonly ngControl = inject(NgControl, { self: true });
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.field.setFormState(null));
    const control = this.ngControl.control;
    if (!control) return;
    const update = () =>
      this.field.setFormState({
        invalid: control.invalid,
        touched: control.touched,
        dirty: control.dirty,
        disabled: control.disabled,
        pending: control.pending,
      });
    update();
    control.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(update);
  }
}
