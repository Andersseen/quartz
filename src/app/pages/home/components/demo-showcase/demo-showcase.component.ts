import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import {
  TabDirective,
  TabListDirective,
  TabPanelDirective,
  TabsDirective,
} from '@quartz-headless/primitives';
import { highlightTypeScript } from '../../../../site/highlight';

/**
 * Preview/Code frame for the landing demos. The preview is projected content (a real Quartz
 * example); the code panel renders the *source file of that same component*, passed in via
 * `?raw`, so the two cannot drift apart. The switch itself is the Quartz Tabs primitive.
 *
 * Both panels share one fixed-height stage, so switching views never moves the page: the preview
 * is centred on the stage and the code scrolls inside it.
 */
@Component({
  selector: 'app-demo-showcase',
  imports: [TabsDirective, TabListDirective, TabDirective, TabPanelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="showcase-frame">
      <div qzTabs [(value)]="view">
        <div
          class="flex items-center justify-between gap-3 border-b border-line bg-surface-1/80 py-2 pr-4 pl-3"
        >
          <div class="flex min-w-0 items-center gap-3">
            <span class="hidden gap-1.5 sm:flex" aria-hidden="true">
              <span class="size-2.5 rounded-full bg-white/10"></span>
              <span class="size-2.5 rounded-full bg-white/10"></span>
              <span class="size-2.5 rounded-full bg-white/10"></span>
            </span>
            <div
              qzTabList
              [attr.aria-label]="label() + ' view'"
              class="flex rounded-lg border border-line bg-surface-0/60 p-0.5"
            >
              <button qzTab="preview" class="showcase-tab site-focus">Preview</button>
              <button qzTab="code" class="showcase-tab site-focus">Code</button>
            </div>
          </div>
          <span class="truncate font-mono text-xs text-fg-subtle">{{ filename() }}</span>
        </div>

        <div class="showcase-stage" [style.height]="height()">
          <div qzTabPanel="preview" class="showcase-panel showcase-preview">
            <div class="w-full max-w-md">
              <ng-content />
            </div>
          </div>
          <div qzTabPanel="code" class="showcase-panel">
            <pre
              class="code-scroll code-tokens site-focus m-0 h-full overflow-y-auto p-4 font-mono text-xs leading-6 text-fg sm:p-5 sm:text-[0.8125rem]"
              tabindex="0"
              [attr.aria-label]="label() + ' source code'"
            ><code [innerHTML]="html()"></code></pre>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DemoShowcaseComponent {
  readonly label = input.required<string>();
  readonly filename = input.required<string>();
  /** Source text displayed in the Code view. */
  readonly code = input.required<string>();
  /** Height of the shared stage; both views use it, so switching never shifts the layout. */
  readonly height = input('22rem');

  protected readonly view = signal<string | null>('preview');
  protected readonly html = computed(() => highlightTypeScript(this.code().trim()));
}
