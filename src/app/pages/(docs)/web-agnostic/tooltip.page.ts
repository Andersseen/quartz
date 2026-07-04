import { Component, ChangeDetectionStrategy } from '@angular/core';
import { WebAgnosticShellComponent } from './web-agnostic-shell.component';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';

@Component({
  selector: 'app-web-agnostic-tooltip-page',
  imports: [WebAgnosticShellComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-web-agnostic-shell
      badge="Overlay"
      title="Tooltip"
      description="Plain HTML tooltips that appear on hover or focus."
      [features]="[
        { title: 'Attribute Content', description: 'qz-tooltip' },
        { title: 'Placement', description: 'top, bottom, left, right' },
        { title: 'Delay', description: 'Configurable show/hide delay' },
        { title: 'Accessible', description: 'ARIA role tooltip' },
      ]"
    >
      <div class="flex flex-col gap-12">
        <section class="bg-[#0f0f13] border border-[#1e1e2a] rounded-2xl p-6">
          <h2 class="text-lg font-semibold text-gray-200 mb-2">Basic Tooltip</h2>
          <p class="text-sm text-gray-500 mb-6 leading-relaxed">
            Add the attribute and the tooltip wires itself.
          </p>

          <app-code-block [code]="tooltipCode">
            <div preview class="hd-demo flex items-center justify-center">
              <button
                qz-tooltip="Save your changes"
                qz-tooltip-placement="top"
                class="bg-[#1e1e2a] hover:bg-[#2a2a3a] text-white px-4 py-2 rounded-lg transition-colors"
              >
                Hover me
              </button>
            </div>
          </app-code-block>
        </section>
      </div>
    </app-web-agnostic-shell>
  `,
})
export default class WebAgnosticTooltipPage {
  readonly tooltipCode = `<button qz-tooltip="Save your changes" qz-tooltip-placement="top">
  Hover me
</button>`;
}
