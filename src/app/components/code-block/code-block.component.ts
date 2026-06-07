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
import {
  VoltBadge,
  VoltButton,
  VoltTabs,
  VoltTabsContent,
  VoltTabsList,
  VoltTabsTrigger,
} from '@voltui/components';
import { LmnCheckIcon, LmnCopyIcon, LmnEyeIcon, LmnTerminalIcon } from 'lumen-icons';

@Component({
  selector: 'app-code-block',
  imports: [
    VoltBadge,
    VoltButton,
    VoltTabs,
    VoltTabsContent,
    VoltTabsList,
    VoltTabsTrigger,
    LmnCheckIcon,
    LmnCopyIcon,
    LmnEyeIcon,
    LmnTerminalIcon,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative border border-[#1e1e2a] rounded-xl overflow-hidden bg-[#0f0f13]">
      <volt-tabs [value]="activeTab()" (valueChange)="selectTab($event)" class="block">
        <div class="flex items-center justify-between p-2 bg-[#1e1e2a] border-b border-[#2a2a3a]">
          <volt-tabs-list>
            <volt-tabs-trigger value="preview">
              <span class="inline-flex items-center gap-2">
                <lmn-eye [size]="16" />
                Preview
              </span>
            </volt-tabs-trigger>
            <volt-tabs-trigger value="code">
              <span class="inline-flex items-center gap-2">
                <lmn-terminal [size]="16" />
                Code
              </span>
            </volt-tabs-trigger>
          </volt-tabs-list>

          <volt-badge variant="outline">{{ language() }}</volt-badge>
        </div>

        @if (activeTab() === 'code') {
          <div class="absolute right-4 mt-3 z-10">
            <volt-button
              variant="outline"
              size="sm"
              (click)="copyCode()"
              [attr.aria-label]="copied() ? 'Copied' : 'Copy code'"
            >
              @if (copied()) {
                <lmn-check slot="leading" [size]="16" />
                <span>Copied</span>
              } @else {
                <lmn-copy slot="leading" [size]="16" />
                <span>Copy</span>
              }
            </volt-button>
          </div>
        }

        <volt-tabs-content value="preview">
          <div class="p-8 flex items-center justify-center min-h-[200px]">
            <ng-content select="[preview]" />
          </div>
        </volt-tabs-content>

        <volt-tabs-content value="code">
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
        </volt-tabs-content>
      </volt-tabs>
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

  selectTab(value: string | undefined): void {
    if (value === 'preview' || value === 'code') {
      this.activeTab.set(value);
    }
  }

  copyCode(): void {
    navigator.clipboard.writeText(this.code());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
