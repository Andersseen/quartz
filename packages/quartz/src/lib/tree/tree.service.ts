import { Injectable, signal, computed } from '@angular/core';
import { TreeNode, TreeConfig, DEFAULT_TREE_CONFIG } from './tree.types';

/** A node flattened into the currently-visible traversal order. */
export interface FlatTreeNode {
  node: TreeNode;
  /** Zero-based depth. */
  level: number;
  /** Parent node id, or null for a root node. */
  parentId: string | null;
}

const TYPEAHEAD_RESET_MS = 500;

@Injectable()
export class TreeService {
  #nodes = signal<TreeNode[]>([]);
  #expandedIds = signal<Set<string>>(new Set());
  #selectedIds = signal<Set<string>>(new Set());
  #config = signal<TreeConfig>(DEFAULT_TREE_CONFIG);
  /** Node that currently owns the roving tabindex / DOM focus. */
  #activeId = signal<string | null>(null);

  readonly nodes = computed(() => this.#nodes());
  readonly expandedIds = computed(() => this.#expandedIds());
  readonly selectedIds = computed(() => this.#selectedIds());
  readonly activeId = computed(() => this.#activeId());

  /** Visible nodes (respecting expansion) in top-to-bottom traversal order. */
  readonly visibleNodes = computed<FlatTreeNode[]>(() => {
    const expanded = this.#expandedIds();
    const out: FlatTreeNode[] = [];
    const walk = (list: TreeNode[], level: number, parentId: string | null) => {
      for (const n of list) {
        out.push({ node: n, level, parentId });
        if (n.children?.length && expanded.has(n.id)) {
          walk(n.children, level + 1, n.id);
        }
      }
    };
    walk(this.#nodes(), 0, null);
    return out;
  });

  #typeBuffer = '';
  #lastTypeAt = 0;

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
    this.#activeId.set(null);

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

  // ── Keyboard navigation / roving tabindex ─────────────────────────────────

  /** Mark a node as the active (focused) treeitem for roving tabindex. */
  setActive(id: string): void {
    this.#activeId.set(id);
  }

  /** Non-disabled visible nodes — the set that can receive focus. */
  #focusable(): FlatTreeNode[] {
    return this.visibleNodes().filter((f) => !f.node.disabled);
  }

  /** Move focus to the next visible node (ArrowDown). */
  focusNext(id: string): void {
    const list = this.#focusable();
    const i = list.findIndex((f) => f.node.id === id);
    if (i >= 0 && i < list.length - 1) this.setActive(list[i + 1].node.id);
  }

  /** Move focus to the previous visible node (ArrowUp). */
  focusPrevious(id: string): void {
    const list = this.#focusable();
    const i = list.findIndex((f) => f.node.id === id);
    if (i > 0) this.setActive(list[i - 1].node.id);
  }

  /** Move focus to the first visible node (Home). */
  focusFirst(): void {
    const list = this.#focusable();
    if (list.length) this.setActive(list[0].node.id);
  }

  /** Move focus to the last visible node (End). */
  focusLast(): void {
    const list = this.#focusable();
    if (list.length) this.setActive(list[list.length - 1].node.id);
  }

  /** Move focus to the parent node (ArrowLeft on a collapsed/leaf node). */
  focusParent(id: string): void {
    const meta = this.visibleNodes().find((f) => f.node.id === id);
    if (meta?.parentId) this.setActive(meta.parentId);
  }

  /** Move focus to the first child (ArrowRight on an expanded node). */
  focusFirstChild(id: string): void {
    const list = this.visibleNodes();
    const idx = list.findIndex((f) => f.node.id === id);
    if (idx >= 0 && idx + 1 < list.length && list[idx + 1].parentId === id) {
      this.setActive(list[idx + 1].node.id);
    }
  }

  /**
   * Type-ahead: focus the next visible node whose label starts with the typed
   * characters. Consecutive keystrokes within {@link TYPEAHEAD_RESET_MS} build
   * up a search string; a single repeated letter cycles through matches.
   */
  typeahead(char: string, currentId: string | null): void {
    const now = Date.now();
    if (now - this.#lastTypeAt > TYPEAHEAD_RESET_MS) this.#typeBuffer = '';
    this.#lastTypeAt = now;
    this.#typeBuffer += char.toLowerCase();

    const list = this.#focusable();
    if (!list.length) return;
    const start = Math.max(
      0,
      list.findIndex((f) => f.node.id === currentId),
    );
    // On a single char, begin the search after the current node so repeats
    // cycle; while building a longer prefix, include the current node.
    const offset = this.#typeBuffer.length === 1 ? 1 : 0;
    for (let k = 0; k < list.length; k++) {
      const cand = list[(start + offset + k) % list.length];
      if (cand.node.label.toLowerCase().startsWith(this.#typeBuffer)) {
        this.setActive(cand.node.id);
        return;
      }
    }
  }
}
