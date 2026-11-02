import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  TabDirective,
  TabListDirective,
  TabPanelDirective,
  TabsDirective,
} from '@quartz-headless/primitives';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';
import { ClipboardCopy, type CopyStatus } from '../../../../site/clipboard-copy';
import {
  GITHUB_URL,
  LATEST_NPM_VERSION,
  NPM_CORE_URL,
  NPM_PRIMITIVES_URL,
} from '../../../../site/site-config';

type Manager = 'npm' | 'pnpm';

interface Command {
  id: string;
  label: string;
  note: string;
  text: Record<Manager, string>;
}

const COMMANDS: Command[] = [
  {
    id: 'core',
    label: 'Core only',
    note: 'Overlay, focus, dismiss, collection and the other infrastructure.',
    text: {
      npm: 'npm install @quartz-headless/core',
      pnpm: 'pnpm add @quartz-headless/core',
    },
  },
  {
    id: 'both',
    label: 'Core + Primitives',
    note: 'The accessible patterns. Primitives needs Core installed beside it.',
    text: {
      npm: 'npm install @quartz-headless/core @quartz-headless/primitives',
      pnpm: 'pnpm add @quartz-headless/core @quartz-headless/primitives',
    },
  },
];

@Component({
  selector: 'app-home-install',
  imports: [
    RouterLink,
    TabsDirective,
    TabListDirective,
    TabDirective,
    TabPanelDirective,
    ...MOVEMENT_DIRECTIVES,
  ],
  providers: [ClipboardCopy],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="install" aria-labelledby="install-title" class="section-shell">
      <div class="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
        <div [move]="'fade-up'">
          <p class="section-eyebrow" data-tone="brand">
            <span class="section-eyebrow-dot" aria-hidden="true"></span>Install
          </p>
          <h2
            id="install-title"
            class="mt-4 text-[clamp(2rem,5vw,3.25rem)] leading-[1.05] font-bold tracking-[-0.035em] text-fg"
          >
            Install what you need.
          </h2>
          <p class="mt-5 max-w-lg text-base leading-7 text-fg-muted sm:text-lg sm:leading-8">
            Latest on npm: <span class="font-mono text-fg">{{ npmVersion }}</span
            >. Requires Angular 21.2+ or 22 with zoneless change detection.
          </p>

          <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a routerLink="/docs/getting-started/installation" class="site-focus btn-primary"
              >Read the installation guide</a
            >
            <a routerLink="/docs" class="site-focus btn-secondary">Browse documentation</a>
            <a [href]="github" rel="noopener" class="site-focus btn-secondary"
              >View source on GitHub</a
            >
          </div>
          <p class="mt-6 text-sm leading-6 text-fg-subtle">
            On npm:
            <a [href]="npmCore" rel="noopener" class="site-focus underline underline-offset-4"
              >&#64;quartz-headless/core</a
            >,
            <a [href]="npmPrimitives" rel="noopener" class="site-focus underline underline-offset-4"
              >&#64;quartz-headless/primitives</a
            >. Prefer owning the code?
            <a routerLink="/docs/guides/cli" class="site-focus underline underline-offset-4"
              >Copy the source with the CLI</a
            >.
          </p>
        </div>

        <div [move]="'fade-up'" [moveDelay]="100" class="relative min-w-0">
          <div class="showcase-glow" aria-hidden="true"></div>
          <div qzTabs [(value)]="manager" class="showcase-frame">
            <div
              class="flex items-center justify-between gap-3 border-b border-line bg-surface-1/80 py-2 pr-2 pl-4"
            >
              <span class="flex gap-1.5" aria-hidden="true">
                <span class="size-2.5 rounded-full bg-white/10"></span>
                <span class="size-2.5 rounded-full bg-white/10"></span>
                <span class="size-2.5 rounded-full bg-white/10"></span>
              </span>
              <div
                qzTabList
                aria-label="Package manager"
                class="flex rounded-lg border border-line bg-surface-0/60 p-0.5"
              >
                @for (name of managers; track name) {
                  <button [qzTab]="name" class="showcase-tab site-focus font-mono">
                    {{ name }}
                  </button>
                }
              </div>
            </div>

            @for (name of managers; track name) {
              <div [qzTabPanel]="name" class="showcase-panel divide-y divide-line">
                @for (command of commands; track command.id) {
                  <div class="p-5">
                    <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p class="text-sm font-semibold text-fg">{{ command.label }}</p>
                      <p class="text-xs text-fg-subtle">{{ command.note }}</p>
                    </div>
                    <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                      <pre
                        class="code-scroll site-focus m-0 min-w-0 flex-1 rounded-lg border border-line bg-surface-0 px-3.5 py-2.5 font-mono text-[0.8125rem] leading-6 text-fg"
                        tabindex="0"
                        [attr.aria-label]="command.label + ' ' + name + ' command'"
                      ><code><span class="select-none text-accent" aria-hidden="true">$ </span>{{ command.text[name] }}</code></pre>
                      <button
                        type="button"
                        (click)="copy(command.text[name])"
                        [attr.data-copy-state]="stateFor(command.text[name])"
                        [attr.aria-label]="'Copy ' + command.label + ' ' + name + ' command'"
                        class="site-focus min-h-11 min-w-24 shrink-0 rounded-lg border border-line-strong px-4 text-sm font-semibold text-fg transition-colors hover:border-brand/60 hover:bg-white/5 data-[copy-state=copied]:border-brand data-[copy-state=copied]:text-brand"
                      >
                        {{ labelFor(command.text[name]) }}
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
          <p class="mt-3 min-h-6 text-sm text-fg-muted" role="status" data-testid="copy-status">
            {{ statusMessage() }}
          </p>
        </div>
      </div>
    </section>
  `,
})
export class HomeInstallComponent {
  private readonly clipboard = inject(ClipboardCopy);

  protected readonly managers: Manager[] = ['npm', 'pnpm'];
  protected readonly commands = COMMANDS;
  protected readonly manager = signal<string | null>('npm');
  protected readonly npmVersion = LATEST_NPM_VERSION;
  protected readonly github = GITHUB_URL;
  protected readonly npmCore = NPM_CORE_URL;
  protected readonly npmPrimitives = NPM_PRIMITIVES_URL;

  private readonly lastText = signal<string | null>(null);

  protected copy(text: string): void {
    this.lastText.set(text);
    void this.clipboard.copy(text);
  }

  protected stateFor(text: string): CopyStatus | 'idle' {
    return this.lastText() === text ? this.clipboard.status() : 'idle';
  }

  protected labelFor(text: string): string {
    switch (this.stateFor(text)) {
      case 'copied':
        return 'Copied';
      case 'failed':
        return 'Copy failed';
      case 'unsupported':
        return 'Unavailable';
      default:
        return 'Copy';
    }
  }

  protected statusMessage(): string {
    switch (this.clipboard.status()) {
      case 'copied':
        return 'Command copied to the clipboard.';
      case 'failed':
        return 'The browser blocked copying. Select the command and copy it manually.';
      case 'unsupported':
        return 'Copying is not available in this browser. Select the command and copy it manually.';
      default:
        return '';
    }
  }
}
