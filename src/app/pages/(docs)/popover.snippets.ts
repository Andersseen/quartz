export const BASIC_SNIPPET = `import { PopoverDirective, PopoverTriggerDirective } from '@quartz-headless/primitives';

<button qzPopoverTrigger [popover]="details" type="button">
  Details
</button>

<ng-template #details>
  <div qzPopover class="popover">
    <button type="button">Focusable action</button>
  </div>
</ng-template>`;

export const CONTROLLED_SNIPPET = `<button
  qzPopoverTrigger
  [popover]="settings"
  [(open)]="open"
  [autoFocus]="true">
  Settings
</button>`;
