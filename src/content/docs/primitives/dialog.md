---
title: Dialog & Drawer
description: 'Portal-based dialog system with backdrop, scroll lock, keyboard handling, and 5 positioning modes. Build modal dialogs and side drawers with complete layout control.'
group: Primitives
order: 101
---

## At a glance

- **5 Positions** — Center, left, right, top, bottom
- **Backdrop** — Click-outside & Escape to close
- **Scroll Lock** — Body scroll blocked on open
- **DialogRef** — Lifecycle & close event control

## Live examples

::demo[dialog]

## Code

### Centered Modal

```ts
// Inject the service
private readonly dialog = inject(DialogService);
private readonly vcr = inject(ViewContainerRef);

// Open a centered modal
open() {
  const ref = this.dialog.open(this.modalTemplate, this.vcr, {
    position: 'center',
    // Name the dialog: bind the template's `ariaLabelledBy` context value to your title,
    // pass `ariaLabelledBy` (an existing id), or set `ariaLabel` when there is no title.
    ariaLabel: 'Confirm action',
  });
  ref.closed$.subscribe(() => console.log('Dialog closed'));
}
```

### Side Drawers

```ts
// Open a side drawer
openDrawer(side: DialogPosition) {
  this.dialog.open(this.drawerTemplate, this.vcr, {
    position: side, // 'left' | 'right' | 'top' | 'bottom'
    width: '380px', // for left/right drawers
  });
}
```

### Backdrop & Close Behavior

```ts
// Custom backdrop and close behavior
this.dialog.open(template, vcr, {
  position: 'center',
  backdrop: true,
  closeOnBackdropClick: true,
  closeOnEscape: true,
  backdropClass: 'my-custom-backdrop',
  panelClass: 'my-dialog-panel',
});
```

### DialogRef Lifecycle

```ts
// DialogRef gives you full lifecycle control
const ref = this.dialog.open(template, vcr, config);

// Close programmatically
ref.close();

// React to close event
ref.closed$.subscribe(() => {
  console.log('Dialog has been closed');
});
```
