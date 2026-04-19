import {
  Component,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  inject,
  input,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EditorLoaderService } from '../../services/editor-loader.service';

@Component({
  selector: 'app-code-block',
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
          <button class="code-block__copy" (click)="copyCode()" [attr.aria-label]="copied() ? 'Copied' : 'Copy code'">
            @if (copied()) {
              <span>&#10003; Copied</span>
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
          <div class="code-block__editor-wrap">
            @if (editorLoaded()) {
              <vertex-editor
                [attr.value]="code()"
                language="typescript"
                [attr.theme]="editorTheme()"
                lineNumbers="true"
                readonly="true"
                style="display: block; height: 380px; overflow: auto;"
              ></vertex-editor>
            } @else {
              <div class="code-block__editor-placeholder">
                <span>Loading editor…</span>
              </div>
            }
          </div>
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

      .code-block__editor-wrap {
        height: 380px;
        overflow: hidden;
      }

      .code-block__editor-placeholder {
        height: 380px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        font-size: 0.875rem;
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `,
  ],
})
export class CodeBlockComponent implements OnInit {
  code = input.required<string>();
  activeTab = signal<'preview' | 'code'>('preview');
  copied = signal(false);
  editorLoaded = signal(false);
  editorTheme = signal<'light' | 'dark'>('dark');

  private readonly platformId = inject(PLATFORM_ID);
  private readonly editorLoader = inject(EditorLoaderService);
  private readonly destroyRef = inject(DestroyRef);

  async ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    await this.editorLoader.loadEditor();
    this.editorLoaded.set(true);
    this.editorTheme.set(document.documentElement.classList.contains('dark') ? 'dark' : 'light');

    const observer = new MutationObserver(() => {
      this.editorTheme.set(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributeFilter: ['class'] });
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  copyCode(): void {
    navigator.clipboard.writeText(this.code());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
