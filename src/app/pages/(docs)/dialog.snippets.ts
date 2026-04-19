export const MODAL_SNIPPET = `// Inject the service
constructor(private dialog: DialogService) {}

// Open a centered modal
open() {
  const ref = this.dialog.open(this.modalTemplate, this.vcr, {
    position: 'center',
  });
  ref.closed$.subscribe(() => console.log('Dialog closed'));
}`;

export const DRAWER_SNIPPET = `// Open a side drawer
openDrawer(side: DialogPosition) {
  this.dialog.open(this.drawerTemplate, this.vcr, {
    position: side, // 'left' | 'right' | 'top' | 'bottom'
    width: '380px', // for left/right drawers
  });
}`;

export const BACKDROP_SNIPPET = `// Custom backdrop and close behavior
this.dialog.open(template, vcr, {
  position: 'center',
  backdrop: true,
  closeOnBackdropClick: true,
  closeOnEscape: true,
  backdropClass: 'my-custom-backdrop',
  panelClass: 'my-dialog-panel',
});`;

export const DIALOG_REF_SNIPPET = `// DialogRef gives you full lifecycle control
const ref = this.dialog.open(template, vcr, config);

// Close programmatically
ref.close();

// React to close event
ref.closed$.subscribe(() => {
  console.log('Dialog has been closed');
});`;
