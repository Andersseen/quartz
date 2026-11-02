import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';
import settingsDialogSource from '../../demos/settings-dialog-demo.component.ts?raw';
import { SettingsDialogDemoComponent } from '../../demos/settings-dialog-demo.component';
import { DemoShowcaseComponent } from '../demo-showcase/demo-showcase.component';
import { SectionHeadingComponent } from '../section-heading/section-heading.component';

/**
 * Secondary demo: Dialog + Select composed with no predefined visual system. The demo component is
 * lazy: its code (Dialog, Select and their dependencies) is not part of the initial bundle and is
 * not executed while prerendering. The placeholder sits on the same fixed stage, so nothing shifts.
 */
@Component({
  selector: 'app-home-compose',
  imports: [
    RouterLink,
    DemoShowcaseComponent,
    SettingsDialogDemoComponent,
    SectionHeadingComponent,
    ...MOVEMENT_DIRECTIVES,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="compose-title" class="section-shell section-band">
      <div class="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
        <div>
          <app-section-heading headingId="compose-title" eyebrow="Composition" tone="signal">
            <ng-container heading>Layers that stack without a fight.</ng-container>
            A Select lives inside a Dialog here. Quartz traps focus in the dialog, lets the popup
            layer above it, closes only the top layer on Escape and returns focus to the button that
            opened it. Every pixel of the visuals is the consumer's.
          </app-section-heading>

          <ul class="mt-8 space-y-3" aria-label="What Quartz handles in this demo">
            @for (item of handled; track item.text) {
              <li [move]="'fade-up'" class="flex items-start gap-3 text-sm leading-6 text-fg-muted">
                <span class="check-mark" aria-hidden="true">✓</span>
                <span>
                  {{ item.text }}
                  @for (key of item.keys; track key) {
                    <kbd class="kbd">{{ key }}</kbd>
                  }
                </span>
              </li>
            }
          </ul>

          <p class="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-fg-subtle">
            Read more:
            <a routerLink="/docs/primitives/dialog" class="site-focus link-arrow">Dialog</a>
            <a routerLink="/docs/primitives/select" class="site-focus link-arrow">Select</a>
            <a routerLink="/docs/guides/recipes" class="site-focus link-arrow">Recipes</a>
          </p>
        </div>

        <div [move]="'fade-up'" [moveDelay]="120" class="relative min-w-0">
          <div class="showcase-glow showcase-glow-signal" aria-hidden="true"></div>
          <app-demo-showcase
            label="Dialog and Select"
            filename="settings-dialog-demo.component.ts"
            height="22rem"
            [code]="source"
          >
            @defer (on idle) {
              <app-settings-dialog-demo />
            } @placeholder {
              <div class="text-center text-sm text-fg-subtle" data-testid="compose-placeholder">
                Loading the interactive example…
              </div>
            } @error {
              <p class="text-center text-sm text-fg-muted">
                The interactive example could not load. The source is under Code.
              </p>
            }
          </app-demo-showcase>
        </div>
      </div>
    </section>
  `,
})
export class HomeComposeComponent {
  protected readonly source = settingsDialogSource;
  protected readonly handled = [
    { text: 'Opens from the keyboard with', keys: ['Enter', 'Space'] },
    { text: 'Escape closes the top layer only, popup first, then the dialog', keys: ['Esc'] },
    { text: 'Focus is trapped while open and returns to the opener', keys: ['Tab'] },
    { text: 'The dialog is named by its title; the select by its label', keys: [] },
  ];
}
