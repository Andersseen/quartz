import {
  Directive,
  ElementRef,
  booleanAttribute,
  contentChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

export interface RejectedFile {
  file: File;
  reason: 'type' | 'multiple';
}

/** Adds filtering and drag/drop selection events to a native file input. No upload is performed. */
@Directive({
  selector: 'input[type="file"][qzFileUpload]',
  exportAs: 'qzFileUpload',
  standalone: true,
  host: {
    '[attr.accept]': 'accept() || null',
    '[attr.webkitdirectory]': 'directory() ? "" : null',
    '[attr.data-drag-active]': 'dragActive() ? "" : null',
    '(change)': 'onChange()',
    '(cancel)': 'cancelled.emit()',
    '(dragover)': 'onDragOver($event)',
    '(dragenter)': 'onDragEnter()',
    '(dragleave)': 'onDragLeave($event)',
    '(drop)': 'onDrop($event)',
  },
})
export class FileUploadDirective {
  private readonly host = inject(ElementRef<HTMLInputElement>).nativeElement;
  readonly accept = input('');
  readonly directory = input(false, { transform: booleanAttribute });
  readonly filesChange = output<readonly File[]>();
  readonly rejected = output<readonly RejectedFile[]>();
  readonly cancelled = output<void>();
  readonly dragActive = signal(false);
  readonly files = signal<readonly File[]>([]);

  onChange(): void {
    this.commit(Array.from(this.host.files ?? []));
  }

  /** Open the associated native picker from an accessible consumer action. */
  openPicker(): void {
    if (!this.disabled()) this.host.click();
  }

  /** Consume files from a dropzone without reading or uploading their contents. */
  acceptDroppedFiles(files: readonly File[]): void {
    if (!this.disabled()) this.commit([...files]);
  }

  onDragOver(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  onDragEnter(): void {
    if (this.disabled()) {
      this.dragActive.set(false);
      return;
    }
    this.dragActive.set(true);
  }

  onDragLeave(event: DragEvent): void {
    if (this.disabled()) {
      this.dragActive.set(false);
      return;
    }
    const related = event.relatedTarget;
    if (!(related instanceof Node && this.host.contains(related))) this.dragActive.set(false);
  }

  onDrop(event: DragEvent): void {
    if (this.disabled()) {
      this.dragActive.set(false);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.dragActive.set(false);
    this.commit(Array.from(event.dataTransfer?.files ?? []));
  }

  private commit(selected: File[]): void {
    const candidates = this.host.multiple ? selected : selected.slice(0, 1);
    const accepted: File[] = [];
    const rejected: RejectedFile[] = selected.slice(candidates.length).map((file) => ({
      file,
      reason: 'multiple',
    }));
    for (const file of candidates) {
      if (this.matches(file)) accepted.push(file);
      else rejected.push({ file, reason: 'type' });
    }
    this.files.set(accepted);
    this.filesChange.emit(accepted);
    this.rejected.emit(rejected);
  }

  private matches(file: File): boolean {
    const rules = this.accept()
      .split(',')
      .map((rule) => rule.trim().toLowerCase())
      .filter(Boolean);
    if (!rules.length) return true;
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    return rules.some((rule) =>
      rule.startsWith('.')
        ? name.endsWith(rule)
        : rule.endsWith('/*')
          ? type.startsWith(rule.slice(0, -1))
          : type === rule,
    );
  }

  isDisabled(): boolean {
    return this.host.disabled;
  }

  private disabled(): boolean {
    return this.isDisabled();
  }
}

/** Adds keyboard friendly dropzone behavior around a native qzFileUpload input. */
@Directive({
  selector: '[qzFileDropzone]',
  exportAs: 'qzFileDropzone',
  standalone: true,
  host: {
    '[attr.data-drag-active]': 'dragActive() ? "" : null',
    '(dragover)': 'onDragOver($event)',
    '(dragenter)': 'onDragEnter($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(drop)': 'onDrop($event)',
  },
})
export class FileDropzoneDirective {
  readonly fileUpload = contentChild.required(FileUploadDirective);
  readonly dragActive = signal(false);
  #dragDepth = 0;

  onDragOver(event: DragEvent): void {
    if (!this.fileUpload().isDisabled()) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDragEnter(event: DragEvent): void {
    if (this.fileUpload().isDisabled()) {
      this.#dragDepth = 0;
      this.dragActive.set(false);
      return;
    }
    const current = event.currentTarget as HTMLElement | null;
    if (current && event.relatedTarget instanceof Node && current.contains(event.relatedTarget))
      return;
    event.preventDefault();
    this.#dragDepth++;
    this.dragActive.set(true);
  }

  onDragLeave(event: DragEvent): void {
    if (this.fileUpload().isDisabled()) {
      this.#dragDepth = 0;
      this.dragActive.set(false);
      return;
    }
    const current = event.currentTarget as HTMLElement | null;
    if (current && event.relatedTarget instanceof Node && current.contains(event.relatedTarget))
      return;
    this.#dragDepth = Math.max(0, this.#dragDepth - 1);
    if (this.#dragDepth === 0) this.dragActive.set(false);
  }

  onDrop(event: DragEvent): void {
    if (this.fileUpload().isDisabled()) {
      this.#dragDepth = 0;
      this.dragActive.set(false);
      return;
    }
    if (event.defaultPrevented) return;
    event.preventDefault();
    this.#dragDepth = 0;
    this.dragActive.set(false);
    this.fileUpload().acceptDroppedFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  openPicker(): void {
    this.fileUpload().openPicker();
  }
}
