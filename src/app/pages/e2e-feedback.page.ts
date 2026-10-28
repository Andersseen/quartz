import {
  ChangeDetectionStrategy,
  Component,
  Input,
  TemplateRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  AvatarComponent,
  MeterDirective,
  MeterIndicatorDirective,
  MeterTrackDirective,
  ProgressDirective,
  ProgressIndicatorDirective,
  ProgressTrackDirective,
  ToastService,
  type ToastContentComponent,
  type ToastContentContext,
  type ToastTemplateContext,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-e2e-toast-content',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span id="component-toast-message">{{ context.toast.message }}</span>
    <button type="button" id="component-toast-dismiss" (click)="context.dismiss()">
      Dismiss component toast
    </button>
  `,
})
class FeedbackToastContentComponent implements ToastContentComponent {
  @Input() context!: ToastContentContext;
}

@Component({
  selector: 'app-e2e-feedback',
  standalone: true,
  imports: [
    ProgressDirective,
    ProgressTrackDirective,
    ProgressIndicatorDirective,
    MeterDirective,
    MeterTrackDirective,
    MeterIndicatorDirective,
    AvatarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="feedback-fixture">
      <h1>Feedback and indicators fixture</h1>
      <div
        id="progress"
        qzProgress
        [value]="progress()"
        [min]="0"
        [max]="100"
        aria-label="Upload"
        aria-valuetext="{{ progress() }} percent"
      >
        <div qzProgressTrack><div qzProgressIndicator></div></div>
      </div>
      <button id="progress-next" type="button" (click)="advanceProgress()">Advance</button>
      <button id="progress-indeterminate" type="button" (click)="progress.set(null)">
        Indeterminate
      </button>
      <div id="meter" qzMeter [value]="meter()" [min]="0" [max]="100" aria-label="Storage">
        <div qzMeterTrack><div qzMeterIndicator></div></div>
      </div>
      <button id="meter-next" type="button" (click)="advanceMeter()">Advance meter</button>
      <qz-avatar
        id="avatar"
        [src]="avatarSrc()"
        alt="Profile photo"
        fallback="JD"
        [fallbackDelay]="100"
      />
      <button id="avatar-load" type="button" (click)="avatarSrc.set(validAvatar)">
        Load avatar
      </button>
      <button id="avatar-fail" type="button" (click)="avatarSrc.set('/missing-avatar.png')">
        Fail avatar
      </button>
      <button id="show-template" type="button" (click)="showTemplate()">Show template toast</button>
      <button id="show-component" type="button" (click)="showComponent()">
        Show component toast
      </button>
      <button id="show-action" type="button" (click)="showAction()">Show action toast</button>
      <ng-template #custom let-dismiss="dismiss"
        ><span>Custom toast content</span
        ><button id="content-dismiss" type="button" (click)="dismiss()">
          Dismiss from content
        </button></ng-template
      >
    </main>
  `,
})
export default class E2eFeedbackPage {
  readonly progress = signal<number | null>(30);
  readonly meter = signal(72);
  readonly validAvatar = '/favicon.svg';
  readonly avatarSrc = signal('data:image/png;base64,not-a-valid-image');
  private readonly toast = inject(ToastService);
  private readonly content = viewChild.required<TemplateRef<ToastTemplateContext>>('custom');
  advanceProgress(): void {
    const value = this.progress();
    this.progress.set(value === null ? 0 : Math.min(value + 10, 100));
  }
  advanceMeter(): void {
    this.meter.update((value) => Math.min(value + 10, 100));
  }
  showTemplate(): void {
    this.toast.show({ type: 'info', content: this.content(), duration: 0 });
  }
  showAction(): void {
    this.toast.show({
      type: 'success',
      message: 'Action ready',
      duration: 0,
      actions: [{ label: 'Undo', run: () => {}, dismiss: true }],
    });
  }
  showComponent(): void {
    this.toast.show({
      type: 'info',
      message: 'Component toast content',
      content: FeedbackToastContentComponent,
      duration: 0,
    });
  }
}
