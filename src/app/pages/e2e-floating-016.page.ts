import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  TemplateRef,
  ViewContainerRef,
  ViewEncapsulation,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  SplitterContainerDirective,
  SplitterHandleDirective,
  SplitterPanelDirective,
} from '@quartz-headless/core';
import {
  DrawerService,
  MenuDirective,
  MenuGroupDirective,
  MenuItemDirective,
  MenuLabelDirective,
  MenuSeparatorDirective,
  MenuTriggerDirective,
  PopoverDirective,
  PopoverTriggerDirective,
  TooltipDirective,
  type DialogRef,
  type DrawerSide,
} from '@quartz-headless/primitives';

/**
 * Browser-contract fixture for Quartz 0.16 (Drawer, Resizable, Tooltip/Popover arrow geometry,
 * Menu groups). Not documentation: it exists so Playwright can assert real focus, pointer
 * capture, geometry and cleanup. Unstyled apart from the structural rules the assertions need.
 */
/** A component that owns its own ViewContainerRef: the drawer's host view dies with it. */
@Component({
  selector: 'app-e2e-drawer-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button id="open-on-host" type="button" (click)="open()">open on host</button>`,
})
export class DrawerHostComponent {
  private readonly drawers = inject(DrawerService);
  private readonly vcr = inject(ViewContainerRef);
  readonly template = input.required<TemplateRef<unknown>>();
  readonly drawerClosed = output<void>();

  open(): void {
    this.drawers
      .open(this.template(), this.vcr, { side: 'right' })
      .closed$.subscribe(() => this.drawerClosed.emit());
  }
}

