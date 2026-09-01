import { DOCUMENT } from '@angular/common';
import {
  Directive,
  ElementRef,
  OnDestroy,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import { CollectionStore, resolveDirection, type CollectionItem } from '@quartz-headless/core';
import type { StepDirective } from './step.directive';
import type { StepPanelDirective } from './step-panel.directive';
import type { StepTriggerDirective } from './step-trigger.directive';
import {
  DEFAULT_STEPPER_CONFIG,
  type StepperActivationMode,
  type StepperOrientation,
} from './stepper.types';

let stepperId = 0;

@Directive({
  selector: '[qzStepper]',
  exportAs: 'qzStepper',
  standalone: true,
  host: {
    '[attr.data-qz-stepper]': '""',
    '[attr.data-qz-orientation]': 'orientation()',
    '[attr.data-qz-linear]': 'linear() ? "" : null',
    '(keydown)': 'handleKeydown($event)',
  },
})
export class StepperDirective<T> implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly generatedId = `qz-stepper-${++stepperId}`;
  private readonly collection = new CollectionStore<StepTriggerDirective<T> & CollectionItem>(
    { focusStrategy: 'roving-tabindex', orientation: 'horizontal' },
    this.document,
  );
  private readonly steps = new Set<StepDirective<T>>();
  private readonly panels = new Set<StepPanelDirective<T>>();
  private defaultedValue = false;

  readonly value = model<T | null>(null);
  readonly orientation = input<StepperOrientation>(DEFAULT_STEPPER_CONFIG.orientation);
  readonly activationMode = input<StepperActivationMode>(DEFAULT_STEPPER_CONFIG.activationMode);
  readonly linear = input(DEFAULT_STEPPER_CONFIG.linear, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly compareWith = input<(a: T, b: T) => boolean>(
    DEFAULT_STEPPER_CONFIG.compareWith as (a: T, b: T) => boolean,
  );

  readonly activeTrigger = computed(() => this.collection.activeItem());

  registerStep(step: StepDirective<T>): void {
    this.steps.add(step);
    this.ensureValue();
  }

  unregisterStep(step: StepDirective<T>): void {
    const wasActive = this.matchesValue(step.stepValue(), this.value());
    this.steps.delete(step);
    if (wasActive) this.recoverActiveValue();
  }

  registerTrigger(trigger: StepTriggerDirective<T>): void {
    this.configureCollection();
    this.collection.register(trigger as StepTriggerDirective<T> & CollectionItem);
    if ((this.value() === null || this.defaultedValue) && !trigger.stepDisabled()) {
      const first = this.collection.enabledItems()[0];
      if (first) {
        this.defaultedValue = true;
        this.value.set(first.stepValue());
        this.collection.setActive(first.id);
      }
    } else if (this.matchesValue(trigger.stepValue(), this.value())) {
      this.collection.setActive(trigger.id);
    }
  }

  unregisterTrigger(trigger: StepTriggerDirective<T>): void {
    const wasActive = this.matchesValue(trigger.stepValue(), this.value());
    this.collection.unregister(trigger as StepTriggerDirective<T> & CollectionItem);
    if (wasActive) this.recoverActiveValue();
  }

  registerPanel(panel: StepPanelDirective<T>): void {
    this.panels.add(panel);
  }

  unregisterPanel(panel: StepPanelDirective<T>): void {
    this.panels.delete(panel);
  }

  goTo(value: T, options: { focus?: boolean } = {}): boolean {
    const trigger = this.triggerForValue(value);
    if (!trigger || this.disabled() || trigger.stepDisabled() || !this.canActivate(trigger)) {
      return false;
    }
    this.collection.setActive(trigger.id, options);
    this.defaultedValue = false;
    this.value.set(trigger.stepValue());
    return true;
  }

  next(options: { focus?: boolean } = {}): boolean {
    const triggers = this.collection.enabledItems();
    const currentIndex = this.activeIndex();
    for (let index = Math.max(0, currentIndex + 1); index < triggers.length; index += 1) {
      if (this.goTo(triggers[index].stepValue(), options)) return true;
    }
    return false;
  }

  previous(options: { focus?: boolean } = {}): boolean {
    const triggers = this.collection.enabledItems();
    const currentIndex = this.activeIndex();
    for (let index = currentIndex - 1; index >= 0; index -= 1) {
      if (this.goTo(triggers[index].stepValue(), options)) return true;
    }
    return false;
  }

  activate(trigger: StepTriggerDirective<T>, options: { focus?: boolean } = {}): void {
    this.goTo(trigger.stepValue(), options);
  }

  setActive(trigger: StepTriggerDirective<T>, options: { focus?: boolean } = {}): void {
    if (this.disabled() || trigger.stepDisabled()) return;
    this.collection.setActive(trigger.id, options);
    if (this.activationMode() === 'automatic') this.goTo(trigger.stepValue(), options);
  }

  activeTabIndex(id: string): 0 | -1 {
    return this.collection.activeTabIndex(id);
  }

  isActiveValue(value: T): boolean {
    return this.matchesValue(value, this.value());
  }

  isCompletedValue(value: T): boolean {
    return this.stepForValue(value)?.completed() ?? false;
  }

  isDisabledValue(value: T): boolean {
    return this.stepForValue(value)?.disabled() ?? false;
  }

  panelIdFor(trigger: StepTriggerDirective<T>): string {
    const panel = [...this.panels].find((current) =>
      this.compareWith()(current.stepValue(), trigger.stepValue()),
    );
    return panel?.id ?? `${this.generatedId}-panel-${trigger.id}`;
  }

  triggerIdFor(panel: StepPanelDirective<T>): string | null {
    return (
      this.collection
        .items()
        .find((trigger) => this.compareWith()(trigger.stepValue(), panel.stepValue()))?.id ?? null
    );
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    this.configureCollection();
    const handled = this.collection.handleKeydown(event, { focus: true });
    if (!handled || this.activationMode() !== 'automatic') return;
    const active = this.collection.activeItem();
    if (active) this.goTo(active.stepValue());
  }

  ngOnDestroy(): void {
    this.collection.destroy();
  }

  private configureCollection(): void {
    this.collection.configure({
      focusStrategy: 'roving-tabindex',
      orientation: this.orientation(),
      direction: resolveDirection(this.elementRef.nativeElement),
    });
  }

  private ensureValue(): void {
    if (this.value() !== null) return;
    const first = this.collection.enabledItems()[0];
    if (first) {
      this.defaultedValue = true;
      this.value.set(first.stepValue());
    }
  }

  private recoverActiveValue(): void {
    const triggers = this.collection.enabledItems();
    if (!triggers.length) {
      this.value.set(null);
      this.defaultedValue = true;
      return;
    }
    const currentIndex = Math.max(0, this.activeIndex());
    const previous = triggers[Math.min(currentIndex, triggers.length - 1)] ?? null;
    const fallback = previous ?? triggers[0];
    this.value.set(fallback.stepValue());
    this.collection.setActive(fallback.id);
    this.defaultedValue = true;
  }

  private canActivate(trigger: StepTriggerDirective<T>): boolean {
    if (!this.linear()) return true;
    const triggers = this.collection.items();
    const targetIndex = triggers.findIndex((current) => current === trigger);
    if (targetIndex <= 0) return true;
    for (let index = 0; index < targetIndex; index += 1) {
      const current = triggers[index];
      if (current.stepDisabled()) continue;
      if (!this.isCompletedValue(current.stepValue())) return false;
    }
    return true;
  }

  private activeIndex(): number {
    const triggers = this.collection.enabledItems();
    const active = this.value();
    const index = triggers.findIndex((trigger) => this.matchesValue(trigger.stepValue(), active));
    return index === -1 ? 0 : index;
  }

  private triggerForValue(value: T): StepTriggerDirective<T> | null {
    return (
      this.collection.items().find((trigger) => this.compareWith()(trigger.stepValue(), value)) ??
      null
    );
  }

  private stepForValue(value: T): StepDirective<T> | null {
    return [...this.steps].find((step) => this.compareWith()(step.stepValue(), value)) ?? null;
  }

  private matchesValue(value: T, active: T | null): boolean {
    return active !== null && this.compareWith()(value, active);
  }
}
