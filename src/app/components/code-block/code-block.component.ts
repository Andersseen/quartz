import {
  Component,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EditorLoaderService } from '../../services/editor-loader.service';
import { VoltButton } from '@voltui/components';

@Component({
  selector: 'app-code-block',
  imports: [VoltButton],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="code-block">
      <div class="code-block__header">
        <div class="code-block__tabs">
          <volt-button
            variant="ghost"
            size="sm"
            [class.code-block__tab--active]="activeTab() === 'preview'"
            (click)="activeTab.set('preview')"
          >
            Preview
          </volt-button>
          <volt-button
            variant="ghost"
            size="sm"
            [class.code-block__tab--active]="activeTab() === 'code'"
            (click)="activeTab.set('code')"
          >
            Code
          </volt-button>
        </div>
        @if (activeTab() === 'code') {
          <volt-button
            variant="outline"
            size="sm"
            (click)="copyCode()"
            [attr.aria-label]="copied() ? 'Copied' : 'Copy code'"
          >
            @if (copied()) {
              <span>&#10003; Copied</span>
            } @else {
              <span>Copy</span>
            }
          </volt-button>
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
                [attr.language]="language()"
                theme="dark"
                lineNumbers="true"
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

      .code-block__tab--active {
        --tw-text-opacity: 1;
        color: rgb(167 139 250 / var(--tw-text-opacity)) !important;
        background-color: rgb(30 20 48) !important;
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
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.4;
        }
      }
    `,
  ],
})
export class CodeBlockComponent implements OnInit {
  code = input.required<string>();
  // Most quartz demos are Angular templates — pass 'typescript' for .ts snippets
  language = input<'html' | 'typescript'>('html');
  activeTab = signal<'preview' | 'code'>('preview');
  copied = signal(false);
  editorLoaded = signal(false);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly editorLoader = inject(EditorLoaderService);

  async ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    await this.editorLoader.loadEditor();
    this.editorLoaded.set(true);
  }

  copyCode(): void {
    navigator.clipboard.writeText(this.code());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
