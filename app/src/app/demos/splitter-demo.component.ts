import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import {
  SplitterContainerDirective,
  SplitterHandleDirective,
  SplitterPanelDirective,
} from '../../../../packages/quartz/src/lib/splitter';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-splitter-demo',
  imports: [
    SplitterContainerDirective,
    SplitterHandleDirective,
    SplitterPanelDirective,
    DecimalPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="demo-page">
      <header class="demo-header">
        <div class="demo-header__inner">
          <div class="demo-header__badge">Quartz UI</div>
          <h1 class="demo-header__title">Splitter</h1>
          <p class="demo-header__desc">
            Headless resizable panel primitive — drag, touch & keyboard accessible.
          </p>
        </div>
      </header>

      <main class="demo-main">
        <!-- Horizontal -->
        <section class="demo-section">
          <div class="demo-section__meta">
            <span class="demo-section__tag">horizontal</span>
            <h2 class="demo-section__title">Side-by-side panels</h2>
            <p class="demo-section__hint">
              Drag the handle · Arrow keys · <kbd>Home</kbd> / <kbd>End</kbd>
            </p>
          </div>

          <div class="splitter-frame">
            <div
              qzSplitterContainer
              orientation="horizontal"
              [minSize]="15"
              [maxSize]="85"
              [defaultPosition]="40"
              (positionChange)="hPosition.set($event)"
              class="splitter-wrapper"
            >
              <div qzSplitterPanel="true" class="panel panel--blue">
                <div class="panel__inner">
                  <div class="panel__icon">🗂️</div>
                  <h3 class="panel__title">Explorer</h3>
                  <p class="panel__text">
                    File tree, project navigator, or sidebar content lives here.
                  </p>
                  <div class="panel__stat">
                    <span class="panel__stat-label">Width</span>
                    <span class="panel__stat-value">{{ hPosition() | number: '1.0-0' }}%</span>
                  </div>
                </div>
              </div>

              <div qzSplitterHandle class="handle handle--vertical-bar">
                <div class="handle__dots">
                  <span></span><span></span><span></span><span></span><span></span><span></span>
                </div>
              </div>

              <div qzSplitterPanel="false" class="panel panel--purple">
                <div class="panel__inner">
                  <div class="panel__icon">✏️</div>
                  <h3 class="panel__title">Editor</h3>
                  <p class="panel__text">
                    Main content area. Automatically fills the remaining space.
                  </p>
                  <div class="panel__stat">
                    <span class="panel__stat-label">Width</span>
                    <span class="panel__stat-value"
                      >{{ 100 - hPosition() | number: '1.0-0' }}%</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Vertical -->
        <section class="demo-section">
          <div class="demo-section__meta">
            <span class="demo-section__tag">vertical</span>
            <h2 class="demo-section__title">Stacked panels</h2>
            <p class="demo-section__hint">
              Drag the handle · Arrow keys · <kbd>Home</kbd> / <kbd>End</kbd>
            </p>
          </div>

          <div class="splitter-frame">
            <div
              qzSplitterContainer
              orientation="vertical"
              [minSize]="15"
              [maxSize]="85"
              [defaultPosition]="55"
              (positionChange)="vPosition.set($event)"
              class="splitter-wrapper"
            >
              <div qzSplitterPanel="true" class="panel panel--green">
                <div class="panel__inner">
                  <div class="panel__icon">📄</div>
                  <h3 class="panel__title">Source</h3>
                  <p class="panel__text">
                    Top panel — code editor, document viewer, or primary content.
                  </p>
                  <div class="panel__stat">
                    <span class="panel__stat-label">Height</span>
                    <span class="panel__stat-value">{{ vPosition() | number: '1.0-0' }}%</span>
                  </div>
                </div>
              </div>

              <div qzSplitterHandle class="handle handle--horizontal-bar">
                <div class="handle__dots">
                  <span></span><span></span><span></span><span></span><span></span><span></span>
                </div>
              </div>

              <div qzSplitterPanel="false" class="panel panel--amber">
                <div class="panel__inner">
                  <div class="panel__icon">🖥️</div>
                  <h3 class="panel__title">Terminal</h3>
                  <p class="panel__text">Bottom panel — output, console, or secondary content.</p>
                  <div class="panel__stat">
                    <span class="panel__stat-label">Height</span>
                    <span class="panel__stat-value"
                      >{{ 100 - vPosition() | number: '1.0-0' }}%</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [
    `
      .demo-page {
        min-height: 100vh;
        background: #f4f4f6;
        font-family: 'Inter', system-ui, sans-serif;
      }

      .demo-header {
        background: #0f0f13;
        padding: 2.5rem 2rem 2rem;
        border-bottom: 1px solid #1e1e2a;
      }

      .demo-header__inner {
        max-width: 900px;
        margin: 0 auto;
      }

      .demo-header__badge {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #a78bfa;
        background: #1e1430;
        border: 1px solid #4c1d95;
        border-radius: 4px;
        padding: 0.2rem 0.55rem;
        margin-bottom: 0.75rem;
      }

      .demo-header__title {
        font-size: 2rem;
        font-weight: 800;
        color: #ffffff;
        margin: 0 0 0.5rem;
        letter-spacing: -0.03em;
      }

      .demo-header__desc {
        color: #6b7280;
        font-size: 0.9rem;
        margin: 0;
      }

      .demo-main {
        max-width: 900px;
        margin: 0 auto;
        padding: 2.5rem 2rem;
        display: flex;
        flex-direction: column;
        gap: 3rem;
      }

      .demo-section__meta {
        margin-bottom: 0.875rem;
      }

      .demo-section__tag {
        display: inline-block;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #7c3aed;
        background: #ede9fe;
        border-radius: 4px;
        padding: 0.15rem 0.5rem;
        margin-bottom: 0.4rem;
      }

      .demo-section__title {
        font-size: 1.15rem;
        font-weight: 700;
        color: #111827;
        margin: 0 0 0.2rem;
      }

      .demo-section__hint {
        font-size: 0.8rem;
        color: #9ca3af;
        margin: 0;
      }

      kbd {
        display: inline-block;
        font-size: 0.7rem;
        font-family: inherit;
        background: #e5e7eb;
        border: 1px solid #d1d5db;
        border-radius: 3px;
        padding: 0.05rem 0.35rem;
        color: #374151;
      }

      .splitter-frame {
        border-radius: 12px;
        overflow: hidden;
        border: 1.5px solid #e5e7eb;
        box-shadow:
          0 2px 8px rgba(0, 0, 0, 0.06),
          0 0 0 0 transparent;

        height: 280px;
      }

      .splitter-wrapper {
        height: 100%;
        width: 100%;
      }

      .panel {
        height: 100%;
        box-sizing: border-box;
      }

      .panel__inner {
        padding: 1.5rem;
        height: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }

      .panel__icon {
        font-size: 1.4rem;
        margin-bottom: 0.2rem;
      }

      .panel__title {
        font-size: 0.95rem;
        font-weight: 700;
        color: #111827;
        margin: 0;
      }

      .panel__text {
        font-size: 0.8rem;
        color: #6b7280;
        line-height: 1.5;
        margin: 0;
        flex: 1;
      }

      .panel__stat {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 6px;
        padding: 0.25rem 0.6rem;
        margin-top: auto;
        align-self: flex-start;
      }

      .panel__stat-label {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #9ca3af;
      }

      .panel__stat-value {
        font-size: 0.85rem;
        font-weight: 700;
        color: #374151;
        font-variant-numeric: tabular-nums;
      }

      .panel--blue {
        background: #eff6ff;
      }
      .panel--purple {
        background: #f5f3ff;
      }
      .panel--green {
        background: #f0fdf4;
      }
      .panel--amber {
        background: #fffbeb;
      }

      .handle--vertical-bar {
        width: 6px;
        min-width: 6px;
        background: #e2e4e9;
        display: flex;
        align-items: center;
        justify-content: center;
        transition:
          background 0.15s,
          width 0.15s;
        position: relative;
      }

      .handle--vertical-bar:hover,
      .handle--vertical-bar.qz-splitter-handle--dragging {
        background: #7c3aed;
        width: 6px;
      }

      .handle--horizontal-bar {
        height: 6px;
        min-height: 6px;
        background: #e2e4e9;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s;
      }

      .handle--horizontal-bar:hover,
      .handle--horizontal-bar.qz-splitter-handle--dragging {
        background: #7c3aed;
      }

      .handle__dots {
        display: flex;
        flex-direction: column;
        gap: 2.5px;
        pointer-events: none;
      }

      .handle--horizontal-bar .handle__dots {
        flex-direction: row;
      }

      .handle__dots span {
        display: block;
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.7);
        flex-shrink: 0;
      }

      .handle--vertical-bar:hover .handle__dots span,
      .handle--vertical-bar.qz-splitter-handle--dragging .handle__dots span,
      .handle--horizontal-bar:hover .handle__dots span,
      .handle--horizontal-bar.qz-splitter-handle--dragging .handle__dots span {
        background: rgba(255, 255, 255, 0.9);
      }
    `,
  ],
})
export class SplitterDemoComponent {
  hPosition = signal(40);
  vPosition = signal(55);
}
