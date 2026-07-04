import { Component, ChangeDetectionStrategy } from '@angular/core';
import { WebAgnosticShellComponent } from './web-agnostic-shell.component';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';

@Component({
  selector: 'app-web-agnostic-dialog-page',
  imports: [WebAgnosticShellComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-web-agnostic-shell
      badge="Overlay"
      title="Dialog"
      description="Modal and drawer dialogs triggered by HTML attributes. No framework required."
      [features]="[
        { title: 'Attribute Trigger', description: 'qz-dialog-trigger' },
        { title: 'Positions', description: 'center, left, right, top, bottom' },
        { title: 'Backdrop', description: 'Optional and clickable' },
        { title: 'Escape Key', description: 'Closes by default' },
      ]"
    >
      <div class="flex flex-col gap-12">
        <section class="bg-[#0f0f13] border border-[#1e1e2a] rounded-2xl p-6">
          <h2 class="text-lg font-semibold text-gray-200 mb-2">Modal</h2>
          <p class="text-sm text-gray-500 mb-6 leading-relaxed">
            Toggle a modal dialog by referencing its id.
          </p>

          <app-code-block [code]="dialogCode">
            <div preview class="hd-demo">
              <button
                qz-dialog-trigger="demo-dialog"
                class="bg-[#1e1e2a] hover:bg-[#2a2a3a] text-white px-4 py-2 rounded-lg transition-colors"
              >
                Open Dialog
              </button>

              <div id="demo-dialog" qz-dialog-position="center" class="hidden">
                <div class="bg-[#0f0f13] border border-[#1e1e2a] rounded-xl p-6 max-w-sm">
                  <h3 class="text-lg font-semibold text-white mb-2">Hello from the DOM</h3>
                  <p class="text-sm text-gray-400">
                    This dialog was opened with a single HTML attribute.
                  </p>
                </div>
              </div>
            </div>
          </app-code-block>
        </section>
      </div>
    </app-web-agnostic-shell>
  `,
})
export default class WebAgnosticDialogPage {
  readonly dialogCode = `<button qz-dialog-trigger="my-dialog">Open</button>

<div id="my-dialog" qz-dialog-position="center">
  <h2>Hello</h2>
</div>`;
}
