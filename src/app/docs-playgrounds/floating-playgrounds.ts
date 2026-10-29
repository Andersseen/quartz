import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewContainerRef,
  ViewEncapsulation,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  SplitterContainerDirective,
  SplitterHandleDirective,
  SplitterPanelDirective,
  type OverlayPlacement,
  type SplitterOrientation,
} from '@quartz-headless/core';
import {
  DrawerService,
  PopoverDirective,
  PopoverTriggerDirective,
  TooltipDirective,
  type DrawerSide,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-drawer-playground',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: `
    .pg-drawer {
      background: #14141b;
      color: #e5e5ee;
      padding: 1rem;
      width: min(320px, 90vw);
      box-sizing: border-box;
      transition: opacity 160ms ease;
    }
    .pg-drawer[data-side='top'],
    .pg-drawer[data-side='bottom'] {
      width: auto;
      height: 200px;
    }
    .pg-drawer[data-state='opening'],
    .pg-drawer[data-state='closing'] {
      opacity: 0;
    }
  `,
  template: `<button type="button" (click)="open()">Open drawer</button>
    <output>{{ status() }}</output>
    <ng-template #tpl let-ref let-labelledBy="ariaLabelledBy">
      <h2 [id]="labelledBy">Drawer</h2>
      <input type="text" aria-label="Example field" />
      <button type="button" (click)="ref.close()">Close</button>
    </ng-template>`,
})
export class DrawerPlaygroundComponent {
  readonly side = input<DrawerSide>('inline-end');
  readonly closeOnEscape = input(true);
  readonly closeOnBackdropClick = input(true);
  readonly backdrop = input(true);
  readonly presence = input(true);
  readonly status = signal('Closed');
  private readonly drawers = inject(DrawerService);
  private readonly vcr = inject(ViewContainerRef);
  private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');

  open(): void {
    const ref = this.drawers.open(this.tpl(), this.vcr, {
      side: this.side(),
      closeOnEscape: this.closeOnEscape(),
      closeOnBackdropClick: this.closeOnBackdropClick(),
      backdrop: this.backdrop(),
      presence: this.presence(),
      panelClass: 'pg-drawer',
    });
    this.status.set(`Open (${ref.state()})`);
    ref.closed$.subscribe(() => this.status.set('Closed'));
  }
}

@Component({
  selector: 'app-resizable-playground',
  standalone: true,
  imports: [SplitterContainerDirective, SplitterHandleDirective, SplitterPanelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: `
    .pg-split {
      height: 160px;
      width: 100%;
      border: 1px solid #3a3a4a;
    }
    .pg-handle {
      background: #3a3a4a;
    }
    .pg-handle[aria-orientation='vertical'] {
      width: 6px;
    }
    .pg-handle[aria-orientation='horizontal'] {
      height: 6px;
    }
    .pg-handle:focus-visible,
    .pg-split[data-qz-resizing] .pg-handle {
      background: #6d6df0;
      outline: none;
    }
  `,
  template: `<div
      class="pg-split"
      qzSplitterContainer
      [dir]="rtl() ? 'rtl' : 'ltr'"
      [orientation]="orientation()"
      [minSize]="minSize()"
      [maxSize]="maxSize()"
      [step]="step()"
      [defaultPosition]="50"
      [disabled]="disabled()"
      (positionChange)="position.set($event)"
    >
      <div qzSplitterPanel>Primary</div>
      <div class="pg-handle" qzSplitterHandle aria-label="Resize panels"></div>
      <div [qzSplitterPanel]="false">Secondary</div>
    </div>
    <output>Primary: {{ position() }} %</output>`,
})
export class ResizablePlaygroundComponent {
  readonly orientation = input<SplitterOrientation>('horizontal');
  readonly minSize = input(20);
  readonly maxSize = input(80);
  readonly step = input(5);
  readonly rtl = input(false);
  readonly disabled = input(false);
  readonly position = signal(50);
}

@Component({
  selector: 'app-tooltip-arrow-playground',
  standalone: true,
  imports: [TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: `
    .pg-tip[data-side] {
      background: #1e1e2a;
      color: #e5e5ee;
      padding: 0.4rem 0.7rem;
      border-radius: 6px;
    }
    .pg-tip[data-side]::after {
      content: '';
      position: absolute;
      width: 8px;
      height: 8px;
      background: inherit;
      transform: rotate(45deg);
    }
    .pg-tip[data-side='top']::after {
      bottom: -4px;
      left: var(--qz-arrow-x);
    }
    .pg-tip[data-side='bottom']::after {
      top: -4px;
      left: var(--qz-arrow-x);
    }
    .pg-tip[data-side='left']::after {
      right: -4px;
      top: var(--qz-arrow-y);
    }
    .pg-tip[data-side='right']::after {
      left: -4px;
      top: var(--qz-arrow-y);
    }
    .pg-tip[data-qz-arrow='hidden']::after {
      display: none;
    }
  `,
  template: `<button
    type="button"
    qzTooltip="Tooltip with a CSS arrow"
    [tooltipPlacement]="placement()"
    [tooltipArrowSize]="arrowSize()"
    [tooltipArrowPadding]="arrowPadding()"
    [tooltipOffset]="offset()"
  >
    Hover or focus me
  </button>`,
})
export class TooltipArrowPlaygroundComponent {
  readonly placement = input<OverlayPlacement>('top');
  readonly arrowSize = input(8);
  readonly arrowPadding = input(6);
  readonly offset = input(10);
}

@Component({
  selector: 'app-popover-arrow-playground',
  standalone: true,
  imports: [PopoverTriggerDirective, PopoverDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button
      type="button"
      qzPopoverTrigger
      [popover]="tpl"
      [placement]="placement()"
      [arrowSize]="arrowSize()"
      [arrowPadding]="arrowPadding()"
      [closeOnEscape]="closeOnEscape()"
      [closeOnClickOutside]="closeOnClickOutside()"
      [(open)]="open"
    >
      Toggle popover
    </button>
    <output>open: {{ open() }}</output>
    <ng-template #tpl let-arrow="arrow" let-placement="placement">
      <div
        qzPopover
        style="position: relative; background: #1e1e2a; color: #e5e5ee; padding: 0.5rem 0.75rem; border-radius: 6px"
      >
        <button type="button">Action</button>
        <small>{{ placement() }}</small>
        @if (arrow()?.available) {
          <i
            style="position: absolute; width: 10px; height: 10px; background: #1e1e2a; transform: rotate(45deg)"
            [style.left.px]="arrow()!.axis === 'x' ? arrow()!.offset : null"
            [style.top.px]="
              arrow()!.axis === 'y' ? arrow()!.offset : arrow()!.edge === 'top' ? -5 : null
            "
            [style.bottom.px]="arrow()!.edge === 'bottom' ? -5 : null"
          ></i>
        }
      </div>
    </ng-template>`,
})
export class PopoverArrowPlaygroundComponent {
  readonly placement = input<OverlayPlacement>('bottom');
  readonly arrowSize = input(10);
  readonly arrowPadding = input(8);
  readonly closeOnEscape = input(true);
  readonly closeOnClickOutside = input(true);
  readonly open = signal(false);
}
