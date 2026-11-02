import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';

export type SectionTone = 'brand' | 'signal' | 'accent';

/**
 * The one heading pattern every landing section uses: eyebrow, h2 and lead. The h2 text is
 * projected into `[heading]`; anything else becomes the lead paragraph.
 */
@Component({
  selector: 'app-section-heading',
  imports: [...MOVEMENT_DIRECTIVES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div [move]="'fade-up'" [class]="center() ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'">
      <p class="section-eyebrow" [attr.data-tone]="tone()">
        <span class="section-eyebrow-dot" aria-hidden="true"></span>{{ eyebrow() }}
      </p>
      <h2
        [id]="headingId()"
        class="mt-4 text-[clamp(2rem,5vw,3.25rem)] leading-[1.05] font-bold tracking-[-0.035em] text-balance text-fg"
      >
        <ng-content select="[heading]" />
      </h2>
      <p class="mt-5 text-base leading-7 text-pretty text-fg-muted sm:text-lg sm:leading-8">
        <ng-content />
      </p>
    </div>
  `,
})
export class SectionHeadingComponent {
  readonly headingId = input.required<string>();
  readonly eyebrow = input.required<string>();
  readonly tone = input<SectionTone>('brand');
  readonly center = input(false);
}
