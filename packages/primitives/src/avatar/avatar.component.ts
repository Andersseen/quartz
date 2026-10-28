import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  PLATFORM_ID,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

/** Headless avatar image with a delayed, consumer supplied text fallback. */
@Component({
  selector: 'qz-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (src(); as imageSource) {
      @for (source of [imageSource]; track source) {
        <img
          [src]="source"
          [alt]="alt()"
          [hidden]="!imageLoaded()"
          (error)="onError($event)"
          (load)="onLoad($event)"
          data-qz-part="image"
        />
      }
    }
    @if (!src() || showFallback()) {
      <span data-qz-part="fallback" [attr.data-qz-state]="src() ? 'error' : 'empty'">{{
        fallback()
      }}</span>
    }
  `,
  host: {
    '[attr.data-qz-state]': 'state()',
    '[attr.data-qz-loaded]': 'imageLoaded() ? "" : null',
  },
})
export class AvatarComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  readonly src = input<string | null>(null);
  readonly alt = input('');
  readonly fallback = input('');
  readonly fallbackDelay = input(0);
  readonly imageLoaded = signal(false);
  readonly showFallback = signal(true);
  readonly state = () =>
    this.imageLoaded()
      ? 'loaded'
      : this.src()
        ? this.showFallback()
          ? 'fallback'
          : 'loading'
        : 'empty';
  private timer: number | null = null;

  constructor() {
    effect(() => {
      this.src();
      this.imageLoaded.set(false);
      const source = this.src();
      const browser = isPlatformBrowser(this.platformId);
      this.showFallback.set(!source || !browser || this.fallbackDelay() <= 0);
      this.clearTimer();
      if (source && browser && this.fallbackDelay() > 0 && this.document.defaultView) {
        this.timer = this.document.defaultView.setTimeout(() => {
          this.timer = null;
          if (!this.imageLoaded()) this.showFallback.set(true);
        }, this.fallbackDelay());
      }
    });
  }
  onLoad(event: Event): void {
    if (!this.isCurrentSource(event)) return;
    this.clearTimer();
    this.imageLoaded.set(true);
    this.showFallback.set(false);
  }
  onError(event: Event): void {
    if (!this.isCurrentSource(event)) return;
    this.clearTimer();
    this.imageLoaded.set(false);
    this.showFallback.set(true);
  }
  private isCurrentSource(event: Event): boolean {
    const image = event.currentTarget as HTMLImageElement | null;
    const source = this.src();
    return !!image && !!source && image.src === new URL(source, this.document.baseURI).href;
  }
  private clearTimer(): void {
    if (this.timer !== null) this.document.defaultView?.clearTimeout(this.timer);
    this.timer = null;
  }
  ngOnDestroy(): void {
    this.clearTimer();
  }
}
