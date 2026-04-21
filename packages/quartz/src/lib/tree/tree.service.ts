import { Injectable, signal, computed } from '@angular/core';
import { TreeNode, TreeConfig, DEFAULT_TREE_CONFIG } from './tree.types';

@Injectable()
export class TreeService {
  #nodes = signal<TreeNode[]>([]);
  #expandedIds = signal<Set<string>>(new Set());
  #selectedIds = signal<Set<string>>(new Set());
  #config = signal<TreeConfig>(DEFAULT_TREE_CONFIG);

  readonly nodes = computed(() => this.#nodes());
  readonly expandedIds = computed(() => new Set(this.#expandedIds()));
  readonly selectedIds = computed(() => new Set(this.#selectedIds()));

  readonly selectedNodes = computed(() => {
    const result: TreeNode[] = [];
    const ids = this.#selectedIds();
    const walk = (list: TreeNode[]) => {
      for (const node of list) {
        if (ids.has(node.id)) result.push(node);
        if (node.children) walk(node.children);
      }
    };
    walk(this.#nodes());
    return result;
  });

  init(nodes: TreeNode[], config?: Partial<TreeConfig>): void {
    const merged = { ...DEFAULT_TREE_CONFIG, ...config };
    this.#config.set(merged);
    this.#nodes.set(nodes);

    if (merged.expandAll) {
      const allIds = new Set<string>();
      const collect = (list: TreeNode[]) => {
        for (const n of list) {
          if (n.children?.length) {
            allIds.add(n.id);
            collect(n.children);
          }
        }
      };
      collect(nodes);
      this.#expandedIds.set(allIds);
    } else {
      const expanded = new Set<string>();
      const collect = (list: TreeNode[]) => {
        for (const n of list) {
          if (n.expanded && n.children?.length) {
            expanded.add(n.id);
          }
          if (n.children) collect(n.children);
        }
      };
      collect(nodes);
      this.#expandedIds.set(expanded);
    }
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggle(id: string): void {
    this.#expandedIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  expand(id: string): void {
    this.#expandedIds.update((set) => new Set(set).add(id));
  }

  collapse(id: string): void {
    this.#expandedIds.update((set) => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
  }

  expandAll(): void {
    const all = new Set<string>();
    const collect = (list: TreeNode[]) => {
      for (const n of list) {
        if (n.children?.length) {
          all.add(n.id);
          collect(n.children);
        }
      }
    };
    collect(this.#nodes());
    this.#expandedIds.set(all);
  }

  collapseAll(): void {
    this.#expandedIds.set(new Set());
  }

  select(id: string): void {
    if (!this.#config().multiSelect) {
      this.#selectedIds.set(new Set([id]));
    } else {
      this.#selectedIds.update((set) => new Set(set).add(id));
    }
  }

  deselect(id: string): void {
    this.#selectedIds.update((set) => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
  }

  toggleSelection(id: string): void {
    if (this.isSelected(id)) {
      this.deselect(id);
    } else {
      this.select(id);
    }
  }

  clearSelection(): void {
    this.#selectedIds.set(new Set());
  }
}
