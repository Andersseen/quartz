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
 */
@Component({
  selector: 'app-demo-showcase',
  imports: [TabsDirective, TabListDirective, TabDirective, TabPanelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-hidden rounded-2xl border border-line bg-surface-1">
      <div qzTabs [(value)]="view">
        <div class="flex items-center justify-between gap-3 border-b border-line px-2 sm:px-3">
          <div qzTabList [attr.aria-label]="label() + ' view'" class="flex">
            <button
              qzTab="preview"
              class="site-focus -mb-px min-h-11 border-b-2 border-transparent px-3 text-sm font-medium text-fg-muted hover:text-fg data-[qz-selected]:border-brand data-[qz-selected]:text-fg"
            >
              Preview
            </button>
            <button
              qzTab="code"
              class="site-focus -mb-px min-h-11 border-b-2 border-transparent px-3 text-sm font-medium text-fg-muted hover:text-fg data-[qz-selected]:border-brand data-[qz-selected]:text-fg"
            >
              Code
            </button>
          </div>
          <span class="truncate font-mono text-xs text-fg-subtle">{{ filename() }}</span>
        </div>

        <div qzTabPanel="preview" class="p-5 sm:p-7">
          <ng-content />
        </div>
        <div qzTabPanel="code">
          <pre
            class="code-scroll code-tokens site-focus m-0 max-h-[28rem] overflow-y-auto p-4 font-mono text-xs leading-6 text-fg sm:p-5 sm:text-[0.8125rem]"
            tabindex="0"
            [attr.aria-label]="label() + ' source code'"
          ><code [innerHTML]="html()"></code></pre>
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

  protected readonly view = signal<string | null>('preview');
  protected readonly html = computed(() => highlightTypeScript(this.code().trim()));
}
