import {
  Component,
  ChangeDetectionStrategy,
  signal,
  viewChild,
  TemplateRef,
  ViewContainerRef,
  inject,
  ElementRef,
} from '@angular/core';
import {
  OverlayTriggerDirective,
  OverlayService,
  OverlayRef,
} from '../../../../packages/quartz/src/lib/overlay';
import { OverlayPlacement } from '../../../../packages/quartz/src/lib/overlay';

@Component({
  selector: 'app-overlay-demo',
  imports: [OverlayTriggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="demo-page">
      <header class="demo-header">
        <div class="demo-header__inner">
          <div class="demo-header__badge">Quartz UI</div>
          <h1 class="demo-header__title">Overlay</h1>
          <p class="demo-header__desc">
            Headless portal primitive — anchor-based positioning, auto-flip, click-outside &amp;
            scroll close.
          </p>
        </div>
      </header>

      <main class="demo-main">
        <!-- ── Dropdown ── -->
        <section class="demo-section">
          <div class="demo-section__meta">
            <span class="demo-section__tag">dropdown</span>
            <h2 class="demo-section__title">Menu dropdown</h2>
            <p class="demo-section__hint">Click outside, Escape, or scroll to close</p>
          </div>

          <div class="demo-row">
            <button
              qzOverlayTrigger
              [overlayTemplate]="dropdownTpl"
              placement="bottom-start"
              [matchAnchorWidth]="false"
              class="btn btn--primary"
            >
              Open menu
              <span class="btn__chevron">▾</span>
            </button>
          </div>

          <ng-template #dropdownTpl>
            <div class="dropdown">
              <div class="dropdown__section-label">Actions</div>
              @for (item of menuItems; track item.label) {
                <button class="dropdown__item" [class.dropdown__item--danger]="item.danger">
                  <span class="dropdown__item-icon">{{ item.icon }}</span>
                  <span class="dropdown__item-label">{{ item.label }}</span>
                  @if (item.shortcut) {
                    <kbd class="dropdown__shortcut">{{ item.shortcut }}</kbd>
                  }
                </button>
              }
            </div>
          </ng-template>
        </section>

        <!-- ── Placements ── -->
        <section class="demo-section">
          <div class="demo-section__meta">
            <span class="demo-section__tag">placements</span>
            <h2 class="demo-section__title">Auto-flip & placement</h2>
            <p class="demo-section__hint">
              Flip is enabled — the overlay switches side when near the viewport edge
            </p>
          </div>

          <div class="placement-grid">
            @for (p of placements; track p) {
              <button
                qzOverlayTrigger
                [overlayTemplate]="placementTpl"
                [placement]="p"
                [flip]="true"
                class="btn btn--ghost btn--sm"
              >
                {{ p }}
              </button>
            }
          </div>

          <ng-template #placementTpl>
            <div class="popover">
              <div class="popover__arrow"></div>
              <strong class="popover__title">Popover</strong>
              <p class="popover__text">This is an overlay positioned with flip enabled.</p>
            </div>
          </ng-template>
        </section>

        <!-- ── Match width ── -->
        <section class="demo-section">
          <div class="demo-section__meta">
            <span class="demo-section__tag">match width</span>
            <h2 class="demo-section__title">Select / combobox pattern</h2>
            <p class="demo-section__hint">
              matchAnchorWidth — overlay stretches to the trigger width
            </p>
          </div>

          <div class="demo-row">
            <button
              qzOverlayTrigger
              [overlayTemplate]="selectTpl"
              placement="bottom-start"
              [matchAnchorWidth]="true"
              class="btn btn--select"
            >
              <span>{{ selectedOption() }}</span>
              <span class="btn__chevron">▾</span>
            </button>
          </div>

          <ng-template #selectTpl>
            <div class="select-list">
              @for (opt of selectOptions; track opt) {
                <button
                  class="select-list__item"
                  [class.select-list__item--active]="selectedOption() === opt"
                  (click)="selectedOption.set(opt)"
                >
                  {{ opt }}
                </button>
              }
            </div>
          </ng-template>
        </section>

        <!-- ── Programmatic ── -->
        <section class="demo-section">
          <div class="demo-section__meta">
            <span class="demo-section__tag">programmatic</span>
            <h2 class="demo-section__title">OverlayService direct usage</h2>
            <p class="demo-section__hint">
              Create an OverlayRef manually — useful for tooltips on dynamic content
            </p>
          </div>

          <div class="demo-row">
            <button #progAnchor class="btn btn--secondary" (click)="toggleProgrammatic()">
              {{ progRef?.isOpen ? 'Close overlay' : 'Open overlay' }}
            </button>
          </div>

          <ng-template #progTpl>
            <div class="notification">
              <span class="notification__icon">✦</span>
              <div>
                <strong>Programmatic overlay</strong>
                <p>Created via OverlayService.create() — no directive needed on the trigger.</p>
              </div>
            </div>
          </ng-template>
        </section>
      </main>
    </div>
  `,
  styles: [
    `
      /* ── Page ── */
      .demo-page {
        min-height: 100vh;
        background: #f4f4f6;
        font-family: 'Inter', system-ui, sans-serif;
      }

      /* ── Header ── */
      .demo-header {
        background: #0f0f13;
        padding: 2.5rem 2rem 2rem;
      }
      .demo-header__inner {
        max-width: 860px;
        margin: 0 auto;
      }
      .demo-header__badge {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #a78bfa;
        background: #1e1430;
        border: 1px solid #4c1d95;
        border-radius: 4px;
        padding: 0.2rem 0.55rem;
        margin-bottom: 0.75rem;
      }
      .demo-header__title {
        font-size: 2rem;
        font-weight: 800;
        color: #fff;
        margin: 0 0 0.5rem;
        letter-spacing: -0.03em;
      }
      .demo-header__desc {
        color: #6b7280;
        font-size: 0.9rem;
        margin: 0;
      }

      /* ── Main ── */
      .demo-main {
        max-width: 860px;
        margin: 0 auto;
        padding: 2.5rem 2rem;
        display: flex;
        flex-direction: column;
        gap: 3rem;
      }

      /* ── Section ── */
      .demo-section__meta {
        margin-bottom: 1rem;
      }
      .demo-section__tag {
        display: inline-block;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #7c3aed;
        background: #ede9fe;
        border-radius: 4px;
        padding: 0.15rem 0.5rem;
        margin-bottom: 0.4rem;
      }
      .demo-section__title {
        font-size: 1.1rem;
        font-weight: 700;
        color: #111827;
        margin: 0 0 0.2rem;
      }
      .demo-section__hint {
        font-size: 0.8rem;
        color: #9ca3af;
        margin: 0;
      }

      .demo-row {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        align-items: center;
      }

      /* ── Buttons ── */
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        border: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        padding: 0.55rem 1rem;
        cursor: pointer;
        transition:
          background 0.15s,
          box-shadow 0.15s;
        white-space: nowrap;
      }
      .btn--primary {
        background: #7c3aed;
        color: #fff;
      }
      .btn--primary:hover {
        background: #6d28d9;
      }
      .btn--secondary {
        background: #fff;
        color: #374151;
        border: 1.5px solid #e5e7eb;
      }
      .btn--secondary:hover {
        background: #f9fafb;
      }
      .btn--ghost {
        background: #fff;
        color: #374151;
        border: 1.5px solid #e5e7eb;
      }
      .btn--ghost:hover {
        background: #f3f4f6;
      }
      .btn--ghost.qz-overlay-trigger--open {
        background: #ede9fe;
        border-color: #7c3aed;
        color: #7c3aed;
      }
      .btn--select {
        background: #fff;
        color: #374151;
        border: 1.5px solid #d1d5db;
        width: 240px;
        justify-content: space-between;
      }
      .btn--select:hover {
        border-color: #7c3aed;
      }
      .btn--sm {
        font-size: 0.78rem;
        padding: 0.35rem 0.7rem;
      }
      .btn__chevron {
        font-size: 0.75rem;
        opacity: 0.6;
      }

      /* ── Placement grid ── */
      .placement-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      /* ── Dropdown ── */
      .dropdown {
        background: #fff;
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        padding: 0.4rem;
        min-width: 200px;
      }
      .dropdown__section-label {
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #9ca3af;
        padding: 0.3rem 0.6rem 0.5rem;
      }
      .dropdown__item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        width: 100%;
        padding: 0.55rem 0.6rem;
        border: none;
        background: transparent;
        border-radius: 6px;
        font-size: 0.875rem;
        color: #111827;
        cursor: pointer;
        text-align: left;
        transition: background 0.1s;
      }
      .dropdown__item:hover {
        background: #f3f4f6;
      }
      .dropdown__item--danger {
        color: #dc2626;
      }
      .dropdown__item--danger:hover {
        background: #fef2f2;
      }
      .dropdown__item-icon {
        font-size: 1rem;
        width: 1.2rem;
        text-align: center;
      }
      .dropdown__item-label {
        flex: 1;
        font-weight: 500;
      }
      .dropdown__shortcut {
        font-size: 0.7rem;
        color: #9ca3af;
        background: #f3f4f6;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        padding: 0.1rem 0.35rem;
        font-family: inherit;
      }

      /* ── Popover ── */
      .popover {
        background: #0f0f13;
        color: #e5e7eb;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        max-width: 200px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      }
      .popover__title {
        display: block;
        font-size: 0.85rem;
        font-weight: 700;
        color: #fff;
        margin-bottom: 0.25rem;
      }
      .popover__text {
        font-size: 0.78rem;
        color: #9ca3af;
        margin: 0;
        line-height: 1.5;
      }

      /* ── Select list ── */
      .select-list {
        background: #fff;
        border: 1.5px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
        overflow: hidden;
      }
      .select-list__item {
        display: block;
        width: 100%;
        padding: 0.6rem 0.875rem;
        border: none;
        background: transparent;
        font-size: 0.875rem;
        color: #111827;
        cursor: pointer;
        text-align: left;
        transition: background 0.1s;
      }
      .select-list__item:hover {
        background: #f9fafb;
      }
      .select-list__item--active {
        background: #ede9fe;
        color: #7c3aed;
        font-weight: 600;
      }

      /* ── Notification ── */
      .notification {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        background: #fff;
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        padding: 1rem 1.25rem;
        max-width: 320px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
      }
      .notification__icon {
        color: #7c3aed;
        font-size: 1.1rem;
        margin-top: 0.1rem;
      }
      .notification strong {
        display: block;
        font-size: 0.875rem;
        color: #111827;
        margin-bottom: 0.2rem;
      }
      .notification p {
        font-size: 0.8rem;
        color: #6b7280;
        margin: 0;
        line-height: 1.5;
      }
    `,
  ],
})
export class OverlayDemo {
  private overlayService = inject(OverlayService);
  private viewContainerRef = inject(ViewContainerRef);

  // Programmatic overlay
  readonly progAnchor = viewChild<ElementRef<HTMLElement>>('progAnchor');
  readonly progTpl = viewChild<TemplateRef<unknown>>('progTpl');
  progRef: OverlayRef | null = null;

  selectedOption = signal('Choose an option…');

  readonly placements: OverlayPlacement[] = [
    'top-start',
    'top',
    'top-end',
    'bottom-start',
    'bottom',
    'bottom-end',
    'left-start',
    'left',
    'left-end',
    'right-start',
    'right',
    'right-end',
  ];

  readonly menuItems = [
    { icon: '✏️', label: 'Edit', shortcut: '⌘E', danger: false },
    { icon: '📋', label: 'Duplicate', shortcut: '⌘D', danger: false },
    { icon: '🔗', label: 'Copy link', shortcut: null, danger: false },
    { icon: '🗑️', label: 'Delete', shortcut: '⌫', danger: true },
  ];

  readonly selectOptions = ['Design system', 'Frontend', 'Backend', 'DevOps', 'Product'];

  toggleProgrammatic(): void {
    const anchor = this.progAnchor()?.nativeElement;
    const tpl = this.progTpl();
    if (!anchor || !tpl) return;

    if (this.progRef?.isOpen) {
      this.progRef.close();
      return;
    }

    this.progRef?.destroy();
    this.progRef = this.overlayService.create(tpl, this.viewContainerRef, anchor, {
      placement: 'bottom-start',
      offset: 8,
    });
    this.progRef.closed$.subscribe(() => {
      // triggers CD in demo — in real app use signals or cdr
    });
    this.progRef.open();
  }
}
