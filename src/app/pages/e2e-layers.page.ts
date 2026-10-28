import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { DialogService, type DialogRef } from '@quartz-headless/primitives';
import {
  CollectionStore,
  OverlayTriggerDirective,
  ViewportService,
  type CollectionItem,
} from '@quartz-headless/core';

/**
 * Browser-contract fixture for Core layer composition, overlay geometry and Collection recovery.
 * Not documentation: it exists so Playwright can assert real focus, geometry and key handling.
 * Intentionally unstyled apart from the structural rules geometry assertions need.
 */
@Component({
  selector: 'app-e2e-layers',
  imports: [OverlayTriggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Behaviour fixture: rendered on the client only (it queries ViewContainerRefs on elements).
  host: { ngSkipHydration: 'true' },
  template: `
    <main [attr.data-ready]="ready() ? '' : null" style="padding: 24px; min-height: 2000px">
      <h1>Core layer contracts</h1>

      <section>
        <button id="open-a" type="button" (click)="openA()">Open A</button>
        <span id="dialog-log">{{ log() }}</span>
      </section>

      <section style="margin-top: 24px">
        <button
          id="geo-anchor"
          type="button"
          qzOverlayTrigger
          #geo="qzOverlay"
          [overlayTemplate]="geoTpl"
          [closeOnScroll]="false"
          placement="bottom-end"
          [style.width.px]="anchorWidth()"
        >
          Geometry anchor
        </button>
        <button id="geo-grow" type="button" (click)="anchorWidth.set(300)">Grow anchor</button>
        <button id="geo-remove-anchor" type="button" (click)="showAnchor.set(false)">
          Remove anchor
        </button>
        @if (showAnchor()) {
          <button
            id="doomed-anchor"
            type="button"
            qzOverlayTrigger
            [overlayTemplate]="geoTpl"
            (closed)="doomedClosed.set(doomedClosed() + 1)"
          >
            Doomed trigger
          </button>
        }
        <span id="doomed-closed">{{ doomedClosed() }}</span>
        <span id="viewport-size">{{ viewport.width() }}x{{ viewport.height() }}</span>
      </section>

      <section style="margin-top: 24px">
        <div id="collection" role="listbox" tabindex="-1" (keydown)="onCollectionKey($event)">
          @for (item of collectionItems(); track item.id) {
            <button
              type="button"
              role="option"
              [id]="'col-' + item.id"
              [attr.tabindex]="store.activeTabIndex(item.id)"
              [attr.data-active]="store.activeId() === item.id"
              (focus)="store.setActive(item.id)"
            >
              {{ item.id }}
            </button>
          }
        </div>
        <button id="col-remove-active" type="button" (click)="removeActive()">Remove active</button>
        <span id="col-active">{{ store.activeId() }}</span>
      </section>
    </main>

    <ng-template #aTpl let-ref>
      <div id="dialog-a-content" style="background: white; padding: 16px">
        <input id="a-first" type="text" aria-label="A first" />
        <button id="open-b" type="button" (click)="openB()">Open B</button>
        <input id="a-last" type="text" aria-label="A last" />
      </div>
    </ng-template>

    <ng-template #bTpl let-ref>
      <div id="dialog-b-content" style="background: white; padding: 16px">
        <input id="b-first" type="text" aria-label="B first" />
        <button
          id="popup-trigger"
          type="button"
          qzOverlayTrigger
          [overlayTemplate]="popupTpl"
          [closeOnScroll]="false"
        >
          Popup
        </button>
        <input id="b-last" type="text" aria-label="B last" />
      </div>
    </ng-template>

    <ng-template #popupTpl>
      <div id="popup-content" style="background: white; padding: 8px">
        <button id="popup-item" type="button">Popup item</button>
      </div>
    </ng-template>

    <ng-template #geoTpl>
      <div id="geo-content" style="background: white; width: 120px; height: 40px">Overlay</div>
    </ng-template>
  `,
})
export default class E2eLayersPage implements OnDestroy {
  readonly ready = signal(false);
  readonly viewport = inject(ViewportService);
  private readonly _dialogs = inject(DialogService);
  private readonly _vcr = inject(ViewContainerRef);

  private readonly _aTpl = viewChild.required<TemplateRef<unknown>>('aTpl');
  private readonly _bTpl = viewChild.required<TemplateRef<unknown>>('bTpl');

  readonly log = signal('');
  readonly anchorWidth = signal(120);
  readonly showAnchor = signal(true);
  readonly doomedClosed = signal(0);

  private readonly _doc = inject(DOCUMENT);
  private readonly _platformId = inject(PLATFORM_ID);
  readonly store = new CollectionStore<CollectionItem>(
    { focusStrategy: 'roving-tabindex', orientation: 'vertical' },
    this._doc,
  );
  readonly collectionItems = signal<CollectionItem[]>(
    ['one', 'two', 'three', 'four'].map((id) => ({
      id,
      label: id,
      element: () => this._doc.getElementById(`col-${id}`),
    })),
  );

  constructor() {
    if (isPlatformBrowser(this._platformId)) this.ready.set(true);
    this.collectionItems().forEach((item) => this.store.register(item));
  }

  openA(): void {
    this.track(this._dialogs.open(this._aTpl(), this._vcr, { width: '320px' }), 'A');
  }

  openB(): void {
    this.track(this._dialogs.open(this._bTpl(), this._vcr, { width: '280px' }), 'B');
  }

  onCollectionKey(event: KeyboardEvent): void {
    this.store.handleKeydown(event, { focus: true });
  }

  removeActive(): void {
    const active = this.store.activeItem();
    if (!active) return;
    this.store.unregister(active);
    this.collectionItems.update((items) => items.filter((item) => item !== active));
  }

  ngOnDestroy(): void {
    this.store.destroy();
  }

  private track(ref: DialogRef, name: string): void {
    ref.closed$.subscribe(() => this.log.update((value) => `${value}${name}-closed;`));
  }
}
