import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewContainerRef,
  afterNextRender,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  DialogService,
  MenuDirective,
  MenuItemDirective,
  MenuTriggerDirective,
  NavigationMenuContentDirective,
  NavigationMenuDirective,
  NavigationMenuItemDirective,
  NavigationMenuLinkDirective,
  NavigationMenuTriggerDirective,
  PopoverDirective,
  PopoverTriggerDirective,
  SelectContentDirective,
  SelectDirective,
  SelectListboxDirective,
  SelectOptionDirective,
  SelectTriggerDirective,
  ToastContainerComponent,
  TooltipDirective,
  ToastService,
  type DialogRef,
} from '@quartz-headless/primitives';

/**
 * Browser-contract fixture for Quartz 0.8 floating-surface composition (Dialog / Menu / Popover /
 * Select / Toast). Not documentation: it exists so Playwright can assert real focus, modal
 * isolation and cleanup. Intentionally unstyled apart from the structural rules the assertions
 * need.
 */
@Component({
  selector: 'app-e2e-floating',
  imports: [
    MenuDirective,
    MenuItemDirective,
    MenuTriggerDirective,
    NavigationMenuDirective,
    NavigationMenuItemDirective,
    NavigationMenuTriggerDirective,
    NavigationMenuContentDirective,
    NavigationMenuLinkDirective,
    PopoverDirective,
    PopoverTriggerDirective,
    SelectContentDirective,
    SelectDirective,
    SelectListboxDirective,
    SelectOptionDirective,
    SelectTriggerDirective,
    ToastContainerComponent,
    TooltipDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Behaviour fixture: rendered on the client only (it queries ViewContainerRefs on elements).
  host: { ngSkipHydration: 'true' },
  template: `
    <main
      id="app"
      [attr.data-ready]="ready() ? '' : null"
      style="padding: 24px; min-height: 1600px"
    >
      <h1>Floating composition</h1>
      <p id="state">{{ log() }}</p>
      <p id="closed">{{ closed() }}</p>

      <section id="host-section">
        @if (hostAlive()) {
          <button #hostBtn id="open-x" type="button" (click)="openX()">Open X</button>
        }
        <button id="restore-host" type="button" (click)="hostAlive.set(true)">Restore host</button>
      </section>

      <section>
        <input id="bg-input" type="text" aria-label="Background input" />
        <button id="bg-button" type="button" (click)="bgClicks.set(bgClicks() + 1)">
          Background
        </button>
        <span id="bg-clicks">{{ bgClicks() }}</span>
        <button id="bg-toast" type="button" (click)="toast.info('Background toast', 'Info')">
          Toast
        </button>
      </section>

      <!-- Popover left open before any dialog: not owned by a modal opened later. -->
      <section>
        <button
          id="bg-pop-trigger"
          type="button"
          qzPopoverTrigger
          [popover]="bgPop"
          [closeOnClickOutside]="false"
          [closeOnEscape]="false"
        >
          Pre-existing popover
        </button>
      </section>

      <section>
        <p id="tip-help">Existing description</p>
        <button id="tip-trigger" type="button" qzTooltip="Tip text" aria-describedby="tip-help">
          Tooltip trigger
        </button>
      </section>

      <aside id="pre-hidden" aria-hidden="true">Pre-hidden</aside>
      <section id="pre-inert" inert>Pre-inert</section>

      <section dir="rtl" id="rtl-section">
        <button id="rtl-menu-trigger" type="button" qzMenuTrigger [menu]="rtlMenu">RTL menu</button>
      </section>
    </main>

    <qz-toast-container />

    <ng-template #bgPop>
      <div id="bg-pop-content" style="background: white; padding: 8px">Pre-existing</div>
    </ng-template>

    <ng-template #rtlMenu>
      <div qzMenu dir="rtl" id="rtl-menu" style="background: white">
        <button qzMenuItem id="rtl-more" [submenu]="rtlSub">More</button>
        <button qzMenuItem id="rtl-plain">Plain</button>
        <ng-template #rtlSub>
          <div qzMenu dir="rtl" id="rtl-sub" style="background: white">
            <button qzMenuItem id="rtl-sub-item">Nested</button>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #xTpl let-ref let-labelledBy="ariaLabelledBy">
      <div id="x-content" style="background: white; padding: 16px">
        <h2 [id]="labelledBy">Dialog X</h2>
        <input id="x-first" type="text" aria-label="X first" />
        <nav qzNavigationMenu aria-label="Dialog site navigation">
          <ul>
            <li qzNavigationMenuItem="inside">
              <button id="x-navigation-trigger" qzNavigationMenuTrigger>Navigation</button>
              <ng-template qzNavigationMenuContent>
                <div>
                  <a id="x-navigation-link" href="#inside" qzNavigationMenuLink>Inside link</a>
                </div>
              </ng-template>
            </li>
          </ul>
        </nav>
        <button id="x-menu-trigger" type="button" qzMenuTrigger [menu]="xMenu">Menu</button>
        <button id="x-pop-trigger" type="button" qzPopoverTrigger [popover]="xPop">Popover</button>
        <div qzSelect #sel="qzSelect" [(value)]="selected">
          <button id="x-select-trigger" type="button" qzSelectTrigger>
            {{ sel.selectedLabel() || 'Choose' }}
          </button>
          <ng-template qzSelectContent>
            <div qzSelectListbox id="x-listbox" style="background: white">
              <button id="x-opt-a" type="button" qzSelectOption="a">Option A</button>
              <button id="x-opt-b" type="button" qzSelectOption="b">Option B</button>
            </div>
          </ng-template>
        </div>
        <button id="x-open-y" type="button" (click)="openY()">Open Y</button>
        <button id="x-toast" type="button" (click)="toast.success('Saved', 'Done')">Toast</button>
        <button id="x-destroy-host" type="button" (click)="hostAlive.set(false)">
          Destroy host
        </button>
        <button id="x-close" type="button" (click)="ref.close()">Close</button>
      </div>
    </ng-template>

    <ng-template #yTpl let-ref>
      <div id="y-content" style="background: white; padding: 16px">
        <h2 id="y-title">Dialog Y</h2>
        <input id="y-first" type="text" aria-label="Y first" />
        <button id="y-menu-trigger" type="button" qzMenuTrigger [menu]="yMenu">Menu</button>
        <button id="y-close" type="button" (click)="ref.close()">Close</button>
      </div>
    </ng-template>

    <ng-template #xMenu>
      <div qzMenu id="x-menu" style="background: white">
        <button qzMenuItem id="x-menu-item-1" (selected)="log.set('x-menu-item-1')">One</button>
        <button qzMenuItem id="x-menu-item-2" [closeOnSelect]="false">Keep open</button>
      </div>
    </ng-template>

    <ng-template #yMenu>
      <div qzMenu id="y-menu" style="background: white">
        <button qzMenuItem id="y-menu-item-1" (selected)="log.set('y-menu-item-1')">One</button>
      </div>
    </ng-template>

    <ng-template #xPop>
      <div qzPopover id="x-pop-content" style="background: white; padding: 8px">
        <button id="x-pop-inside" type="button">Inside popover</button>
      </div>
    </ng-template>
  `,
})
export default class E2eFloatingPage {
  private readonly platformId = inject(PLATFORM_ID);
  readonly ready = signal(false);
  readonly toast = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  private readonly vcr = inject(ViewContainerRef);

  private readonly xTpl = viewChild.required<TemplateRef<unknown>>('xTpl');
  private readonly hostVcr = viewChild('hostBtn', { read: ViewContainerRef });
  private readonly yTpl = viewChild.required<TemplateRef<unknown>>('yTpl');

  readonly log = signal('');
  readonly bgClicks = signal(0);
  readonly hostAlive = signal(true);
  readonly selected = signal<string | null>(null);
  readonly closed = signal('');

  constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) this.ready.set(true);
    });
  }

  openX(): void {
    this.track(this.dialogs.open(this.xTpl(), this.hostVcr() ?? this.vcr, { width: '360px' }), 'X');
  }

  openY(): void {
    this.track(
      this.dialogs.open(this.yTpl(), this.vcr, { width: '320px', ariaLabelledBy: 'y-title' }),
      'Y',
    );
  }

  private track(ref: DialogRef, name: string): void {
    ref.closed$.subscribe(() => this.closed.update((value) => `${value}${name};`));
  }
}
