---
title: Toast
description: Transient application feedback that does not interrupt the page.
group: Primitives
order: 103
---

Toast communicates transient application feedback without taking over the page. Use an inline status message for persistent or field-specific information; use native browser notifications only when the application needs OS-level notification behavior.

## Live demo

::demo[toast]

::playground[quartz-toast]

## Installation and imports

```sh
pnpm quartz add toast
```

```ts
import { ToastService, ToastContainerComponent } from '@quartz-headless/primitives';
```

Render one `<qz-toast-container />` in the application shell. The service supports `show`, `success`, `error`, `warning`, `info`, `dismiss`, `dismissAll`, `pause`, and `resume`.

```ts
this.toast.show({
  type: 'success',
  title: 'Saved',
  message: 'Your changes were saved.',
  duration: 5000,
});
this.toast.show({
  type: 'info',
  message: 'Undo is available',
  actions: [{ label: 'Undo', run: () => this.undo(), dismiss: true }],
});
```

### Custom templates and components

A template receives `$implicit`, `toast`, and `dismiss` in its context. A component content type receives a `context` input with the toast and a dismissal callback.

```ts
this.toast.show({ type: 'info', content: this.toastTemplate, duration: 0 });
```

```html
<ng-template #toastTemplate let-dismiss="dismiss">
  <span>Upload complete</span><button type="button" (click)="dismiss()">Close</button>
</ng-template>
```

Actions are native buttons with accessible labels; `dismiss: true` closes after activation. Actionable toasts pause while focus is inside and resume when focus leaves. Quartz never moves focus into a newly shown toast. If focused content is removed, the browser's normal focus fallback applies; consumers should keep durations long enough for their actions or use `duration: 0`.

## State and accessibility

Options include severity (`type`), duration (`0` persists), one of six physical positions, dismissibility, hover pause, progress display, action buttons, template/component content, and `maxVisible` per placement (default 5). Newest notifications are retained when the limit is exceeded. `aria-live` comes from each toast's `role`: errors use `alert`, other severities use `status`; announcements are atomic. Do not place another live region inside custom content.

CSS hooks include `data-qz-type`, `.qz-toast__action`, position classes, and `--qz-toast-z-index`, `--qz-toast-gap`, `--qz-toast-inset`, and `--qz-toast-max-width`. Quartz supplies only structural placement. Toast has no special keyboard handling; action controls use native keyboard activation. The service does not start timers without a browser window, and timers/embedded content are tied to the rendered container lifecycle. Avoid server-global state in SSR. CLI source-copy usage is `pnpm quartz add toast`; consult the API reference for options and types.
