import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewContainerRef,
  ViewEncapsulation,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  SplitterContainerDirective,
  SplitterHandleDirective,
  SplitterPanelDirective,
  type OverlayArrowGeometry,
  type OverlayPlacement,
} from '@quartz-headless/core';
import {
  DrawerService,
  MenuCheckboxItemDirective,
  MenuDirective,
  MenuGroupDirective,
  MenuItemDirective,
  MenuLabelDirective,
  MenuRadioGroupDirective,
  MenuRadioItemDirective,
  MenuSeparatorDirective,
  MenuTriggerDirective,
  PopoverDirective,
  PopoverTriggerDirective,
  TooltipDirective,
  type DialogRef,
  type DrawerSide,
} from '@quartz-headless/primitives';

/** Shared structural styling for the 0.16 demos. Quartz itself ships none of it. */
const DEMO_STYLES = `
  .d16 { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-block: 0.5rem; }
  .d16 button { padding: 0.35rem 0.75rem; border: 1px solid currentColor; border-radius: 6px; background: transparent; color: inherit; cursor: pointer; }
  .d16-drawer { background: #14141b; color: #e5e5ee; padding: 1rem; box-sizing: border-box; opacity: 1; transition: opacity 180ms ease, transform 180ms ease; }
  .d16-drawer[data-side='left'], .d16-drawer[data-side='right'] { width: min(320px, 90vw); }
  .d16-drawer[data-side='top'], .d16-drawer[data-side='bottom'] { height: min(220px, 60vh); }
  .d16-drawer[data-side='left'][data-state='opening'], .d16-drawer[data-side='left'][data-state='closing'] { transform: translateX(-24px); opacity: 0; }
  .d16-drawer[data-side='right'][data-state='opening'], .d16-drawer[data-side='right'][data-state='closing'] { transform: translateX(24px); opacity: 0; }
  .d16-drawer[data-side='top'][data-state='opening'], .d16-drawer[data-side='top'][data-state='closing'] { transform: translateY(-24px); opacity: 0; }
  .d16-drawer[data-side='bottom'][data-state='opening'], .d16-drawer[data-side='bottom'][data-state='closing'] { transform: translateY(24px); opacity: 0; }
  .d16-backdrop { background: rgb(0 0 0 / 0.5); }
  .d16-split { height: 120px; border: 1px solid #3a3a4a; border-radius: 6px; overflow: hidden; }
  .d16-split-v { height: 220px; width: 100%; }
  .d16-split [qzSplitterPanel] { padding: 0.5rem; }
  .d16-handle { background: #3a3a4a; }
  .d16-split[data-qz-resizing] .d16-handle, .d16-handle:focus-visible { background: #6d6df0; outline: none; }
  .d16-handle[aria-orientation='vertical'] { width: 6px; }
  .d16-handle[aria-orientation='horizontal'] { height: 6px; }
  .d16-surface { position: relative; background: #1e1e2a; color: #e5e5ee; border: 1px solid #3a3a4a; border-radius: 6px; padding: 0.5rem 0.75rem; }
  .d16-arrow { position: absolute; width: 10px; height: 10px; background: #1e1e2a; border: 1px solid #3a3a4a; transform: rotate(45deg); }
  .d16-menu { background: #1e1e2a; color: #e5e5ee; border: 1px solid #3a3a4a; border-radius: 6px; padding: 0.25rem; min-width: 180px; display: flex; flex-direction: column; }
  .d16-menu [role='menuitem'], .d16-menu [role='menuitemcheckbox'], .d16-menu [role='menuitemradio'] { text-align: start; border: 0; padding: 0.3rem 0.5rem; }
  .d16-menu [data-qz-highlighted] { background: #6d6df0; }
  .d16-menu [aria-disabled='true'] { opacity: 0.5; }
  .d16-menu [data-qz-menu-label] { font-size: 0.75rem; text-transform: uppercase; opacity: 0.7; padding: 0.3rem 0.5rem; }
  .d16-menu [role='separator'] { height: 1px; background: #3a3a4a; margin: 0.25rem 0; }
`;

