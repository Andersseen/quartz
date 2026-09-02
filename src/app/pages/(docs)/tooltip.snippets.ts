export const BASIC_SNIPPET = `<!-- Text tooltip -->
<button qzTooltip="Save changes" tooltipPlacement="top" type="button">
  Save
</button>`;

export const PLACEMENT_SNIPPET = `<!-- Try different placements -->
<button qzTooltip="Above" tooltipPlacement="top">Top</button>
<button qzTooltip="Below" tooltipPlacement="bottom">Bottom</button>
<button qzTooltip="Before" tooltipPlacement="left">Left</button>
<button qzTooltip="After" tooltipPlacement="right">Right</button>`;

export const RICH_SNIPPET = `<!-- Rich HTML tooltip via template -->
<button [qzTooltip]="statsTpl" tooltipPlacement="bottom">
  View Stats
</button>

<ng-template #statsTpl>
  <div class="tooltip-rich">
    <strong>42</strong> new views today
  </div>
</ng-template>`;

export const INTERACTIVE_SNIPPET = `<!-- A tooltip with focusable/interactive content (links, buttons) violates the
     WAI-ARIA tooltip pattern — role="tooltip" must never receive focus or stay
     open while the pointer moves into it. Use Popover for that case instead: -->
<button qzPopoverTrigger [popover]="details" type="button">
  Learn more
</button>

<ng-template #details>
  <div qzPopover class="popover">
    <a href="/docs">Read the docs</a>
  </div>
</ng-template>`;

export const DELAY_SNIPPET = `<!-- Customize show/hide delay -->
<button
  qzTooltip="Fast feedback"
  tooltipPlacement="top"
  [tooltipDelay]="0"
  [tooltipHideDelay]="0">
  Instant
</button>

<button
  qzTooltip="Slow and steady"
  tooltipPlacement="top"
  [tooltipDelay]="800"
  [tooltipHideDelay]="400">
  Delayed
</button>`;
