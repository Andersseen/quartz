export interface TreeNode<T = unknown> {
  id: string;
  label: string;
  children?: TreeNode<T>[];
  expanded?: boolean;
  disabled?: boolean;
  data?: T;
}

export interface TreeConfig {
  /** Whether multiple nodes can be selected. Default: false */
  multiSelect: boolean;
  /** Whether clicking a parent toggles expansion. Default: true */
  toggleOnClick: boolean;
  /** Whether to expand all nodes by default. Default: false */
  expandAll: boolean;
}

export const DEFAULT_TREE_CONFIG: TreeConfig = {
  multiSelect: false,
  toggleOnClick: true,
  expandAll: false,
};
