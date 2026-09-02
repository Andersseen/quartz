// Real-consumer smoke fixture. Deliberately uses ONLY the public package specifiers a real
// installer would resolve — no deep imports into dist/src, no tsconfig path aliases (this
// fixture's tsconfig has no "paths" field at all). If this file fails to compile, the
// published packages' exports/types are broken for a real external consumer, even though
// the monorepo's own workspace-symlink-based dev flow would never surface it.

import { Component, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { CollectionStore, type CollectionItem } from '@quartz-headless/core';
import {
  CheckboxDirective,
  DialogRef,
  DialogService,
  SliderDirective,
  ToastContainerComponent,
} from '@quartz-headless/primitives';

// Core service.
interface Row extends CollectionItem {
  id: string;
}
const collection = new CollectionStore<Row>();
collection.register({ id: 'row-1' });
collection.register({ id: 'row-2' });
const firstActive: string | null = collection.activeId();
void firstActive;

// Primitives service.
@Component({
  selector: 'app-consumer-smoke-host',
  standalone: true,
  template: `<ng-template #dialogTpl>Hello from a real consumer</ng-template>`,
})
class DialogHostComponent {
  private readonly dialogs = inject(DialogService);

  open(templateRef: TemplateRef<unknown>, viewContainerRef: ViewContainerRef): DialogRef {
    return this.dialogs.open(templateRef, viewContainerRef, { position: 'center' });
  }
}

// Primitives directives (model()-based) + component, referenced from imports so the
// Angular compiler actually resolves and type-checks their selectors/inputs/outputs.
@Component({
  selector: 'app-consumer-smoke-controls',
  standalone: true,
  imports: [CheckboxDirective, SliderDirective, ToastContainerComponent],
  template: `
    <button qzCheckbox [(checked)]="checked"></button>
    <div qzSlider [(value)]="volume"></div>
    <qz-toast-container />
  `,
})
class ControlsComponent {
  checked = false;
  volume = 50;
}

void DialogHostComponent;
void ControlsComponent;
