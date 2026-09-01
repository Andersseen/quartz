import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';
import { StepperDirective } from './stepper.directive';

@Directive({
  selector: '[qzStep]',
  exportAs: 'qzStep',
  standalone: true,
  host: {
    '[attr.data-qz-step]': '""',
    '[attr.data-qz-active]': 'stepper.isActiveValue(value()) ? "" : null',
    '[attr.data-qz-completed]': 'completed() ? "" : null',
    '[attr.data-qz-disabled]': 'disabled() ? "" : null',
    '[attr.data-qz-state]': 'state()',
  },
})
export class StepDirective<T> implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly stepper = inject(StepperDirective<T>);

  readonly value = input.required<T>({ alias: 'qzStep' });
  readonly completed = input(false, { alias: 'qzStepCompleted', transform: booleanAttribute });
  readonly disabled = input(false, { alias: 'qzStepDisabled', transform: booleanAttribute });

  state(): string {
    if (this.disabled()) return 'disabled';
    if (this.stepper.isActiveValue(this.stepValue())) return 'active';
    if (this.completed()) return 'completed';
    return 'inactive';
  }

  stepValue(): T {
    const value = this.value();
    if (value !== null && value !== undefined && value !== ('' as T)) return value;
    return (this.elementRef.nativeElement.getAttribute('qzstep') ?? '') as T;
  }

  ngOnInit(): void {
    this.stepper.registerStep(this);
  }

  ngOnDestroy(): void {
    this.stepper.unregisterStep(this);
  }
}
