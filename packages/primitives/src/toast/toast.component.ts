import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { Toast, ToastAction, ToastContentContext } from './toast.types';

@Component({
  selector: 'qz-toast',
  standalone: true,
  imports: [NgTemplateOutlet, NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="qz-toast"
      [class]="'qz-toast--' + toast().type"
      [attr.data-qz-type]="toast().type"
      [attr.role]="toast().type === 'error' ? 'alert' : 'status'"
      aria-atomic="true"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
      (focusin)="onFocusIn()"
      (focusout)="onFocusOut($event)"
    >
      @if (toast().showProgress && toast().duration > 0) {
        <div class="qz-toast__progress" aria-hidden="true">
          <div class="qz-toast__progress-bar" [style.width.%]="progress()"></div>
        </div>
      }
      <div class="qz-toast__content">
        @if (toast().content; as content) {
          @if (isTemplate(content)) {
            <ng-container
              [ngTemplateOutlet]="$any(content)"
              [ngTemplateOutletContext]="templateContext()"
            />
          } @else {
            <ng-container *ngComponentOutlet="$any(content); inputs: componentInputs()" />
          }
        } @else {
          @if (toast().title) {
            <div class="qz-toast__title">{{ toast().title }}</div>
          }
          <div class="qz-toast__message">{{ toast().message }}</div>
        }
        @for (action of toast().actions; track action.label) {
          <button type="button" class="qz-toast__action" (click)="activate(action)">
            {{ action.label }}
          </button>
        }
      </div>
      @if (toast().closable) {
        <button
          type="button"
          class="qz-toast__close"
          (click)="dismiss.emit()"
          aria-label="Close notification"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      }
    </div>
  `,
  host: { '[class.qz-toast-wrapper]': 'true' },
})
export class ToastComponent {
  readonly toast = input.required<Toast>();
  readonly dismiss = output<void>();
  readonly action = output<ToastAction>();
  readonly paused = output<void>();
  readonly resumed = output<void>();
  readonly progress = input<number>(100);
  readonly dismissContext = input.required<() => void>();
  private hovered = false;
  private focused = false;
  private pauseActive = false;
  readonly templateContext = computed(() => ({
    $implicit: this.toast(),
    toast: this.toast(),
    dismiss: this.dismissContext(),
  }));
  readonly componentInputs = computed(() => ({
    context: { toast: this.toast(), dismiss: this.dismissContext() } satisfies ToastContentContext,
  }));
  isTemplate(content: unknown): boolean {
    return typeof content === 'object' && content !== null && 'createEmbeddedView' in content;
  }
  activate(action: ToastAction): void {
    action.run();
    this.action.emit(action);
  }
  onMouseEnter(): void {
    this.hovered = true;
    this.updatePauseState();
  }
  onMouseLeave(): void {
    this.hovered = false;
    this.updatePauseState();
  }
  onFocusIn(): void {
    this.focused = true;
    this.updatePauseState();
  }
  onFocusOut(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement;
    if (!host.contains(event.relatedTarget as Node | null)) {
      this.focused = false;
      this.updatePauseState();
    }
  }
  private updatePauseState(): void {
    const shouldPause = (this.hovered && this.toast().pauseOnHover) || this.focused;
    if (shouldPause === this.pauseActive) return;
    this.pauseActive = shouldPause;
    if (shouldPause) this.paused.emit();
    else this.resumed.emit();
  }
}
