import {
  Component,
  ChangeDetectionStrategy,
  input,
  TemplateRef,
  inject,
  computed,
  effect,
  viewChild,
  ElementRef,
} from '@angular/core';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { TreeNode } from './tree.types';
import { TreeService } from './tree.service';
import { TreeNodeContext } from './tree.component';

@Component({
  selector: 'qz-tree-node',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  template: `
    @if (template()) {
      <ng-container *ngTemplateOutlet="template()!; context: getContext()"></ng-container>
    } @else {
      <div
        #item
        class="qz-tree-node"
        role="treeitem"
        [attr.tabindex]="tabindex()"
        [attr.aria-level]="level() + 1"
        [attr.aria-setsize]="setsize()"
        [attr.aria-posinset]="posinset()"
        [attr.aria-expanded]="hasChildren() ? isExpanded() : null"
        [attr.aria-selected]="isSelected()"
        [attr.aria-disabled]="node().disabled ? true : null"
        [class.qz-tree-node--expanded]="isExpanded()"
        [class.qz-tree-node--selected]="isSelected()"
        [style.padding-left.px]="level() * 20"
        (click)="onClick($event)"
        (focus)="onFocus()"
        (keydown)="onKeydown($event)"
      >
        @if (hasChildren()) {
          <span class="qz-tree-node__toggle" aria-hidden="true" (click)="onToggleClick($event)">
            {{ isExpanded() ? '▼' : '▶' }}
          </span>
        } @else {
          <span class="qz-tree-node__spacer"></span>
        }
        <span class="qz-tree-node__label">{{ node().label }}</span>
      </div>
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
      :host {
        display: block;
      }

      .qz-tree-node {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.1s;
        font-size: 0.875rem;
        color: #e5e7eb;
      }

      .qz-tree-node:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      .qz-tree-node--selected {
        background: rgba(124, 58, 237, 0.15);
        color: #a78bfa;
      }

      .qz-tree-node__toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        font-size: 0.65rem;
        color: #6b7280;
        cursor: pointer;
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

  readonly node = input.required<TreeNode>();
  readonly level = input<number>(0);
  readonly template = input<TemplateRef<TreeNodeContext> | null>(null);
  /** Number of sibling nodes at this level (for `aria-setsize`). */
  readonly setsize = input<number>(1);
  /** 1-based position among siblings (for `aria-posinset`). */
  readonly posinset = input<number>(1);
  /** True for the very first node in the tree — seeds the roving tabindex. */
  readonly isFirst = input<boolean>(false);

  private readonly itemEl = viewChild<ElementRef<HTMLElement>>('item');

  readonly isExpanded = computed(() => this.treeService.expandedIds().has(this.node().id));
  readonly isSelected = computed(() => this.treeService.selectedIds().has(this.node().id));
  readonly hasChildren = computed(() => {
    const children = this.node().children;
    return !!(children && children.length > 0);
  });

  /** Roving tabindex: only the active node (or the first, before any interaction) is tabbable. */
  readonly tabindex = computed(() => {
    const active = this.treeService.activeId();
    if (active === null) return this.isFirst() ? 0 : -1;
    return active === this.node().id ? 0 : -1;
  });

  constructor() {
    // Move DOM focus to whichever node becomes active via keyboard navigation.
    effect(() => {
      if (this.treeService.activeId() !== this.node().id) return;
      if (!this.document.defaultView) return; // SSR guard
      this.itemEl()?.nativeElement.focus();
    });
  }

  onClick(_event: MouseEvent): void {
    if (this.node().disabled) return;
    this.treeService.setActive(this.node().id);
    this.treeService.toggleSelection(this.node().id);
  }

  onToggleClick(event: MouseEvent): void {
    event.stopPropagation();
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
    };
  }
}
