import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';

@Component({
  selector: 'app-code-block',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="code-block">
      <div class="code-block__header">
        <div class="code-block__tabs">
          <button
            class="code-block__tab"
            [class.code-block__tab--active]="activeTab() === 'preview'"
            (click)="activeTab.set('preview')"
          >
            Preview
          </button>
          <button
            class="code-block__tab"
            [class.code-block__tab--active]="activeTab() === 'code'"
            (click)="activeTab.set('code')"
          >
            Code
          </button>
        </div>
        @if (activeTab() === 'code') {
          <button class="code-block__copy" (click)="copyCode()">
            @if (copied()) {
              <span>✓ Copied</span>
            } @else {
              <span>Copy</span>
            }
          </button>
        }
      </div>

      <div class="code-block__content">
        @if (activeTab() === 'preview') {
          <div class="code-block__preview">
            <ng-content select="[preview]" />
          </div>
        } @else {
          <pre class="code-block__code"><code>{{ code() }}</code></pre>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .code-block {
        border: 1px solid #1e1e2a;
        border-radius: 12px;
        overflow: hidden;
        background: #0f0f13;
      }

      .code-block__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem;
        background: #1e1e2a;
        border-bottom: 1px solid #2a2a3a;
      }

      .code-block__tabs {
        display: flex;
        gap: 0.25rem;
      }

      .code-block__tab {
        padding: 0.5rem 1rem;
        border: none;
        background: transparent;
        color: #6b7280;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.15s ease;
      }

      .code-block__tab:hover {
        color: #e5e7eb;
        background: #2a2a3a;
      }

      .code-block__tab--active {
        color: #a78bfa !important;
        background: #1e1430 !important;
      }

      .code-block__copy {
        padding: 0.375rem 0.875rem;
        border: 1px solid #2a2a3a;
        background: #0f0f13;
        color: #9ca3af;
        font-size: 0.75rem;
        font-weight: 500;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.15s ease;
      }

      .code-block__copy:hover {
        border-color: #7c3aed;
        color: #a78bfa;
      }

      .code-block__content {
        min-height: 200px;
      }

      .code-block__preview {
        padding: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
      }

      .code-block__code {
        margin: 0;
        padding: 1.5rem;
        background: #0a0a0c;
        color: #e5e7eb;
        font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', monospace;
        font-size: 0.8125rem;
        line-height: 1.7;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-all;
      }
    `,
  ],
})
export class CodeBlockComponent {
  code = input.required<string>();
  activeTab = signal<'preview' | 'code'>('preview');
  copied = signal(false);

  copyCode(): void {
    navigator.clipboard.writeText(this.code());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
