export const BASIC_SNIPPET = `import { MenuDirective, MenuTriggerDirective, MenuItemDirective } from '@quartz-headless/primitives';

<button qzMenuTrigger [menu]="fileMenu" type="button">File</button>

<ng-template #fileMenu>
  <div qzMenu class="menu">
    <button qzMenuItem (selected)="create()">New file</button>
    <button qzMenuItem (selected)="rename()">Rename</button>
    <button qzMenuItem [disabled]="true">Archive</button>
  </div>
</ng-template>`;

export const SUBMENU_SNIPPET = `<button qzMenuTrigger [menu]="menu" type="button">Share</button>

<ng-template #menu>
  <div qzMenu class="menu">
    <button qzMenuItem [submenu]="shareMenu">Share with</button>
    <ng-template #shareMenu>
      <div qzMenu class="menu">
        <button qzMenuItem>Email</button>
        <button qzMenuItem>Copy link</button>
      </div>
    </ng-template>
  </div>
</ng-template>`;

export const CHECKABLE_SNIPPET = `<button qzMenuCheckboxItem [(checked)]="showToolbar">
  Show toolbar
</button>

<div qzMenuRadioGroup [(value)]="density">
  <button qzMenuRadioItem value="compact">Compact</button>
  <button qzMenuRadioItem value="comfortable">Comfortable</button>
</div>`;
