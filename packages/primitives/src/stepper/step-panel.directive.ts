import { Directive, OnDestroy, OnInit, computed, inject, input } from '@angular/core';
import { StepDirective } from './step.directive';
import { StepperDirective } from './stepper.directive';

let stepPanelId = 0;

@Directive({
  selector: '[qzStepPanel]',
  exportAs: 'qzStepPanel',
  standalone: true,
  host: {
    '[attr.id]': 'id',
    '[attr.role]': '"region"',
    '[attr.aria-labelledby]': 'triggerId()',
    '[attr.data-qz-step-panel]': '""',
    '[attr.data-qz-active]': 'active() ? "" : null',
    '[attr.data-qz-state]': 'active() ? "active" : "inactive"',
    '[attr.hidden]': 'active() ? null : ""',
  },
})
export class StepPanelDirective<T> implements OnInit, OnDestroy {
  private readonly step = inject(StepDirective<T>, { optional: true });
  protected readonly stepper = inject(StepperDirective<T>);

  readonly value = input<T | null>(null, { alias: 'qzStepPanel' });
  readonly id = `qz-step-panel-${++stepPanelId}`;
  readonly active = computed(() => this.stepper.isActiveValue(this.stepValue()));
  readonly triggerId = computed(() => this.stepper.triggerIdFor(this));

  stepValue(): T {
    const value = this.value();
    if (value !== null && value !== undefined && value !== ('' as T)) return value;
    return this.step!.stepValue();
  }

  ngOnInit(): void {
    this.stepper.registerPanel(this);
  }

  ngOnDestroy(): void {
    this.stepper.unregisterPanel(this);
  }
}
