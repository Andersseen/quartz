import {
  Component,
  ChangeDetectionStrategy,
  signal,
  viewChild,
  TemplateRef,
  ViewContainerRef,
  ElementRef,
  inject,
} from '@angular/core';
import { OverlayTriggerDirective, OverlayService, OverlayRef, type OverlayPlacement } from 'quartz';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';

@Component({
  selector: 'app-overlay-page',
  standalone: true,
  imports: [OverlayTriggerDirective, DemoPageComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-demo-page
      badge="Primitive"
      title="Overlay"
      description="Portal-based positioning system with smart auto-flip, click-outside handling, and scroll management. Build dropdowns, popovers, and menus with full control."
      [features]="[
        { title: '12 Placements', description: 'All position combinations' },
        { title: 'Auto-flip', description: 'Smart viewport detection' },
        { title: 'Click Outside', description: 'Automatic close handling' },
        { title: 'Scroll Close', description: 'Close on scroll option' },
      ]"
    >
      <div class="demos">
        <!-- Dropdown Demo -->
        <section class="demo-section">
          <h2 class="demo-section__title">Menu Dropdown</h2>
          <p class="demo-section__desc">
            Classic dropdown menu with keyboard navigation support. Click outside, press Escape, or
            scroll to close.
          </p>

          <app-code-block [code]="dropdownCode">
            <div preview class="demo-preview">
              <button
                qzOverlayTrigger
                [overlayTemplate]="dropdownTpl"
                placement="bottom-start"
                class="btn btn--primary"
              >
                Open menu
                <span class="btn__chevron">▾</span>
              </button>

              <ng-template #dropdownTpl>
                <div class="dropdown">
                  <div class="dropdown__label">Actions</div>
                  @for (item of menuItems; track item.label) {
                    <button class="dropdown__item" [class.dropdown__item--danger]="item.danger">
                      <span>{{ item.icon }}</span>
                      <span class="dropdown__item-text">{{ item.label }}</span>
                      @if (item.shortcut) {
                        <kbd class="dropdown__shortcut">{{ item.shortcut }}</kbd>
                      }
                    </button>
                  }
                </div>
              </ng-template>
            </div>
          </app-code-block>
        </section>

        <!-- Placements Demo -->
        <section class="demo-section">
          <h2 class="demo-section__title">Auto-flip & Placements</h2>
          <p class="demo-section__desc">
            The overlay automatically flips when near viewport edges. Try scrolling or resizing the
            window.
          </p>

          <app-code-block [code]="placementsCode">
            <div preview class="demo-preview">
              <div class="placements-grid">
                @for (p of placements; track p) {
                  <button
                    qzOverlayTrigger
                    [overlayTemplate]="popoverTpl"
                    [placement]="p"
                    [flip]="true"
                    class="btn btn--ghost"
                  >
                    {{ p }}
                  </button>
                }
              </div>

              <ng-template #popoverTpl>
                <div class="popover">
                  <div class="popover__arrow"></div>
                  <strong>Popover</strong>
                  <p>Positioned with flip enabled</p>
                </div>
              </ng-template>
            </div>
          </app-code-block>
        </section>

        <!-- Select Demo -->
        <section class="demo-section">
          <h2 class="demo-section__title">Select / Combobox</h2>
          <p class="demo-section__desc">
            Match anchor width for select-like components. The overlay stretches to match the
            trigger width.
          </p>

          <app-code-block [code]="selectCode">
            <div preview class="demo-preview">
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
            </div>
          </app-code-block>
        </section>

        <!-- Programmatic Demo -->
        <section class="demo-section">
          <h2 class="demo-section__title">Programmatic Usage</h2>
          <p class="demo-section__desc">
            Create overlays programmatically using OverlayService. Useful for tooltips on dynamic
            content.
          </p>

          <app-code-block [code]="programmaticCode">
            <div preview class="demo-preview">
              <button #progAnchor class="btn btn--secondary" (click)="toggleProgrammatic()">
                {{ progRef?.isOpen ? 'Close overlay' : 'Open overlay' }}
              </button>

              <ng-template #progTpl>
                <div class="notification">
                  <span class="notification__icon">✦</span>
                  <div>
                    <strong>Programmatic overlay</strong>
                    <p>Created via OverlayService.create()</p>
                  </div>
                </div>
              </ng-template>
            </div>
          </app-code-block>
        </section>
      </div>
    </app-demo-page>
  `,
  styles: [
    `
      .demos {
        display: flex;
        flex-direction: column;
        gap: 3rem;
      }

      .demo-section {
        background: #0f0f13;
        border: 1px solid #1e1e2a;
        border-radius: 16px;
        padding: 1.5rem;
      }

      .demo-section__title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #e5e7eb;
        margin: 0 0 0.5rem;
      }

      .demo-section__desc {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0 0 1.5rem;
        line-height: 1.5;
      }

      .demo-preview {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        padding: 2rem;
      }

      /* Buttons */
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1.125rem;
        border: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .btn--primary {
        background: #7c3aed;
        color: #fff;
      }

      .btn--primary:hover {
        background: #6d28d9;
      }

      .btn--secondary {
        background: #1e1e2a;
        color: #e5e7eb;
        border: 1px solid #2a2a3a;
      }

      .btn--secondary:hover {
        background: #2a2a3a;
      }

      .btn--ghost {
        background: transparent;
        color: #9ca3af;
        border: 1px solid #2a2a3a;
        padding: 0.5rem 0.875rem;
        font-size: 0.75rem;
      }

      .btn--ghost:hover {
        background: #1e1e2a;
        color: #e5e7eb;
      }

      .btn--ghost.qz-overlay-trigger--open {
        background: #1e1430;
        border-color: #7c3aed;
        color: #a78bfa;
      }

      .btn--select {
        background: #1e1e2a;
        color: #e5e7eb;
        border: 1px solid #2a2a3a;
        width: 220px;
        justify-content: space-between;
      }

      .btn--select:hover {
        border-color: #7c3aed;
      }

      .btn__chevron {
        font-size: 0.75rem;
        opacity: 0.6;
      }

      /* Dropdown */
      .dropdown {
        background: #1e1e2a;
        border: 1px solid #2a2a3a;
        border-radius: 10px;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
        padding: 0.5rem;
        min-width: 200px;
      }

      .dropdown__label {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #6b7280;
        padding: 0.375rem 0.625rem;
      }

      .dropdown__item {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        width: 100%;
        padding: 0.5rem 0.625rem;
        border: none;
        background: transparent;
        border-radius: 6px;
        font-size: 0.875rem;
        color: #e5e7eb;
        cursor: pointer;
        text-align: left;
        transition: background 0.1s;
      }

      .dropdown__item:hover {
        background: #2a2a3a;
      }

      .dropdown__item--danger {
        color: #f87171;
      }

      .dropdown__item--danger:hover {
        background: rgba(248, 113, 113, 0.1);
      }

      .dropdown__item-text {
        flex: 1;
      }

      .dropdown__shortcut {
        font-size: 0.7rem;
        color: #6b7280;
        background: #0f0f13;
        border: 1px solid #2a2a3a;
        border-radius: 4px;
        padding: 0.1rem 0.35rem;
        font-family: inherit;
      }

      /* Placements */
      .placements-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.5rem;
        max-width: 400px;
      }

      /* Popover */
      .popover {
        background: #1e1e2a;
        color: #e5e7eb;
        border: 1px solid #2a2a3a;
        border-radius: 8px;
        padding: 0.875rem 1rem;
        max-width: 200px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        position: relative;
      }

      .popover strong {
        display: block;
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
      }

      .popover p {
        font-size: 0.75rem;
        color: #9ca3af;
        margin: 0;
      }

      /* Select */
      .select-list {
        background: #1e1e2a;
        border: 1px solid #2a2a3a;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        overflow: hidden;
      }

      .select-list__item {
        display: block;
        width: 100%;
        padding: 0.625rem 1rem;
        border: none;
        background: transparent;
        font-size: 0.875rem;
        color: #e5e7eb;
        cursor: pointer;
        text-align: left;
        transition: background 0.1s;
      }

      .select-list__item:hover {
        background: #2a2a3a;
      }

      .select-list__item--active {
        background: #1e1430;
        color: #a78bfa;
      }

      /* Notification */
      .notification {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        background: #1e1e2a;
        border: 1px solid #2a2a3a;
        border-radius: 10px;
        padding: 1rem 1.25rem;
        max-width: 300px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      }

      .notification__icon {
        color: #a78bfa;
        font-size: 1.1rem;
        margin-top: 0.1rem;
      }

      .notification strong {
        display: block;
        font-size: 0.875rem;
        color: #e5e7eb;
        margin-bottom: 0.2rem;
      }

      .notification p {
        font-size: 0.8rem;
        color: #9ca3af;
        margin: 0;
      }
    `,
  ],
})
export class OverlayPage {
  private overlayService = inject(OverlayService);
  private viewContainerRef = inject(ViewContainerRef);

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

  // Code examples
  dropdownCode = `<button qzOverlayTrigger
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

  placementsCode = `<button qzOverlayTrigger
  [overlayTemplate]="popoverTpl"
  placement="top"
  [flip]="true">
  Open
</button>`;

  selectCode = `<button qzOverlayTrigger
  [overlayTemplate]="selectTpl"
  placement="bottom-start"
  [matchAnchorWidth]="true">
  Select option
</button>`;

  programmaticCode = `const overlayRef = this.overlayService.create(
  templateRef,
  viewContainerRef,
  anchorElement,
  { placement: 'bottom-start', offset: 8 }
);

overlayRef.open();`;

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
    this.progRef.closed$.subscribe(() => {});
    this.progRef.open();
  }
}
