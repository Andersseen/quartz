---
title: File Upload
description: 'Native file-picker and file-drop filtering behavior without a hosted upload service.'
group: Primitives
order: 183
---

## At a glance

`FileUploadDirective` enhances a native `input[type=file]`. It exposes selected `File` objects and rejection events; it never uploads or stores files.

## Install and import

```ts
import { FileDropzoneDirective, FileUploadDirective } from '@quartz-headless/primitives';
```

## Live demo

::demo[controls-text-files]

## Minimal example

```html
<label for="attachments">Attachments</label>
<div qzFileDropzone aria-describedby="upload-help">
  <p id="upload-help">Choose files or drop them here.</p>
  <label for="attachments">Attachments</label>
  <input
    #upload="qzFileUpload"
    id="attachments"
    type="file"
    qzFileUpload
    accept="image/*,.pdf"
    multiple
    (filesChange)="files.set($event)"
    (rejected)="rejections.set($event)"
    (cancelled)="pickerCancelled.set(true)"
  />
  <button type="button" (click)="upload.openPicker()">Browse files</button>
</div>
```

The native input retains picker keyboard access and browser submission semantics. `accept` supports MIME types, wildcards and extensions. `multiple` and `directory` configure native attributes; directory selection depends on browser support and falls back to the native file input behavior where unavailable. `FileDropzoneDirective` queries the file input nested in its host, accepts drops on that consumer container, tracks nested drag enter/leave transitions and sets `data-drag-active`. Put one `qzFileUpload` input inside each `qzFileDropzone`. Its `openPicker()` method opens the associated native picker from a consumer button. Direct drops on the native input also work.

`FileUploadDirective` exposes `files`, `filesChange`, `rejected`, `cancelled` and `dragActive`. Rejection reasons are `type` and `multiple`; when `multiple` is false, the first acceptable dropped file is considered and excess files are reported. Empty drops clear the selection and emit empty arrays. `FileDropzoneDirective` exposes `dragActive`, `openPicker()` and the `data-drag-active` hook. Native `disabled` blocks picker/drop handling. No file content is read, validated for security or uploaded.

The file directive reads native `accept` and `multiple` attributes and accepts the `directory` input. Add an accessible label and visible drop instructions yourself; keep the real file input available for keyboard and screen-reader users. Style `[data-drag-active]` and rejection/selection feedback in consumer CSS. No additional ARIA role is applied to the dropzone.

## API reference and Volt differences

- [`FileUploadDirective`](/docs/reference/api/primitives/file-upload-directive)
- [`FileDropzoneDirective`](/docs/reference/api/primitives/file-dropzone-directive)
- [`RejectedFile`](/docs/reference/api/primitives/rejected-file)

Quartz reports native `File` objects and adds an optional dropzone wrapper. The dropzone is headless; consumers still provide visual affordances and instructions. It does not include an upload service or directory browser. The input keeps native keyboard and picker access; `disabled` is honored. Directory selection uses the browser's `webkitdirectory` attribute where implemented and otherwise behaves like the ordinary native picker. Dropped directory trees are not traversed.
