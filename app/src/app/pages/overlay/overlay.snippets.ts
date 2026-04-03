export const DROPDOWN_SNIPPET = `<button qzOverlayTrigger
  [overlayTemplate]="dropdownTpl"
  placement="bottom-start">
  Open menu
</button>

<ng-template #dropdownTpl>
  <div class="dropdown">
    <button class="dropdown__item">Edit</button>
    <button class="dropdown__item">Delete</button>
  </div>
</ng-template>`;

export const PLACEMENTS_SNIPPET = `<button qzOverlayTrigger
  [overlayTemplate]="popoverTpl"
  placement="top"
  [flip]="true">
  Open
</button>`;

export const SELECT_SNIPPET = `<button qzOverlayTrigger
  [overlayTemplate]="selectTpl"
  placement="bottom-start"
  [matchAnchorWidth]="true">
  Select option
</button>`;

export const PROGRAMMATIC_SNIPPET = `const overlayRef = this.overlayService.create(
  templateRef,
  viewContainerRef,
  anchorElement,
  { placement: 'bottom-start', offset: 8 }
);

overlayRef.open();`;
