import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  SplitterContainerDirective,
  SplitterDirective,
  SplitterPanelDirective,
  SplitterHandleDirective,
} from '../../../../packages/quartz/src/lib/splitter';

@Component({
  selector: 'app-splitter-demo',
  standalone: true,
  imports: [
    SplitterContainerDirective,
    SplitterDirective,
    SplitterPanelDirective,
    SplitterHandleDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="demo-container">
      <h1>Splitter Demo</h1>

      <section>
        <h2>Horizontal Splitter</h2>
        <div
          qzSplitterContainer
          orientation="horizontal"
          style="height: 300px; border: 2px solid #ccc;"
        >
          <div
            qzSplitterPanel="true"
            style="background: #e3f2fd; padding: 20px;"
          >
            <h3>Left Panel</h3>
            <p>
              This is the primary (left) panel. Drag the handle to resize.
            </p>
            <p>
              You can also use keyboard: Arrow keys to move, Home/End for
              min/max.
            </p>
          </div>

          <div
            qzSplitter
            qzSplitterHandle
            style="
              width: 8px;
              background: #2196f3;
              cursor: col-resize;
              display: flex;
              align-items: center;
              justify-content: center;
            "
          >
            <span style="color: white; font-size: 12px;">⋮</span>
          </div>

          <div
            qzSplitterPanel="false"
            style="background: #f3e5f5; padding: 20px;"
          >
            <h3>Right Panel</h3>
            <p>
              This is the secondary (right) panel. It automatically adjusts its
              size.
            </p>
          </div>
        </div>
      </section>

      <section style="margin-top: 40px;">
        <h2>Vertical Splitter</h2>
        <div
          qzSplitterContainer
          orientation="vertical"
          style="height: 400px; border: 2px solid #ccc;"
        >
          <div
            qzSplitterPanel="true"
            style="background: #e8f5e9; padding: 20px;"
          >
            <h3>Top Panel</h3>
            <p>This is the primary (top) panel.</p>
          </div>

          <div
            qzSplitter
            qzSplitterHandle
            style="
              height: 8px;
              background: #4caf50;
              cursor: row-resize;
              display: flex;
              align-items: center;
              justify-content: center;
            "
          >
            <span style="color: white; font-size: 12px;">⋯</span>
          </div>

          <div
            qzSplitterPanel="false"
            style="background: #fff3e0; padding: 20px;"
          >
            <h3>Bottom Panel</h3>
            <p>This is the secondary (bottom) panel.</p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
    .demo-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    section {
      margin-bottom: 40px;
    }

    h1,
    h2,
    h3 {
      margin-bottom: 16px;
    }

    p {
      line-height: 1.6;
      margin-bottom: 12px;
    }
  `,
  ],
})
export class SplitterDemoComponent {}
