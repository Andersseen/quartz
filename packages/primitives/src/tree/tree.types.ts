export interface TreeNode<T = unknown> {
  id: string;
  label: string;
  children?: TreeNode<T>[];
  /**
   * Declares that this node has children before they are known — the entry point for
   * lazy loading. When omitted, expandability is inferred from `children`.
   */
  hasChildren?: boolean;
  expanded?: boolean;
  disabled?: boolean;
  data?: T;
}

/** Lifecycle of a node's lazily-loaded children. */
export type TreeNodeLoadState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Resolves the children of `node`. Called at most once per node for a successful load.
 * A rejection puts the node in the `error` state (see `TreeService.retry`).
 */
export type TreeLoadChildrenFn<T = unknown> = (node: TreeNode<T>) => Promise<TreeNode<T>[]>;

export interface TreeConfig {
  /** Whether multiple nodes can be selected. Default: false */
  multiSelect: boolean;
  /** Whether clicking a parent toggles expansion. Default: true */
  toggleOnClick: boolean;
  /**
   * Whether to expand all nodes by default. Default: false
   *
   * With lazy loading this only expands nodes whose children are already loaded — it
   * never triggers `loadChildren` (expanding everything must not download everything).
   */
  expandAll: boolean;
}

export const DEFAULT_TREE_CONFIG: TreeConfig = {
  multiSelect: false,
  toggleOnClick: true,
  expandAll: false,
};
