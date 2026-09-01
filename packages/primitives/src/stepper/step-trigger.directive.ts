import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { StepDirective } from './step.directive';
import { StepperDirective } from './stepper.directive';

let stepTriggerId = 0;

@Directive({
  selector: '[qzStepTrigger]',
  exportAs: 'qzStepTrigger',
  standalone: true,
  host: {
    type: 'button',
    '[attr.id]': 'id',
    '[attr.tabindex]': 'tabIndex()',
    '[attr.aria-current]': 'active() ? "step" : null',
    '[attr.aria-controls]': 'panelId()',
    '[attr.aria-disabled]': 'stepDisabled() ? "true" : null',
    '[attr.data-qz-step-trigger]': '""',
    '[attr.data-qz-active]': 'active() ? "" : null',
    '[attr.data-qz-completed]': 'completed() ? "" : null',
    '[attr.data-qz-disabled]': 'stepDisabled() ? "" : null',
    '[attr.data-qz-state]': 'state()',
    '(click)': 'onClick($event)',
    '(focus)': 'onFocus()',
  },
})
export class StepTriggerDirective<T> implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly step = inject(StepDirective<T>, { optional: true });
  protected readonly stepper = inject(StepperDirective<T>);

  readonly value = input<T | null>(null, { alias: 'qzStepTrigger' });
  readonly disabled = input(false, { alias: 'qzStepTriggerDisabled', transform: booleanAttribute });

  readonly id = `qz-step-trigger-${++stepTriggerId}`;
  readonly element = () => this.elementRef.nativeElement;
  readonly label = () => this.elementRef.nativeElement.textContent?.trim() ?? '';
  readonly active = computed(() => this.stepper.isActiveValue(this.stepValue()));
  readonly completed = computed(() => this.stepper.isCompletedValue(this.stepValue()));
  readonly stepDisabled = computed(() => this.disabled() || this.step?.disabled() || false);
  readonly tabIndex = computed(() =>
    this.stepDisabled() ? -1 : this.stepper.activeTabIndex(this.id),
  );
  readonly panelId = computed(() => this.stepper.panelIdFor(this));

  stepValue(): T {
    const value = this.value();
    if (value !== null && value !== undefined && value !== ('' as T)) return value;
    return this.step!.stepValue();
  }

  state(): string {
    if (this.stepDisabled()) return 'disabled';
    if (this.active()) return 'active';
    if (this.completed()) return 'completed';
    return 'inactive';
  }

  ngOnInit(): void {
    this.stepper.registerTrigger(this);
  }

  ngOnDestroy(): void {
    this.stepper.unregisterTrigger(this);
  }

  onClick(event: MouseEvent): void {
    event.preventDefault();
    this.stepper.activate(this, { focus: true });
  }

  onFocus(): void {
    this.stepper.setActive(this);
  }
}
