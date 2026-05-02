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
    <div class="border border-[#1e1e2a] rounded-xl overflow-hidden bg-[#0f0f13]">
      <div class="flex items-center justify-between p-2 bg-[#1e1e2a] border-b border-[#2a2a3a]">
        <div class="flex gap-1">
          <volt-button
            variant="ghost"
            size="sm"
            [class.text-violet-400]="activeTab() === 'preview'"
            [class.bg-[#1e1430]]="activeTab() === 'preview'"
            (click)="activeTab.set('preview')"
          >
            Preview
          </volt-button>
          <volt-button
            variant="ghost"
            size="sm"
            [class.text-violet-400]="activeTab() === 'code'"
            [class.bg-[#1e1430]]="activeTab() === 'code'"
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

      <div class="min-h-[200px]">
        @if (activeTab() === 'preview') {
          <div class="p-8 flex items-center justify-center min-h-[200px]">
            <ng-content select="[preview]" />
          </div>
        } @else {
          <div class="h-[380px] overflow-hidden">
            @if (editorLoaded()) {
              <vertex-editor
                [attr.value]="code()"
                [attr.language]="language()"
                theme="dark"
                lineNumbers="true"
                style="display: block; height: 380px; overflow: auto;"
              ></vertex-editor>
            } @else {
              <div
                class="h-[380px] flex items-center justify-center text-gray-500 text-sm animate-pulse"
              >
                <span>Loading editor…</span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class CodeBlockComponent implements OnInit {
  code = input.required<string>();
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