@Component({
  selector: 'app-drawer-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: DEMO_STYLES,
  template: `
    <div class="d16" role="group" aria-label="Drawer sides">
      @for (side of sides; track side) {
        <button type="button" (click)="open(side)">{{ side }}</button>
      }
    </div>
    <div class="d16">
      <label
        ><input type="checkbox" [checked]="escape()" (change)="escape.set(!escape())" /> Close on
        Escape</label
      >
      <label
        ><input
          type="checkbox"
          [checked]="backdropDismiss()"
          (change)="backdropDismiss.set(!backdropDismiss())"
        />
        Close on backdrop click</label
      >
      <label
        ><input type="checkbox" [checked]="presence()" (change)="presence.set(!presence())" /> Exit
        presence</label
      >
    </div>
    <output aria-live="polite">{{ status() }}</output>

    <ng-template #tpl let-ref let-labelledBy="ariaLabelledBy" let-describedBy="ariaDescribedBy">
      <h2 [id]="labelledBy">Account</h2>
      <p [id]="describedBy">
        A modal panel anchored to a viewport edge. Focus returns to the button that opened it.
      </p>
      <label>Name <input type="text" /></label>
      <p><button type="button" (click)="ref.close()">Close</button></p>
    </ng-template>
  `,
})
export class DrawerDemoComponent {
  private readonly drawers = inject(DrawerService);
  private readonly vcr = inject(ViewContainerRef);
  private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');

  readonly sides: readonly DrawerSide[] = [
    'left',
    'right',
    'top',
    'bottom',
    'inline-start',
    'inline-end',
  ];
  readonly escape = signal(true);
  readonly backdropDismiss = signal(true);
  readonly presence = signal(true);
  readonly status = signal('Closed');

  open(side: DrawerSide): void {
    const ref: DialogRef = this.drawers.open(this.tpl(), this.vcr, {
      side,
      closeOnEscape: this.escape(),
      closeOnBackdropClick: this.backdropDismiss(),
      presence: this.presence(),
      panelClass: 'd16-drawer',
      backdropClass: 'd16-backdrop',
    });
    this.status.set(`Open on ${side}`);
    ref.closed$.subscribe(() => this.status.set('Closed'));
  }
}

