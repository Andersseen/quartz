import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ToggleGroupDirective, ToggleItemDirective } from '@quartz-headless/primitives';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';
import volumeDemoSource from '../../demos/volume-demo.component.ts?raw';
import { VolumeDemoComponent, type VolumeSkin } from '../../demos/volume-demo.component';
import { DemoShowcaseComponent } from '../demo-showcase/demo-showcase.component';
import { SectionHeadingComponent } from '../section-heading/section-heading.component';

interface SkinOption {
  id: VolumeSkin;
  label: string;
}

/**
 * First live demo, directly under the hero: the same Slider + Switch in four completely different
 * skins. The skin picker is itself a Quartz ToggleGroup.
 */
@Component({
  selector: 'app-home-playground',
  imports: [
    DemoShowcaseComponent,
    VolumeDemoComponent,
    SectionHeadingComponent,
    ToggleGroupDirective,
    ToggleItemDirective,
    ...MOVEMENT_DIRECTIVES,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="playground-title" class="section-shell">
      <div class="mx-auto max-w-6xl">
        <app-section-heading
          headingId="playground-title"
          eyebrow="Headless, shown"
          tone="brand"
          [center]="true"
        >
          <ng-container heading>One behaviour. Any skin.</ng-container>
          These are the real Quartz <code class="font-mono text-fg">Slider</code> and
          <code class="font-mono text-fg">Switch</code>. Pick a skin: the markup and the class map
          change, the keyboard, pointer, ARIA and state handling do not.
        </app-section-heading>

        <div [move]="'fade-up'" class="mt-10 flex justify-center">
          <div
            qzToggleGroup
            [(value)]="skin"
            [allowDeselection]="false"
            aria-label="Demo skin"
            class="inline-flex flex-wrap justify-center gap-1 rounded-xl border border-line bg-surface-1 p-1"
          >
            @for (option of skins; track option.id) {
              <button
                [qzToggleItem]="option.id"
                class="site-focus min-h-10 rounded-lg px-4 text-sm font-medium text-fg-muted transition-colors hover:text-fg data-[qz-state=on]:bg-white/10 data-[qz-state=on]:text-fg data-[qz-state=on]:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]"
              >
                {{ option.label }}
              </button>
            }
          </div>
        </div>

        <div
          [move]="'fade-up'"
          [moveDelay]="80"
          class="mt-8 grid items-stretch gap-6 lg:grid-cols-[1fr_17rem]"
        >
          <div class="relative min-w-0">
            <div class="showcase-glow" aria-hidden="true"></div>
            <app-demo-showcase
              label="Volume control"
              filename="volume-demo.component.ts"
              height="24rem"
              [code]="source"
            >
              <app-volume-demo [skin]="currentSkin()" />
            </app-demo-showcase>
          </div>

          <ul class="grid gap-3 sm:grid-cols-3 lg:grid-cols-1" aria-label="What stays the same">
            @for (fact of facts; track fact.title) {
              <li class="feature-card p-5">
                <p class="text-xs font-medium text-fg-subtle">{{ fact.title }}</p>
                <p class="mt-2 font-mono text-sm text-fg">{{ fact.value }}</p>
                <p class="mt-2 text-xs leading-5 text-fg-muted">{{ fact.note }}</p>
              </li>
            }
          </ul>
        </div>
      </div>
    </section>
  `,
})
export class HomePlaygroundComponent {
  protected readonly source = volumeDemoSource;
  protected readonly skins: SkinOption[] = [
    { id: 'quartz', label: 'Quartz' },
    { id: 'wireframe', label: 'Wireframe' },
    { id: 'brutal', label: 'Brutalist' },
    { id: 'soft', label: 'Soft' },
  ];
  protected readonly skin = signal<VolumeSkin | readonly VolumeSkin[] | null>('quartz');
  protected readonly currentSkin = () => {
    const value = this.skin();
    return typeof value === 'string' ? value : 'quartz';
  };
  protected readonly facts = [
    {
      title: 'Keyboard',
      value: '← → Home End',
      note: 'Arrow keys step, Home and End jump. Space toggles mute.',
    },
    {
      title: 'Accessibility',
      value: 'role=slider · switch',
      note: 'aria-valuenow, valuetext and aria-disabled are kept in sync.',
    },
    {
      title: 'CSS shipped by Quartz',
      value: '0 bytes',
      note: 'Every visual is a class in the file under Code.',
    },
  ];
}
