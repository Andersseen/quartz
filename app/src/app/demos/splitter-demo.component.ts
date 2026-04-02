import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  SplitterContainerDirective,
  SplitterHandleDirective,
  SplitterPanelDirective,
} from '../../../../packages/quartz/src/lib/splitter';

@Component({
  selector: 'app-splitter-demo',
  standalone: true,
  imports: [SplitterContainerDirective, SplitterHandleDirective, SplitterPanelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="demo-container">
      <h1 class="demo-title">Splitter Demo</h1>

      <section class="demo-section">
        <h2 class="demo-subtitle">Horizontal Splitter</h2>
        <div
          qzSplitterContainer
          orientation="horizontal"
          [minSize]="20"
          [maxSize]="80"
          class="splitter-wrapper horizontal"
        >
          <div qzSplitterPanel="true" class="panel panel-primary">
            <h3 class="panel-title">Left Panel</h3>
            <p class="panel-text">This is the primary (left) panel. Drag the handle to resize.</p>
            <p class="panel-hint">Keyboard: Arrow keys to move, Home/End for min/max.</p>
          </div>

          <div qzSplitterHandle class="handle handle-horizontal">
            <span class="handle-icon">⋮</span>
          </div>

          <div qzSplitterPanel="false" class="panel panel-secondary">
            <h3 class="panel-title">Right Panel</h3>
            <p class="panel-text">
              This is the secondary (right) panel. It automatically adjusts its size.
            </p>
          </div>
        </div>
      </section>

      <section class="demo-section">
        <h2 class="demo-subtitle">Vertical Splitter</h2>
        <div
          qzSplitterContainer
          orientation="vertical"
          [minSize]="20"
          [maxSize]="80"
          class="splitter-wrapper vertical"
        >
          <div qzSplitterPanel="true" class="panel panel-primary-green">
            <h3 class="panel-title">Top Panel</h3>
            <p class="panel-text">This is the primary (top) panel.</p>
          </div>

          <div qzSplitterHandle class="handle handle-vertical">
            <span class="handle-icon">⋯</span>
          </div>

          <div qzSplitterPanel="false" class="panel panel-secondary-orange">
            <h3 class="panel-title">Bottom Panel</h3>
            <p class="panel-text">This is the secondary (bottom) panel.</p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .demo-container {
        padding: 2rem;
        max-width: 72rem;
        margin: 0 auto;
      }

      .demo-title {
        font-size: 1.875rem;
        font-weight: 700;
        margin-bottom: 2rem;
        color: #111827;
      }

      .demo-section {
        margin-bottom: 3rem;
      }

      .demo-subtitle {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: #1f2937;
      }

      .splitter-wrapper {
        border: 2px solid #d1d5db;
        border-radius: 0.5rem;
      }

      .splitter-wrapper.horizontal {
        height: 20rem;
      }

      .splitter-wrapper.vertical {
        height: 24rem;
      }

      .panel {
        padding: 1.5rem;
        overflow: auto;
      }

      .panel-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }

      .panel-text {
        color: #374151;
        line-height: 1.6;
        margin-bottom: 0.75rem;
      }

      .panel-hint {
        color: #4b5563;
        margin-top: 0.5rem;
        font-size: 0.875rem;
      }

      .panel-primary {
        background-color: #eff6ff;
      }

      .panel-secondary {
        background-color: #f5f3ff;
      }

      .panel-primary-green {
        background-color: #f0fdf4;
      }

      .panel-secondary-orange {
        background-color: #fff7ed;
      }

      .handle {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #9ca3af;
        transition: background-color 0.2s;
      }

      .handle:hover {
        background-color: #6b7280;
      }

      .handle-horizontal {
        width: 0.5rem;
      }

      .handle-vertical {
        height: 0.5rem;
      }

      .handle-icon {
        color: white;
        font-size: 0.75rem;
        pointer-events: none;
        user-select: none;
      }
    `,
  ],
})
export class SplitterDemoComponent {}
