import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

/**
 * "Skip to content". The document has `<base href="/">`, so a plain `#fragment` link would navigate
 * to the site root; this moves focus to `#main-content` instead of changing the URL.
 */
@Component({
  selector: 'app-skip-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<a class="skip-link" href="#main-content" (click)="skip($event)">Skip to content</a>`,
})
export class SkipLinkComponent {
  private readonly document = inject(DOCUMENT);

  protected skip(event: Event): void {
    event.preventDefault();
    const main = this.document.getElementById('main-content');
    main?.focus();
    main?.scrollIntoView?.({ block: 'start' });
  }
}
