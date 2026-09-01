import { Directive, ElementRef, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { inlineToPhysical, resolveDirection } from '@quartz-headless/core';
import { SidebarDirective } from './sidebar.directive';

let sidebarPanelId = 0;

@Directive({
  selector: '[qzSidebarPanel]',
  exportAs: 'qzSidebarPanel',
  standalone: true,
  host: {
    '[attr.id]': 'id',
    '[attr.data-qz-sidebar-panel]': '""',
    '[attr.data-qz-open]': 'sidebar.open() ? "" : null',
    '[attr.data-qz-collapsed]': 'sidebar.collapsed() ? "" : null',
    '[attr.data-qz-state]': 'sidebar.state()',
    '[attr.data-qz-mode]': 'sidebar.currentMode()',
    '[attr.data-qz-side]': 'sidebar.side()',
    '[attr.aria-hidden]': 'sidebar.open() ? null : "true"',
    '[style.grid-column]': 'gridColumn()',
    '[style.inline-size]': 'inlineSize()',
    '[style.min-inline-size]': 'inlineSize()',
    '[style.max-inline-size]': 'inlineSize()',
    '[style.overflow-x]': '"hidden"',
    '[style.overflow-y]': '"auto"',
    '[style.min-height]': '"0"',
    '[style.height]': 'sidebar.currentMode() === "overlay" ? "100dvh" : null',
    '[style.position]': 'sidebar.currentMode() === "overlay" ? "fixed" : null',
    '[style.inset-block]': 'sidebar.currentMode() === "overlay" ? "0" : null',
    '[style.left]': 'physicalSide() === "left" && sidebar.currentMode() === "overlay" ? "0" : null',
    '[style.right]':
      'physicalSide() === "right" && sidebar.currentMode() === "overlay" ? "0" : null',
    '[style.pointer-events]': 'sidebar.open() ? "auto" : "none"',
    '[style.visibility]': 'sidebar.open() ? "visible" : "hidden"',
    '[style.z-index]':
      'sidebar.currentMode() === "overlay" ? "var(--qz-sidebar-z-index, 1000)" : null',
    '(keydown)': 'sidebar.handlePanelKeydown($event)',
  },
})
export class SidebarPanelDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly sidebar = inject(SidebarDirective);

  readonly id = `qz-sidebar-panel-${++sidebarPanelId}`;
  readonly gridColumn = computed(() => {
    if (this.sidebar.currentMode() !== 'push') return null;
    return this.sidebar.side() === 'inline-start' ? '1' : '2';
  });
  readonly inlineSize = computed(() => {
    if (!this.sidebar.open()) return '0px';
    return this.sidebar.collapsed()
      ? 'var(--qz-sidebar-collapsed-size, 4rem)'
      : 'var(--qz-sidebar-size, 16rem)';
  });
  readonly physicalSide = computed(() =>
    inlineToPhysical(
      resolveDirection(this.elementRef.nativeElement),
      this.sidebar.currentMode() ? this.sidebar.side() : this.sidebar.side(),
    ),
  );

  element(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  ngOnInit(): void {
    this.sidebar.registerPanel(this);
  }

  ngOnDestroy(): void {
    this.sidebar.unregisterPanel(this);
  }
}
