import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import {
  SplitterContainerDirective,
  SplitterHandleDirective,
  SplitterPanelDirective,
} from 'quartz';
import { DecimalPipe } from '@angular/common';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';

@Component({
  selector: 'app-splitter-page',
  standalone: true,
  imports: [
    SplitterContainerDirective,
    SplitterHandleDirective,
    SplitterPanelDirective,
    DecimalPipe,
    DemoPageComponent,
    CodeBlockComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-demo-page
      badge="Layout"
      title="Splitter"
      description="Resizable panel system with keyboard navigation, touch support, and flexible constraints. Perfect for IDE-style layouts and dashboards."
      [features]="[
        { title: 'Horizontal & Vertical', description: 'Both orientations' },
        { title: 'Keyboard Nav', description: 'Arrow keys, Home, End' },
        { title: 'Touch Support', description: 'Mobile friendly' },
        { title: 'Constraints', description: 'Min/max size limits' },
      ]"
    >
      <div class="demos">
        <!-- Horizontal Splitter -->
        <section class="demo-section">
          <h2 class="demo-section__title">Horizontal Splitter</h2>
          <p class="demo-section__desc">
            Side-by-side panels with a draggable vertical handle. Use arrow keys or drag to resize.
          </p>

          <app-code-block [code]="horizontalCode">
            <div preview class="demo-preview">
              <div class="splitter-frame">
                <div
                  qzSplitterContainer
                  orientation="horizontal"
                  [minSize]="20"
                  [maxSize]="80"
                  [defaultPosition]="40"
                  (positionChange)="hPosition.set($event)"
                  class="splitter-wrapper"
                >
                  <div qzSplitterPanel="true" class="panel panel--left">
                    <div class="panel__content">
                      <div class="panel__icon">🗂️</div>
                      <h3 class="panel__title">Explorer</h3>
                      <p class="panel__text">File tree, project navigator, or sidebar content.</p>
                      <div class="panel__stat">
                        <span>Width</span>
                        <strong>{{ hPosition() | number: '1.0-0' }}%</strong>
                      </div>
                    </div>
                  </div>

                  <div qzSplitterHandle class="handle handle--vertical">
                    <div class="handle__grip"><span></span><span></span><span></span></div>
                  </div>

                  <div qzSplitterPanel="false" class="panel panel--right">
                    <div class="panel__content">
                      <div class="panel__icon">✏️</div>
                      <h3 class="panel__title">Editor</h3>
                      <p class="panel__text">Main content area that fills remaining space.</p>
                      <div class="panel__stat">
                        <span>Width</span>
                        <strong>{{ 100 - hPosition() | number: '1.0-0' }}%</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </app-code-block>
        </section>

        <!-- Vertical Splitter -->
        <section class="demo-section">
          <h2 class="demo-section__title">Vertical Splitter</h2>
          <p class="demo-section__desc">
            Stacked panels with a draggable horizontal handle. Ideal for terminal/output layouts.
          </p>

          <app-code-block [code]="verticalCode">
            <div preview class="demo-preview">
              <div class="splitter-frame">
                <div
                  qzSplitterContainer
                  orientation="vertical"
                  [minSize]="20"
                  [maxSize]="80"
                  [defaultPosition]="55"
                  (positionChange)="vPosition.set($event)"
                  class="splitter-wrapper"
                >
                  <div qzSplitterPanel="true" class="panel panel--top">
                    <div class="panel__content">
                      <div class="panel__icon">📄</div>
                      <h3 class="panel__title">Source</h3>
                      <p class="panel__text">Top panel — code editor or primary content.</p>
                      <div class="panel__stat">
                        <span>Height</span>
                        <strong>{{ vPosition() | number: '1.0-0' }}%</strong>
                      </div>
                    </div>
                  </div>

                  <div qzSplitterHandle class="handle handle--horizontal">
                    <div class="handle__grip"><span></span><span></span><span></span></div>
                  </div>

                  <div qzSplitterPanel="false" class="panel panel--bottom">
                    <div class="panel__content">
                      <div class="panel__icon">🖥️</div>
                      <h3 class="panel__title">Terminal</h3>
                      <p class="panel__text">Bottom panel — output or console.</p>
                      <div class="panel__stat">
                        <span>Height</span>
                        <strong>{{ 100 - vPosition() | number: '1.0-0' }}%</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </app-code-block>
        </section>
      </div>
    </app-demo-page>
  `,
  styles: [
    `
      .demos {
        display: flex;
        flex-direction: column;
        gap: 3rem;
      }

      .demo-section {
        background: #0f0f13;
        border: 1px solid #1e1e2a;
        border-radius: 16px;
        padding: 1.5rem;
      }

      .demo-section__title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #e5e7eb;
        margin: 0 0 0.5rem;
      }

      .demo-section__desc {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0 0 1.5rem;
        line-height: 1.5;
      }

      .demo-preview {
        padding: 1rem;
      }

      .splitter-frame {
        width: 100%;
        max-width: 600px;
        height: 300px;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #1e1e2a;
      }

      .splitter-wrapper {
        height: 100%;
        width: 100%;
      }

      .panel {
        height: 100%;
      }

      .panel__content {
        padding: 1.5rem;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .panel__icon {
        font-size: 1.5rem;
      }

      .panel__title {
        font-size: 1rem;
        font-weight: 600;
        color: #e5e7eb;
        margin: 0;
      }

      .panel__text {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
        flex: 1;
        line-height: 1.5;
      }

      .panel__stat {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        padding: 0.375rem 0.75rem;
        align-self: flex-start;
      }

      .panel__stat span {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #9ca3af;
      }

      .panel__stat strong {
        font-size: 0.875rem;
        color: #e5e7eb;
        font-variant-numeric: tabular-nums;
      }

      .panel--left {
        background: linear-gradient(135deg, #1e1430 0%, #0f0f13 100%);
      }

      .panel--right {
        background: linear-gradient(135deg, #0f0f13 0%, #1e1430 100%);
      }

      .panel--top {
        background: linear-gradient(180deg, #0f1f1a 0%, #0f0f13 100%);
      }

      .panel--bottom {
        background: linear-gradient(0deg, #1a0f1f 0%, #0f0f13 100%);
      }

      .handle {
        background: #1e1e2a;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s;
      }

      .handle:hover,
      .handle.qz-splitter-handle--dragging {
        background: #7c3aed;
      }

      .handle--vertical {
        width: 6px;
        min-width: 6px;
        cursor: col-resize;
      }

      .handle--horizontal {
        height: 6px;
        min-height: 6px;
        cursor: row-resize;
      }

      .handle__grip {
        display: flex;
        gap: 3px;
        pointer-events: none;
      }

      .handle--horizontal .handle__grip {
        flex-direction: row;
      }

      .handle__grip span {
        display: block;
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: #6b7280;
      }

      .handle:hover .handle__grip span,
      .handle.qz-splitter-handle--dragging .handle__grip span {
        background: #fff;
      }
    `,
  ],
})
export class SplitterPage {
  hPosition = signal(40);
  vPosition = signal(55);

  horizontalCode = `<div qzSplitterContainer
  orientation="horizontal"
  [minSize]="20"
  [maxSize]="80"
  [defaultPosition]="40"
  (positionChange)="onPositionChange($event)">

  <div qzSplitterPanel="true">Panel A</div>
  <div qzSplitterHandle></div>
  <div qzSplitterPanel="false">Panel B</div>

</div>`;

  verticalCode = `<div qzSplitterContainer
  orientation="vertical"
  [minSize]="20"
  [maxSize]="80"
  [defaultPosition]="55">

  <div qzSplitterPanel="true">Top Panel</div>
  <div qzSplitterHandle></div>
  <div qzSplitterPanel="false">Bottom Panel</div>

</div>`;
}
