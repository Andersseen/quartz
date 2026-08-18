import { Injectable, signal, computed, untracked } from '@angular/core';
import {
  TreeNode,
  TreeConfig,
  TreeNodeLoadState,
  TreeLoadChildrenFn,
  DEFAULT_TREE_CONFIG,
} from './tree.types';

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

  // ── Lazy loading state ────────────────────────────────────────────────────
  /** Consumer-supplied loader. Plain field on purpose: it must not drive change detection. */
  #loadChildren: TreeLoadChildrenFn | null = null;
  #loadStates = signal<ReadonlyMap<string, TreeNodeLoadState>>(new Map());
  #loadErrors = signal<ReadonlyMap<string, unknown>>(new Map());
  /** Bumped on every `init()` so in-flight loads from a previous dataset are discarded. */
  #generation = 0;

  readonly nodes = computed(() => this.#nodes());
  readonly expandedIds = computed(() => this.#expandedIds());
  readonly selectedIds = computed(() => this.#selectedIds());
  readonly activeId = computed(() => this.#activeId());
  /** Per-node lazy-load state. Nodes never lazily loaded are absent from the map. */
  readonly loadStates = computed(() => this.#loadStates());

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
    // Any load still in flight belongs to the previous dataset — ignore its result.
    this.#generation++;
    this.#loadStates.set(new Map());
    this.#loadErrors.set(new Map());

    if (merged.expandAll) {
      // Only what is already loaded: `expandAll` must never trigger network work.
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
          // `expanded: true` is a per-node request, so an unloaded node opts into a load.
          if (n.expanded && this.hasChildren(n)) {
            expanded.add(n.id);
          }
          if (n.children) collect(n.children);
        }
      };
      collect(nodes);
      this.#expandedIds.set(expanded);
    }

    this.#loadExpandedNodes();
  }

  /**
   * Whether a node can be expanded. `children` wins when present; otherwise the
   * `hasChildren` flag lets a node declare children it has not loaded yet.
   */
  hasChildren(node: TreeNode): boolean {
    return node.children ? node.children.length > 0 : (node.hasChildren ?? false);
  }

  /** Depth-first lookup by id over the current (possibly lazily-extended) tree. */
  findNode(id: string): TreeNode | null {
    const walk = (list: TreeNode[]): TreeNode | null => {
      for (const n of list) {
        if (n.id === id) return n;
        const found = n.children?.length ? walk(n.children) : null;
        if (found) return found;
      }
      return null;
    };
    return walk(this.#nodes());
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggle(id: string): void {
    if (this.isExpanded(id)) this.collapse(id);
    else this.expand(id);
  }

  expand(id: string): void {
    this.#expandedIds.update((set) => (set.has(id) ? set : new Set(set).add(id)));
    const node = untracked(() => this.findNode(id));
    if (node) this.#ensureChildrenLoaded(node);
  }

  collapse(id: string): void {
    this.#expandedIds.update((set) => {
      if (!set.has(id)) return set;
      const next = new Set(set);
      next.delete(id);
      return next;
    });
  }

  /**
   * Expand every node whose children are already loaded. Deliberately does **not**
   * trigger `loadChildren` — "expand all" must not mean "download the whole tree".
   */
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

  // ── Lazy loading ──────────────────────────────────────────────────────────

  /**
   * Install (or remove) the children loader. Safe to call repeatedly with a new function
   * identity — it does not reset expansion or selection. Setting a loader while nodes are
   * already expanded starts the loads those nodes are waiting for.
   */
  setLoadChildren(fn: TreeLoadChildrenFn | null): void {
    if (this.#loadChildren === fn) return;
    this.#loadChildren = fn;
    if (fn) this.#loadExpandedNodes();
  }

  /**
   * Load state of a node. Nodes that already carry a `children` array report `loaded`,
   * so templates can treat static and lazily-loaded nodes the same way.
   */
  loadState(nodeOrId: TreeNode | string): TreeNodeLoadState {
    const node = this.#resolve(nodeOrId);
    if (!node) return 'idle';
    return this.#loadStates().get(node.id) ?? (node.children ? 'loaded' : 'idle');
  }

  isLoading(nodeOrId: TreeNode | string): boolean {
    return this.loadState(nodeOrId) === 'loading';
  }

  /** The rejection value of the last failed load, or `undefined`. */
  loadError(nodeOrId: TreeNode | string): unknown {
    const node = this.#resolve(nodeOrId);
    return node ? this.#loadErrors().get(node.id) : undefined;
  }

  /** Clear the error state and re-issue the request, expanding the node again. */
  retry(nodeOrId: TreeNode | string): void {
    const node = this.#resolve(nodeOrId);
    if (!node || node.children) return;
    if (this.#loadStates().get(node.id) === 'loading') return;
    this.#setLoadState(node.id, 'idle');
    this.expand(node.id);
  }

  #resolve(nodeOrId: TreeNode | string): TreeNode | null {
    return typeof nodeOrId === 'string' ? this.findNode(nodeOrId) : nodeOrId;
  }

  /** Kick off loads for nodes that are expanded but whose children are not there yet. */
  #loadExpandedNodes(): void {
    if (!this.#loadChildren) return;
    // Untracked: this is imperative kick-off, often reached from a consumer `effect()`
    // (see TreeComponent) which must not subscribe to the tree's internal signals.
    untracked(() => {
      for (const id of this.#expandedIds()) {
        const node = this.findNode(id);
        if (node) this.#ensureChildrenLoaded(node);
      }
    });
  }

  /**
   * Request a node's children once. No-ops when there is no loader, when the children are
   * already present, when the node is a declared leaf, or when a load is in flight or
   * already succeeded — so expand/collapse/expand never repeats the request.
   */
  #ensureChildrenLoaded(node: TreeNode): void {
    const load = this.#loadChildren;
    if (!load || node.children || !this.hasChildren(node)) return;

    const state = untracked(this.#loadStates).get(node.id);
    if (state === 'loading' || state === 'loaded') return;

    const id = node.id;
    const generation = this.#generation;
    this.#setLoadState(id, 'loading');

    let pending: Promise<TreeNode[]>;
    try {
      pending = load(node);
    } catch (error) {
      this.#failLoad(id, generation, error);
      return;
    }

    Promise.resolve(pending).then(
      (children) => {
        if (generation !== this.#generation) return; // superseded by a re-init
        this.#setChildren(id, children ?? []);
        this.#setLoadState(id, 'loaded');
      },
      (error) => this.#failLoad(id, generation, error),
    );
  }

  /** A failed load leaves the node in `error` and collapsed — never spinning forever. */
  #failLoad(id: string, generation: number, error: unknown): void {
    if (generation !== this.#generation) return;
    this.#setLoadState(id, 'error');
    this.#loadErrors.update((map) => new Map(map).set(id, error));
    this.collapse(id);
  }

  #setLoadState(id: string, state: TreeNodeLoadState): void {
    this.#loadStates.update((map) => new Map(map).set(id, state));
    if (state === 'error') return;
    this.#loadErrors.update((map) => {
      if (!map.has(id)) return map;
      const next = new Map(map);
      next.delete(id);
      return next;
    });
  }

  /** Immutably graft loaded children onto a node — the consumer's array is never mutated. */
  #setChildren(id: string, children: TreeNode[]): void {
    const replace = (list: TreeNode[]): TreeNode[] | null => {
      for (let i = 0; i < list.length; i++) {
        const n = list[i];
        if (n.id === id) {
          const next = list.slice();
          next[i] = { ...n, children };
          return next;
        }
        if (n.children?.length) {
          const nested = replace(n.children);
          if (nested) {
            const next = list.slice();
            next[i] = { ...n, children: nested };
            return next;
          }
        }
      }
      return null;
    };
    this.#nodes.update((list) => replace(list) ?? list);
  }

  // ── Selection ─────────────────────────────────────────────────────────────

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
