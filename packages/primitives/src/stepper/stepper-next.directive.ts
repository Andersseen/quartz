import { Directive, booleanAttribute, inject, input } from '@angular/core';
import { StepperDirective } from './stepper.directive';

@Directive({
  selector: '[qzStepperNext]',
  exportAs: 'qzStepperNext',
  standalone: true,
  host: {
    type: 'button',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.data-qz-disabled]': 'disabled() ? "" : null',
    '(click)': 'onClick($event)',
  },
})
export class StepperNextDirective<T> {
  private readonly stepper = inject(StepperDirective<T>);
  readonly disabled = input(false, { alias: 'qzStepperNextDisabled', transform: booleanAttribute });

  onClick(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      return;
    }
    this.stepper.next({ focus: true });
  }
}
