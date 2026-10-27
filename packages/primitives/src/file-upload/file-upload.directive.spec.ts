import { ChangeDetectionStrategy, Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import {
  FileDropzoneDirective,
  FileUploadDirective,
  type RejectedFile,
} from './file-upload.directive';

@Component({
  standalone: true,
  imports: [FileDropzoneDirective, FileUploadDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div qzFileDropzone>
      <input
        #upload="qzFileUpload"
        qzFileUpload
        type="file"
        aria-label="Attachments"
        accept="image/*,.txt"
        multiple
        (filesChange)="selected = $event"
        (rejected)="rejections = $event"
      />
    </div>
  `,
})
class FileHost {
  selected: readonly File[] = [];
  rejections: readonly RejectedFile[] = [];
}

@Component({
  standalone: true,
  imports: [FileUploadDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template:
    '<input qzFileUpload type="file" accept=".txt" aria-label="Single file" (filesChange)="selected = $event" (rejected)="rejections = $event" />',
})
class SingleFileHost {
  selected: readonly File[] = [];
  rejections: readonly RejectedFile[] = [];
}

describe('FileUploadDirective', () => {
  it('filters native picker selections by MIME and extension and reports rejected files', async () => {
    const { fixture } = await render(FileHost);
    const input = screen.getByLabelText('Attachments') as HTMLInputElement;
    const image = new File(['img'], 'photo.png', { type: 'image/png' });
    const text = new File(['txt'], 'notes.txt', { type: 'text/plain' });
    const wrong = new File(['bin'], 'archive.bin', { type: 'application/octet-stream' });
    Object.defineProperty(input, 'files', { configurable: true, value: [image, text, wrong] });
    input.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.selected).toEqual([image, text]);
    expect(fixture.componentInstance.rejections).toEqual([{ file: wrong, reason: 'type' }]);
  });

  it('handles drops and ignores them when the native input is disabled', async () => {
    const { fixture } = await render(FileHost);
    const input = screen.getByLabelText('Attachments') as HTMLInputElement;
    const image = new File(['img'], 'photo.png', { type: 'image/png' });
    const directive = fixture.debugElement
      .query(By.directive(FileUploadDirective))
      .injector.get(FileUploadDirective);
    const event = new Event('drop', { cancelable: true }) as DragEvent;
    Object.defineProperty(event, 'dataTransfer', { value: { files: [image] } });
    directive.onDrop(event);
    expect(event.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.selected).toEqual([image]);

    input.disabled = true;
    const disabledEvent = new Event('drop', { cancelable: true }) as DragEvent;
    Object.defineProperty(disabledEvent, 'dataTransfer', { value: { files: [] } });
    directive.onDrop(disabledEvent);
    expect(disabledEvent.defaultPrevented).toBe(false);
    expect(fixture.componentInstance.selected).toEqual([image]);
  });

  it('tracks nested drag enter and leave and reports files dropped on the wrapper', async () => {
    const { fixture } = await render(FileHost);
    const wrapper = fixture.nativeElement.querySelector('div') as HTMLElement;
    const zone = fixture.debugElement
      .query(By.directive(FileDropzoneDirective))
      .injector.get(FileDropzoneDirective);
    const enter = new Event('dragenter', { cancelable: true }) as DragEvent;
    zone.onDragEnter(enter);
    zone.onDragEnter(enter);
    zone.onDragLeave(new Event('dragleave') as DragEvent);
    expect(zone.dragActive()).toBe(true);

    const event = new Event('drop', { cancelable: true }) as DragEvent;
    const image = new File(['img'], 'photo.png', { type: 'image/png' });
    Object.defineProperty(event, 'dataTransfer', { value: { files: [image] } });
    zone.onDrop(event);
    expect(event.defaultPrevented).toBe(true);
    expect(zone.dragActive()).toBe(false);
    expect(fixture.componentInstance.selected).toEqual([image]);
    expect(wrapper).toBeTruthy();
  });

  it('reports excess dropped files when multiple selection is disabled', async () => {
    const { fixture } = await render(SingleFileHost);
    const first = new File(['a'], 'first.txt', { type: 'text/plain' });
    const second = new File(['b'], 'second.txt', { type: 'text/plain' });
    const directive = fixture.debugElement
      .query(By.directive(FileUploadDirective))
      .injector.get(FileUploadDirective);
    directive.acceptDroppedFiles([first, second]);
    expect(fixture.componentInstance.selected).toEqual([first]);
    expect(fixture.componentInstance.rejections).toEqual([{ file: second, reason: 'multiple' }]);
  });
});