@Component({
  selector: 'app-e2e-floating-016',
  imports: [
    DrawerHostComponent,
    SplitterContainerDirective,
    SplitterHandleDirective,
    SplitterPanelDirective,
    MenuDirective,
    MenuGroupDirective,
    MenuItemDirective,
    MenuLabelDirective,
    MenuSeparatorDirective,
    MenuTriggerDirective,
    PopoverDirective,
    PopoverTriggerDirective,
    TooltipDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: `
    [data-qz-drawer] {
      background: white;
      color: black;
      padding: 12px;
      box-sizing: border-box;
      opacity: 1;
      transition: opacity 120ms linear;
    }
    [data-qz-drawer][data-side='left'],
    [data-qz-drawer][data-side='right'] {
      width: 280px;
    }
    [data-qz-drawer][data-side='top'],
    [data-qz-drawer][data-side='bottom'] {
      height: 160px;
    }
    [data-qz-drawer][data-state='opening'],
    [data-qz-drawer][data-state='closing'] {
      opacity: 0;
    }
    [data-qz-drawer].slow {
      transition-duration: 600ms;
    }
    .rz-box {
      width: 400px;
      height: 80px;
      border: 1px solid;
    }
    .rz-box-v {
      width: 200px;
      height: 240px;
      border: 1px solid;
    }
    [qzSplitterHandle] {
      width: 8px;
      background: gray;
    }
    [qzSplitterHandle][aria-orientation='horizontal'] {
      width: auto;
      height: 8px;
    }
    [qzSplitterHandle]:focus-visible {
      outline: 2px solid blue;
    }
    .qz-tooltip,
    .tip-box {
      background: black;
      color: white;
      padding: 4px 8px;
      white-space: nowrap;
    }
    .anchor-field {
      position: relative;
      height: 120px;
    }
    .pop-box {
      background: white;
      border: 1px solid;
      padding: 8px;
      width: 160px;
      box-sizing: border-box;
    }
    .pop-arrow {
      position: absolute;
      width: 10px;
      height: 10px;
      background: red;
    }
    .menu-box {
      background: white;
      border: 1px solid;
      min-width: 160px;
    }
  `,
  template: `
    <main id="fx016" [attr.data-ready]="ready() ? '' : null">
      <h1>Floating 0.16 fixture</h1>
      <input id="bg-input" aria-label="Background input" />

      <section id="drawer-section" aria-label="Drawer">
        <button id="toggle-dir" type="button" (click)="toggleDir()">Toggle dir</button>
        @for (side of sides; track side) {
          <button [id]="'open-' + side" type="button" (click)="openDrawer(side)">
            {{ side }}
          </button>
        }
        <button id="open-no-esc" type="button" (click)="openDrawer('right', { esc: false })">
          no escape
        </button>
        <button
          id="open-no-backdrop"
          type="button"
          (click)="openDrawer('right', { backdrop: false })"
        >
          no backdrop dismiss
        </button>
        <button id="open-slow" type="button" (click)="openDrawer('left', { slow: true })">
          slow exit
        </button>
        @if (hostAlive()) {
          <app-e2e-drawer-host [template]="drawerTpl" (drawerClosed)="log.update(logClosed)" />
        }
        <button id="kill-host" type="button" (click)="hostAlive.set(false)">kill host</button>
        <output id="drawer-log">{{ log() }}</output>
        <output id="drawer-state">{{ state() }}</output>
      </section>

      <section id="rz-section" aria-label="Resizable">
        <div id="rz-h" class="rz-box" qzSplitterContainer [minSize]="20" [maxSize]="80" [step]="10">
          <div id="rz-h-a" qzSplitterPanel>A</div>
          <div id="rz-h-handle" qzSplitterHandle aria-label="Resize horizontal"></div>
          <div id="rz-h-b" [qzSplitterPanel]="false">B</div>
        </div>
        <div
          id="rz-rtl"
          class="rz-box"
          dir="rtl"
          qzSplitterContainer
          [minSize]="20"
          [maxSize]="80"
          [step]="10"
        >
          <div id="rz-rtl-a" qzSplitterPanel>A</div>
          <div id="rz-rtl-handle" qzSplitterHandle aria-label="Resize rtl"></div>
          <div id="rz-rtl-b" [qzSplitterPanel]="false">B</div>
        </div>
        <div
          id="rz-v"
          class="rz-box-v"
          qzSplitterContainer
          orientation="vertical"
          [minSize]="20"
          [maxSize]="80"
          [step]="10"
        >
          <div id="rz-v-a" qzSplitterPanel>A</div>
          <div id="rz-v-handle" qzSplitterHandle aria-label="Resize vertical"></div>
          <div id="rz-v-b" [qzSplitterPanel]="false">B</div>
        </div>
      </section>

      <section id="tip-section" aria-label="Tooltip">
        <button id="tip-move-top" type="button" (click)="anchorTop.set(4)">Anchor top</button>
        <button id="tip-move-mid" type="button" (click)="anchorTop.set(60)">Anchor middle</button>
        <button id="tip-wide" type="button" (click)="wide.set(!wide())">Toggle anchor width</button>
        <div class="anchor-field">
          <button
            id="tip-anchor"
            type="button"
            style="position: absolute; left: 120px"
            [style.top.px]="anchorTop()"
            [style.width.px]="wide() ? 200 : 60"
            qzTooltip="String tooltip"
            tooltipPlacement="top"
            [tooltipDelay]="0"
            [tooltipArrowSize]="10"
            [tooltipArrowPadding]="4"
            #tip="qzTooltip"
          >
            Tip
          </button>
          <button
            id="tip-tpl-anchor"
            type="button"
            style="position: absolute; left: 400px; top: 60px"
            [qzTooltip]="tipTpl"
            tooltipPlacement="bottom"
            [tooltipDelay]="0"
            [tooltipArrowSize]="10"
          >
            Tpl
          </button>
          <button
            id="tip-plain"
            type="button"
            style="position: absolute; left: 520px; top: 60px"
            qzTooltip="No arrow"
            [tooltipDelay]="0"
          >
            Plain
          </button>
        </div>
        <div id="in-scroll" style="height: 60px; overflow: auto">
          <div style="height: 200px">
            <button
              id="tip-scroll-anchor"
              type="button"
              qzTooltip="Scroll tip"
              [tooltipDelay]="0"
              [tooltipArrowSize]="10"
            >
              Scrolled
            </button>
          </div>
        </div>
        <output id="tip-arrow-state"
          >{{ tip.arrow()?.available }}|{{ tip.resolvedPlacement() }}</output
        >
        <ng-template #tipTpl let-arrow="arrow" let-placement="placement">
          <div
            id="tip-tpl"
            class="tip-box"
            style="position: relative"
            [attr.data-ctx]="placement()"
          >
            Template tooltip
            @if (arrow()?.available) {
              <i
                id="tip-tpl-arrow"
                class="pop-arrow"
                [style.left.px]="arrow()!.offset"
                [style.top.px]="arrow()!.edge === 'top' ? -5 : null"
                [style.bottom.px]="arrow()!.edge === 'bottom' ? -5 : null"
              ></i>
            }
          </div>
        </ng-template>
      </section>

      <section id="pop-section" aria-label="Popover" [attr.dir]="popDir()">
        <button id="pop-dir" type="button" (click)="popDir.set(popDir() === 'rtl' ? 'ltr' : 'rtl')">
          Toggle popover dir
        </button>
        <div class="anchor-field">
          <button
            id="pop-trigger"
            type="button"
            style="position: absolute"
            [style.top.px]="popTop()"
            [style.insetInlineStart.px]="40"
            qzPopoverTrigger
            [popover]="popTpl"
            [placement]="popPlacement()"
            [arrowSize]="10"
            [arrowPadding]="6"
            [(open)]="popOpen"
            #pop="qzPopoverTrigger"
          >
            Popover
          </button>
        </div>
        <button id="pop-flip" type="button" (click)="popTop.set(popTop() === 4 ? 100 : 4)">
          Move popover trigger
        </button>
        <button id="pop-place" type="button" (click)="popPlacement.set('bottom-start')">
          Place bottom-start
        </button>
        <button id="pop-left" type="button" (click)="popPlacement.set('top')">Place top</button>
        <output id="pop-state">{{ popOpen() }}|{{ pop.resolvedPlacement() }}</output>
        <ng-template #popTpl let-arrow="arrow" let-placement="placement">
          <div qzPopover id="pop-content" class="pop-box" style="position: relative">
            <button id="pop-inside" type="button">Inside</button>
            <span id="pop-ctx">{{ placement() }}</span>
            @if (arrow()?.available) {
              <i
                id="pop-arrow"
                class="pop-arrow"
                [style.left.px]="arrow()!.offset"
                [style.top.px]="arrow()!.edge === 'top' ? -5 : null"
                [style.bottom.px]="arrow()!.edge === 'bottom' ? -5 : null"
              ></i>
            }
          </div>
        </ng-template>
      </section>

      <section id="menu-section" aria-label="Menu">
        <button id="grp-trigger" type="button" qzMenuTrigger [menu]="grpMenu">Groups</button>
        <ng-template #grpMenu>
          <div id="grp-menu" qzMenu class="menu-box" aria-label="Group menu">
            <div qzMenuGroup id="grp-account">
              <div qzMenuLabel id="grp-account-label">Account</div>
              <button qzMenuItem id="grp-profile" type="button">Profile</button>
              <button qzMenuItem id="grp-billing" type="button" [disabled]="true">Billing</button>
            </div>
            <div qzMenuSeparator id="grp-sep"></div>
            <div qzMenuGroup id="grp-more">
              <div qzMenuLabel id="grp-more-label">More</div>
              <button qzMenuItem id="grp-share" type="button" [submenu]="grpSub">Share</button>
              <button qzMenuItem id="grp-signout" type="button">Sign out</button>
            </div>
            <ng-template #grpSub>
              <div id="grp-sub" qzMenu class="menu-box" aria-label="Share menu">
                <button qzMenuItem id="grp-email" type="button">Email</button>
              </div>
            </ng-template>
          </div>
        </ng-template>
      </section>
    </main>

    <ng-template
      #drawerTpl
      let-ref
      let-labelledBy="ariaLabelledBy"
      let-describedBy="ariaDescribedBy"
    >
      <h2 [id]="labelledBy">Drawer title</h2>
      <p [id]="describedBy">Drawer description</p>
      <button id="drawer-close" type="button" (click)="ref.close()">Close</button>
      <button id="drawer-pop-trigger" type="button" qzPopoverTrigger [popover]="drawerPop">
        Nested popover
      </button>
      <input id="drawer-input" aria-label="Drawer input" />
      <input id="drawer-input-2" aria-label="Second drawer input" />
    </ng-template>
    <ng-template #drawerPop>
      <div qzPopover id="drawer-pop-content" class="pop-box">
        <button id="drawer-pop-inside" type="button">Inside nested popover</button>
      </div>
    </ng-template>
  `,
})
export default class E2eFloating016Page {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly drawers = inject(DrawerService);
  private readonly vcr = inject(ViewContainerRef);
  private readonly drawerTpl = viewChild.required<TemplateRef<unknown>>('drawerTpl');

  readonly ready = signal(false);
  readonly sides: readonly DrawerSide[] = [
    'left',
    'right',
    'top',
    'bottom',
    'inline-start',
    'inline-end',
  ];
  readonly hostAlive = signal(true);
  readonly log = signal('');
  readonly state = signal('');

  readonly anchorTop = signal(60);
  readonly wide = signal(false);
  readonly popTop = signal(4);
  readonly popOpen = signal(false);
  readonly popDir = signal<'ltr' | 'rtl'>('ltr');
  readonly popPlacement = signal<'top' | 'bottom' | 'bottom-start'>('bottom');

  constructor() {
    if (isPlatformBrowser(this.platformId)) this.ready.set(true);
  }

  toggleDir(): void {
    const root = this.document.documentElement;
    root.setAttribute('dir', root.getAttribute('dir') === 'rtl' ? 'ltr' : 'rtl');
  }

  readonly logClosed = (value: string): string => `${value}closed;`;

  openDrawer(
    side: DrawerSide,
    options: { esc?: boolean; backdrop?: boolean; slow?: boolean } = {},
  ): DialogRef {
    const ref = this.drawers.open(this.drawerTpl(), this.vcr, {
      side,
      closeOnEscape: options.esc ?? true,
      closeOnBackdropClick: options.backdrop ?? true,
      panelClass: options.slow ? 'slow' : undefined,
    });
    this.state.set(ref.state());
    this.log.update((value) => `${value}open:${side};`);
    ref.closed$.subscribe(() => this.log.update((value) => `${value}closed;`));
    return ref;
  }
}