@Component({
  selector: 'app-resizable-demo',
  standalone: true,
  imports: [SplitterContainerDirective, SplitterHandleDirective, SplitterPanelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: DEMO_STYLES,
  template: `
    <p>
      Horizontal, 20–80 %, 10 % keyboard step. Drag the bar or focus it and use the arrow keys, Home
      and End.
    </p>
    <div
      class="d16-split"
      qzSplitterContainer
      [minSize]="20"
      [maxSize]="80"
      [step]="10"
      [defaultPosition]="40"
      (positionChange)="horizontal.set($event)"
    >
      <div qzSplitterPanel>Navigator</div>
      <div class="d16-handle" qzSplitterHandle aria-label="Resize navigator"></div>
      <div [qzSplitterPanel]="false">Editor</div>
    </div>
    <output>Navigator: {{ horizontal() }} %</output>

    <p>Vertical.</p>
    <div
      class="d16-split d16-split-v"
      qzSplitterContainer
      orientation="vertical"
      [minSize]="20"
      [maxSize]="80"
      [step]="5"
    >
      <div qzSplitterPanel>Preview</div>
      <div class="d16-handle" qzSplitterHandle aria-label="Resize preview"></div>
      <div [qzSplitterPanel]="false">Console</div>
    </div>

    <p>Right-to-left: the primary panel sits on the right, arrows and pointer mirror.</p>
    <div class="d16-split" dir="rtl" qzSplitterContainer [minSize]="20" [maxSize]="80" [step]="10">
      <div qzSplitterPanel>الأول</div>
      <div class="d16-handle" qzSplitterHandle aria-label="تغيير الحجم"></div>
      <div [qzSplitterPanel]="false">الثاني</div>
    </div>
  `,
})
export class ResizableDemoComponent {
  readonly horizontal = signal(40);
}

@Component({
  selector: 'app-tooltip-arrow-demo',
  standalone: true,
  imports: [TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles:
    DEMO_STYLES +
    `
    .qz-tooltip[data-side] { background: #1e1e2a; color: #e5e5ee; padding: 0.4rem 0.7rem; border-radius: 6px; font-size: 0.85rem; }
    .qz-tooltip[data-side]::after { content: ''; position: absolute; width: 8px; height: 8px; background: inherit; transform: rotate(45deg); }
    .qz-tooltip[data-side='top']::after { bottom: -4px; left: var(--qz-arrow-x); }
    .qz-tooltip[data-side='bottom']::after { top: -4px; left: var(--qz-arrow-x); }
    .qz-tooltip[data-side='left']::after { right: -4px; top: var(--qz-arrow-y); }
    .qz-tooltip[data-side='right']::after { left: -4px; top: var(--qz-arrow-y); }
    .qz-tooltip[data-qz-arrow='hidden']::after { display: none; }
  `,
  template: `
    <div class="d16">
      @for (p of placements; track p) {
        <button
          type="button"
          [qzTooltip]="p + ' tooltip'"
          [tooltipPlacement]="p"
          [tooltipArrowSize]="8"
          [tooltipArrowPadding]="6"
        >
          {{ p }}
        </button>
      }
    </div>
    <div class="d16">
      <button
        type="button"
        [qzTooltip]="rich"
        tooltipPlacement="bottom"
        [tooltipArrowSize]="10"
        #tip="qzTooltip"
      >
        Template content
      </button>
      <output>Resolved placement: {{ tip.resolvedPlacement() ?? '—' }}</output>
    </div>
    <ng-template #rich let-arrow="arrow" let-placement="placement">
      <div class="d16-surface">
        Arrow is on the <strong>{{ arrow()?.edge ?? '—' }}</strong> edge ({{ placement() }})
        @if (arrow()?.available) {
          <i
            class="d16-arrow"
            [style.left.px]="arrow()!.offset"
            [style.top.px]="arrow()!.edge === 'top' ? -6 : null"
            [style.bottom.px]="arrow()!.edge === 'bottom' ? -6 : null"
          ></i>
        }
      </div>
    </ng-template>
  `,
})
export class TooltipArrowDemoComponent {
  readonly placements: readonly OverlayPlacement[] = ['top', 'bottom', 'left', 'right'];
}

@Component({
  selector: 'app-popover-arrow-demo',
  standalone: true,
  imports: [PopoverTriggerDirective, PopoverDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: DEMO_STYLES,
  template: `
    <div class="d16">
      @for (p of placements; track p) {
        <button
          type="button"
          qzPopoverTrigger
          [popover]="tpl"
          [placement]="p"
          [arrowSize]="10"
          [arrowPadding]="8"
          [closeOnEscape]="true"
        >
          {{ p }}
        </button>
      }
    </div>
    <ng-template #tpl let-arrow="arrow" let-placement="placement">
      <div qzPopover class="d16-surface">
        <p>
          Placed <strong>{{ placement() }}</strong
          >.
        </p>
        <button type="button">Interactive content</button>
        @if (arrow()?.available) {
          <i class="d16-arrow" [style]="arrowStyle(arrow()!)"></i>
        }
      </div>
    </ng-template>
  `,
})
export class PopoverArrowDemoComponent {
  readonly placements: readonly OverlayPlacement[] = ['top', 'bottom', 'left', 'right'];

  /** Pins the arrow to the surface edge facing the anchor, at the computed cross-axis offset. */
  arrowStyle(arrow: OverlayArrowGeometry): Record<string, string> {
    const along = `${arrow.offset ?? 0}px`;
    return {
      [arrow.edge]: '-6px',
      [arrow.axis === 'x' ? 'left' : 'top']: along,
    };
  }
}

@Component({
  selector: 'app-menu-groups-demo',
  standalone: true,
  imports: [
    MenuTriggerDirective,
    MenuDirective,
    MenuGroupDirective,
    MenuLabelDirective,
    MenuItemDirective,
    MenuSeparatorDirective,
    MenuCheckboxItemDirective,
    MenuRadioGroupDirective,
    MenuRadioItemDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: DEMO_STYLES,
  template: `
    <div class="d16">
      <button type="button" qzMenuTrigger [menu]="menu">Workspace</button>
      <output>{{ last() }}</output>
    </div>
    <ng-template #menu>
      <div qzMenu class="d16-menu" aria-label="Workspace">
        <div qzMenuGroup>
          <div qzMenuLabel>Account</div>
          <button qzMenuItem (selected)="last.set('Profile')">Profile</button>
          <button qzMenuItem [disabled]="true">Billing</button>
        </div>
        <div qzMenuSeparator></div>
        <div qzMenuGroup>
          <div qzMenuLabel>View</div>
          <button qzMenuCheckboxItem [(checked)]="toolbar">Show toolbar</button>
        </div>
        <div qzMenuSeparator></div>
        <div qzMenuRadioGroup [(value)]="density">
          <div qzMenuLabel>Density</div>
          <button qzMenuRadioItem value="compact">Compact</button>
          <button qzMenuRadioItem value="comfortable">Comfortable</button>
        </div>
        <div qzMenuSeparator></div>
        <button qzMenuItem [submenu]="share">Share…</button>
        <ng-template #share>
          <div qzMenu class="d16-menu" aria-label="Share">
            <button qzMenuItem (selected)="last.set('Email')">Email</button>
            <button qzMenuItem (selected)="last.set('Link')">Copy link</button>
          </div>
        </ng-template>
      </div>
    </ng-template>
  `,
})
export class MenuGroupsDemoComponent {
  readonly last = signal('Nothing selected');
  readonly toolbar = signal(true);
  readonly density = signal<string | null>('comfortable');
}
