import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { WebAgnosticShellComponent } from './web-agnostic-shell.component';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import { WebAgnosticStateService } from './web-agnostic-state.service';

@Component({
  selector: 'app-web-agnostic-splitter-page',
  imports: [WebAgnosticShellComponent, CodeBlockComponent, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-web-agnostic-shell
      badge="Layout"
      title="Splitter"
      description="Resizable panels driven by HTML attributes. Drag the handle or use arrow keys to resize."
      [features]="[
        { title: 'Horizontal & Vertical', description: 'Both orientations' },
        { title: 'Keyboard Nav', description: 'Arrow keys, Home, End' },
        { title: 'Touch Support', description: 'Mobile friendly' },
        { title: 'Constraints', description: 'Min/max size limits' },
      ]"
    >
      <div class="flex flex-col gap-12">
        <section class="bg-[#0f0f13] border border-[#1e1e2a] rounded-2xl p-6">
          <h2 class="text-lg font-semibold text-gray-200 mb-2">Horizontal Splitter</h2>
          <p class="text-sm text-gray-500 mb-6 leading-relaxed">
            Side-by-side panels with a draggable handle.
          </p>

          <app-code-block [code]="horizontalCode">
            <div preview class="hd-demo">
              <div
                qz-splitter="horizontal"
                qz-splitter-min="20"
                qz-splitter-max="80"
                qz-splitter-default-position="40"
                class="hd splitter-container"
                style="height: 240px"
              >
                <div qz-splitter-panel="primary" class="hd hd--panel splitter-panel">
                  <div class="hd__body">
                    <div class="hd__label">Left Panel</div>
                    <div class="hd__meta">width: {{ state.hPosition() | number: '1.0-0' }}%</div>
                  </div>
                </div>

                <div qz-splitter-handle class="hd hd--handle splitter-handle--h"></div>

                <div qz-splitter-panel="secondary" class="hd hd--panel splitter-panel">
                  <div class="hd__body">
                    <div class="hd__label">Right Panel</div>
                    <div class="hd__meta">
                      width: {{ 100 - state.hPosition() | number: '1.0-0' }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </app-code-block>
        </section>

        <section class="bg-[#0f0f13] border border-[#1e1e2a] rounded-2xl p-6">
          <h2 class="text-lg font-semibold text-gray-200 mb-2">Vertical Splitter</h2>
          <p class="text-sm text-gray-500 mb-6 leading-relaxed">
            Stacked panels with a horizontal handle.
          </p>

          <app-code-block [code]="verticalCode">
            <div preview class="hd-demo">
              <div
                qz-splitter="vertical"
                qz-splitter-min="20"
                qz-splitter-max="80"
                qz-splitter-default-position="55"
                class="hd splitter-container"
                style="height: 320px"
              >
                <div qz-splitter-panel="primary" class="hd hd--panel splitter-panel">
                  <div class="hd__body">
                    <div class="hd__label">Top Panel</div>
                    <div class="hd__meta">height: {{ state.vPosition() | number: '1.0-0' }}%</div>
                  </div>
                </div>

                <div qz-splitter-handle class="hd hd--handle hd--handle-v splitter-handle--v"></div>

                <div qz-splitter-panel="secondary" class="hd hd--panel splitter-panel">
                  <div class="hd__body">
                    <div class="hd__label">Bottom Panel</div>
                    <div class="hd__meta">
                      height: {{ 100 - state.vPosition() | number: '1.0-0' }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </app-code-block>
        </section>
      </div>
    </app-web-agnostic-shell>
  `,
})
export default class WebAgnosticSplitterPage {
  protected readonly state = inject(WebAgnosticStateService);

  readonly horizontalCode = `<div qz-splitter="horizontal" qz-splitter-min="20" qz-splitter-max="80" qz-splitter-default-position="40">
  <div qz-splitter-panel="primary">Left</div>
  <div qz-splitter-handle></div>
  <div qz-splitter-panel="secondary">Right</div>
</div>`;

  readonly verticalCode = `<div qz-splitter="vertical" qz-splitter-min="20" qz-splitter-max="80" qz-splitter-default-position="55">
  <div qz-splitter-panel="primary">Top</div>
  <div qz-splitter-handle></div>
  <div qz-splitter-panel="secondary">Bottom</div>
</div>`;
}
