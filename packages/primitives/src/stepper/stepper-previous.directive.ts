import { Directive, booleanAttribute, inject, input } from '@angular/core';
import { StepperDirective } from './stepper.directive';

@Directive({
  selector: '[qzStepperPrevious]',
  exportAs: 'qzStepperPrevious',
  standalone: true,
  host: {
    type: 'button',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.data-qz-disabled]': 'disabled() ? "" : null',
    '(click)': 'onClick($event)',
  },
})
export class StepperPreviousDirective<T> {
  private readonly stepper = inject(StepperDirective<T>);
  readonly disabled = input(false, {
    alias: 'qzStepperPreviousDisabled',
    transform: booleanAttribute,
  });

  onClick(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      return;
    }
    this.stepper.previous({ focus: true });
  }
}
