import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewContainerRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  DialogService,
  SelectContentDirective,
  SelectDirective,
  SelectListboxDirective,
  SelectOptionDirective,
  SelectTriggerDirective,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-settings-dialog-demo',
  imports: [
    SelectDirective,
    SelectTriggerDirective,
    SelectContentDirective,
    SelectListboxDirective,
    SelectOptionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      (click)="open()"
      class="site-focus rounded-lg border border-line-strong bg-surface-2 px-4 py-2.5 text-sm font-medium text-fg hover:border-brand/60"
    >
      Export settings…
    </button>
    <p class="mt-4 text-sm text-fg-muted" data-testid="export-format-readout">
      Current format: <span class="font-mono text-fg">{{ applied() }}</span>
    </p>

    <ng-template #settings let-ref let-labelledBy="ariaLabelledBy">
      <div
        class="w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-line-strong bg-surface-1 p-6 shadow-2xl"
      >
        <h3 [id]="labelledBy" class="text-lg font-semibold text-fg">Export format</h3>
        <p class="mt-1 text-sm text-fg-muted">
          Pick a format. Escape, the backdrop or Cancel closes this dialog.
        </p>

        <p id="export-format-label" class="mt-5 text-sm font-medium text-fg">Format</p>
        <div qzSelect #select="qzSelect" [(value)]="draft" class="mt-2">
          <button
            qzSelectTrigger
            aria-labelledby="export-format-label export-format-value"
            class="site-focus flex w-full items-center justify-between rounded-lg border border-line-strong bg-surface-2 px-3 py-2.5 text-left text-sm text-fg data-[qz-open]:border-brand"
          >
            <span id="export-format-value">{{ select.selectedLabel() }}</span>
            <span aria-hidden="true" class="text-fg-subtle">▾</span>
          </button>
          <ng-template qzSelectContent>
            <div
              qzSelectListbox
              class="min-w-48 rounded-lg border border-line-strong bg-surface-2 p-1 shadow-xl"
            >
              @for (format of formats; track format) {
                <button
                  [qzSelectOption]="format"
                  class="block w-full rounded-md px-3 py-2 text-left text-sm text-fg data-[qz-highlighted]:bg-brand/20 data-[qz-selected]:font-semibold"
                >
                  {{ format }}
                </button>
              }
            </div>
          </ng-template>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            (click)="ref.close()"
            class="site-focus rounded-lg px-4 py-2 text-sm text-fg-muted hover:text-fg"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="apply(ref)"
            class="site-focus rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-surface-0"
          >
            Apply
          </button>
        </div>
      </div>
    </ng-template>
  `,
})
export class SettingsDialogDemoComponent {
  private readonly dialog = inject(DialogService);
  private readonly vcr = inject(ViewContainerRef);
  private readonly settings = viewChild.required<TemplateRef<unknown>>('settings');

  readonly formats = ['PDF', 'CSV', 'JSON', 'Markdown'];
  readonly applied = signal('PDF');
  readonly draft = signal<string | null>('PDF');

  open(): void {
    this.draft.set(this.applied());
    this.dialog.open(this.settings(), this.vcr, {
      backdropClass: 'bg-black/70',
    });
  }

  apply(ref: { close(): void }): void {
    this.applied.set(this.draft() ?? this.applied());
    ref.close();
  }
}
