import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';
import settingsDialogSource from '../../demos/settings-dialog-demo.component.ts?raw';
import { SettingsDialogDemoComponent } from '../../demos/settings-dialog-demo.component';
import { DemoShowcaseComponent } from '../demo-showcase/demo-showcase.component';

/**
 * Secondary demo: Dialog + Select composed with no predefined visual system. The demo component is
 * lazy: its code (Dialog, Select and their dependencies) is not part of the initial bundle and is
 * not executed while prerendering. The placeholder reserves the final height to avoid layout shift.
 */
@Component({
  selector: 'app-home-compose',
  imports: [RouterLink, DemoShowcaseComponent, SettingsDialogDemoComponent, ...MOVEMENT_DIRECTIVES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      aria-labelledby="compose-title"
      class="border-y border-line bg-surface-1/50 px-4 py-20 sm:px-6 md:px-10 md:py-24"
    >
      <div class="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
        <div [move]="'fade-up'">
          <p class="text-xs font-semibold tracking-[0.16em] text-signal uppercase">Composition</p>
          <h2 id="compose-title" class="mt-3 text-3xl font-bold tracking-tight text-fg md:text-4xl">
            Primitives that stack without a design system.
          </h2>
          <p class="mt-5 text-base leading-7 text-fg-muted sm:text-lg sm:leading-8">
            A Select lives inside a Dialog here. Quartz keeps focus inside the dialog, lets the
            popup layer above it, closes only the top layer on Escape and returns focus to the
            button that opened it. Every pixel of the visuals is the consumer's.
          </p>
          <ul class="mt-6 space-y-2 text-sm leading-6 text-fg-muted">
            <li>Open with Enter or Space, close with Escape, Cancel or the backdrop.</li>
            <li>The dialog is named by its title; the select by an accessible label.</li>
            <li>
              Read more:
              <a
                routerLink="/docs/primitives/dialog"
                class="site-focus text-brand underline underline-offset-4"
                >Dialog</a
              >,
              <a
                routerLink="/docs/primitives/select"
                class="site-focus text-brand underline underline-offset-4"
                >Select</a
              >,
              <a
                routerLink="/docs/guides/recipes"
                class="site-focus text-brand underline underline-offset-4"
                >Recipes</a
              >.
            </li>
          </ul>
        </div>

        <div [move]="'fade-up'" [moveDelay]="120" class="min-w-0">
          <app-demo-showcase
            label="Dialog and Select"
            filename="settings-dialog-demo.component.ts"
            [code]="source"
          >
            @defer (on idle) {
              <app-settings-dialog-demo />
            } @placeholder {
              <div class="min-h-28 text-sm text-fg-subtle" data-testid="compose-placeholder">
                Loading the interactive example…
              </div>
            } @error {
              <p class="min-h-28 text-sm text-fg-muted">
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
}
