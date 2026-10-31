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
    <section
      id="install"
      aria-labelledby="install-title"
      class="border-t border-line px-4 py-20 sm:px-6 md:px-10 md:py-24"
    >
      <div
        [move]="'fade-up'"
        class="mx-auto max-w-4xl rounded-3xl border border-brand/20 bg-[radial-gradient(circle_at_top,rgb(16_185_129/0.12),transparent_45%)] bg-surface-1 px-5 py-12 sm:px-10 sm:py-14"
      >
        <div class="text-center">
          <h2 id="install-title" class="text-3xl font-extrabold tracking-tight text-fg md:text-4xl">
            Install what you need.
          </h2>
          <p class="mx-auto mt-4 max-w-xl text-base leading-7 text-fg-muted">
            Latest on npm: <span class="font-mono text-fg">{{ npmVersion }}</span
            >. Requires Angular 21.2+ or 22 with zoneless change detection.
          </p>
        </div>

        <div qzTabs [(value)]="manager" class="mt-9">
          <div class="flex justify-center">
            <div
              qzTabList
              aria-label="Package manager"
              class="inline-flex rounded-lg border border-line p-1"
            >
              @for (name of managers; track name) {
                <button
                  [qzTab]="name"
                  class="site-focus min-h-10 rounded-md px-5 font-mono text-sm text-fg-muted hover:text-fg data-[qz-selected]:bg-surface-2 data-[qz-selected]:text-fg"
                >
                  {{ name }}
                </button>
              }
            </div>
          </div>

          @for (name of managers; track name) {
            <div [qzTabPanel]="name" class="mt-6 space-y-4">
              @for (command of commands; track command.id) {
                <div class="rounded-xl border border-line bg-surface-0 p-4">
                  <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p class="text-sm font-semibold text-fg">{{ command.label }}</p>
                    <p class="text-xs text-fg-subtle">{{ command.note }}</p>
                  </div>
                  <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <pre
                      class="code-scroll site-focus min-w-0 flex-1 rounded-lg bg-surface-2 px-3.5 py-3 font-mono text-[0.8125rem] leading-6 text-fg"
                      tabindex="0"
                      [attr.aria-label]="command.label + ' ' + name + ' command'"
                    ><code><span class="select-none text-accent" aria-hidden="true">$ </span>{{ command.text[name] }}</code></pre>
                    <button
                      type="button"
                      (click)="copy(command.text[name])"
                      [attr.data-copy-state]="stateFor(command.text[name])"
                      [attr.aria-label]="'Copy ' + command.label + ' ' + name + ' command'"
                      class="site-focus min-h-11 shrink-0 rounded-lg border border-line-strong px-4 text-sm font-semibold text-fg transition-colors hover:border-brand/60 data-[copy-state=copied]:border-brand data-[copy-state=copied]:text-brand"
                    >
                      {{ labelFor(command.text[name]) }}
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <p
          class="mt-4 min-h-6 text-center text-sm text-fg-muted"
          role="status"
          data-testid="copy-status"
        >
          {{ statusMessage() }}
        </p>

        <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            routerLink="/docs/getting-started/installation"
            class="site-focus inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-surface-0 hover:bg-brand-deep"
            >Read the installation guide</a
          >
          <a
            routerLink="/docs"
            class="site-focus inline-flex min-h-11 items-center justify-center rounded-lg border border-line-strong px-5 text-sm font-semibold text-fg hover:border-brand/60"
            >Browse documentation</a
          >
          <a
            [href]="github"
            rel="noopener"
            class="site-focus inline-flex min-h-11 items-center justify-center rounded-lg border border-line-strong px-5 text-sm font-semibold text-fg hover:border-brand/60"
            >View source on GitHub</a
          >
        </div>
        <p class="mt-6 text-center text-xs text-fg-subtle">
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
