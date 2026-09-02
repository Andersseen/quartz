import {
  Component,
  ChangeDetectionStrategy,
  input,
  TemplateRef,
  inject,
  computed,
  afterRenderEffect,
  ElementRef,
} from '@angular/core';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { TreeNode } from './tree.types';
import { TreeService } from './tree.service';
import { TreeNodeContext } from './tree.component';

/**
 * Quartz owns the accessible row — `role="treeitem"`, roving `tabindex`, every `aria-*`
 * attribute, and click/keydown/focus handling all live on this component's own host, not on
 * a template-internal wrapper. That way a custom `nodeTemplate` only ever supplies inner
 * content/visuals; it renders *inside* the already-semantic `<qz-tree-node>` element instead
 * of replacing it, so a consumer reskinning a node never has to reimplement its
 * accessibility. (Before this, supplying a custom template silently dropped all of the
 * above — see docs/ai/STABILITY_AUDIT.md.)
 */
@Component({
  selector: 'qz-tree-node',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: {
    role: 'treeitem',
    '[attr.tabindex]': 'tabindex()',
    '[attr.aria-level]': 'level() + 1',
    '[attr.aria-setsize]': 'setsize()',
    '[attr.aria-posinset]': 'posinset()',
    '[attr.aria-expanded]': 'hasChildren() ? isExpanded() : null',
    '[attr.aria-selected]': 'isSelected()',
    '[attr.aria-disabled]': 'node().disabled ? true : null',
    '[attr.aria-busy]': 'isLoading() ? true : null',
    '[attr.data-qz-load-state]': "loadState() === 'idle' ? null : loadState()",
    '[class.qz-tree-node]': 'true',
    '[class.qz-tree-node--expanded]': 'isExpanded()',
    '[class.qz-tree-node--selected]': 'isSelected()',
    '[style.display]': '"flex"',
    '[style.align-items]': '"center"',
    '[style.padding-left.px]': 'level() * 20',
    '(click)': 'onClick($event)',
    '(focus)': 'onFocus()',
    '(keydown)': 'onKeydown($event)',
  },
  template: `
    @if (template()) {
      <ng-container *ngTemplateOutlet="template()!; context: getContext()"></ng-container>
    } @else {
      @if (hasChildren()) {
        <span class="qz-tree-node__toggle" aria-hidden="true" (click)="onToggleClick($event)">
          {{ toggleGlyph() }}
        </span>
      } @else {
        <span class="qz-tree-node__spacer"></span>
      }
      <span class="qz-tree-node__label">{{ node().label }}</span>
    }

    @if (isExpanded() && node().children?.length) {
      <div class="qz-tree-node__children" role="group">
        @for (child of node().children; track child.id; let i = $index, count = $count) {
          <qz-tree-node
            [node]="child"
            [level]="level() + 1"
            [setsize]="count"
            [posinset]="i + 1"
            [template]="template()"
          />
        }
      </div>
    }
  `,
  styles: [
    `
      .qz-tree-node__toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      .qz-tree-node__spacer {
        width: 16px;
        flex-shrink: 0;
      }

      .qz-tree-node__label {
        flex: 1;
        min-width: 0;
      }
    `,
  ],
})
export class TreeNodeComponent {
  private readonly treeService = inject(TreeService);
  private readonly document = inject(DOCUMENT);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly node = input.required<TreeNode>();
  readonly level = input<number>(0);
  readonly template = input<TemplateRef<TreeNodeContext> | null>(null);
  /** Number of sibling nodes at this level (for `aria-setsize`). */
  readonly setsize = input<number>(1);
  /** 1-based position among siblings (for `aria-posinset`). */
  readonly posinset = input<number>(1);
  /** True for the very first node in the tree — seeds the roving tabindex. */
  readonly isFirst = input<boolean>(false);

  readonly isExpanded = computed(() => this.treeService.expandedIds().has(this.node().id));
  readonly isSelected = computed(() => this.treeService.selectedIds().has(this.node().id));
  /** True for loaded children *and* for a node that declares `hasChildren` before loading. */
  readonly hasChildren = computed(() => this.treeService.hasChildren(this.node()));

  readonly loadState = computed(() => this.treeService.loadState(this.node()));
  readonly isLoading = computed(() => this.loadState() === 'loading');
  readonly loadError = computed(() => this.treeService.loadError(this.node()));

  /** Default-template affordance only: consumers with a `nodeTemplate` render their own. */
  readonly toggleGlyph = computed(() => {
    switch (this.loadState()) {
      case 'loading':
        return '⋯';
      case 'error':
        return '↻';
      default:
        return this.isExpanded() ? '▼' : '▶';
    }
  });

  /** Roving tabindex: only the active node (or the first, before any interaction) is tabbable. */
  readonly tabindex = computed(() => {
    const active = this.treeService.activeId();
    if (active === null) return this.isFirst() ? 0 : -1;
    return active === this.node().id ? 0 : -1;
  });

  constructor() {
    // Move DOM focus to whichever node becomes active via keyboard navigation. Targets the
    // component's own host — the treeitem row — regardless of whether a custom template or
    // the default markup is rendered inside it. Uses afterRenderEffect (not a plain
    // effect()) because moving real DOM focus is a DOM side effect that must run after
    // this cycle's rendering has actually been committed — a plain effect() can run before
    // that, which lets the browser silently drop the .focus() call.
    afterRenderEffect(() => {
      if (this.treeService.activeId() !== this.node().id) return;
      if (!this.document.defaultView) return; // SSR guard
      this.hostElement.nativeElement.focus();
    });
  }

  onClick(_event: MouseEvent): void {
    if (this.node().disabled) return;
    const id = this.node().id;
    this.treeService.setActive(id);
    // `toggleOnClick` (default true): clicking a parent row expands/collapses it, which
    // for a lazy node also triggers its first load.
    if (this.treeService.config().toggleOnClick && this.hasChildren()) {
      this.treeService.toggle(id);
    }
    this.treeService.toggleSelection(id);
  }

  onToggleClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.loadState() === 'error') {
      this.treeService.retry(this.node());
      return;
    }
    this.treeService.toggle(this.node().id);
  }

  onFocus(): void {
    this.treeService.setActive(this.node().id);
  }

  onKeydown(event: KeyboardEvent): void {
    const id = this.node().id;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.treeService.focusNext(id);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.treeService.focusPrevious(id);
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (this.hasChildren()) {
          // Expanding an unloaded node requests its children; on a failed node it retries.
          if (this.isExpanded()) this.treeService.focusFirstChild(id);
          else this.treeService.expand(id);
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (this.hasChildren() && this.isExpanded()) this.treeService.collapse(id);
        else this.treeService.focusParent(id);
        break;
      case 'Home':
        event.preventDefault();
        this.treeService.focusFirst();
        break;
      case 'End':
        event.preventDefault();
        this.treeService.focusLast();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.node().disabled) this.treeService.toggleSelection(id);
        break;
      default:
        // Type-ahead on printable single characters (no modifier keys).
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          this.treeService.typeahead(event.key, id);
        }
    }
  }

  getContext(): TreeNodeContext {
    const node = this.node();
    return {
      $implicit: node,
      node,
      level: this.level(),
      expanded: this.isExpanded(),
      selected: this.isSelected(),
      hasChildren: this.hasChildren(),
      toggle: () => this.treeService.toggle(node.id),
      select: () => this.treeService.select(node.id),
      loadState: this.loadState,
      loading: this.isLoading,
      error: this.loadError,
      retry: () => this.treeService.retry(node),
    };
  }
}
