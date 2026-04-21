import {
  Component,
  ChangeDetectionStrategy,
  input,
  TemplateRef,
  inject,
  computed,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TreeNode } from './tree.types';
import { TreeService } from './tree.service';
import { TreeNodeContext } from './tree.component';

@Component({
  selector: 'qz-tree-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  template: `
    @if (template()) {
      <ng-container *ngTemplateOutlet="template()!; context: getContext()"></ng-container>
    } @else {
      <div
        class="qz-tree-node"
        role="treeitem"
        [attr.aria-expanded]="hasChildren() ? isExpanded() : null"
        [attr.aria-selected]="isSelected()"
        [class.qz-tree-node--expanded]="isExpanded()"
        [class.qz-tree-node--selected]="isSelected()"
        [style.padding-left.px]="level() * 20"
        (click)="onClick($event)"
      >
        @if (hasChildren()) {
          <span class="qz-tree-node__toggle" (click)="onToggleClick($event)">
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
        @for (child of node().children; track child.id) {
          <qz-tree-node [node]="child" [level]="level() + 1" [template]="template()" />
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

  readonly node = input.required<TreeNode>();
  readonly level = input<number>(0);
  readonly template = input<TemplateRef<TreeNodeContext> | null>(null);

  readonly isExpanded = computed(() => this.treeService.expandedIds().has(this.node().id));
  readonly isSelected = computed(() => this.treeService.selectedIds().has(this.node().id));
  readonly hasChildren = computed(() => {
    const children = this.node().children;
    return !!(children && children.length > 0);
  });

  onClick(_event: MouseEvent): void {
    if (this.node().disabled) return;
    this.treeService.toggleSelection(this.node().id);
  }

  onToggleClick(event: MouseEvent): void {
    event.stopPropagation();
    this.treeService.toggle(this.node().id);
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
