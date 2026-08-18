export const BASIC_SNIPPET = `const nodes: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      { id: 'app', label: 'app.component.ts' },
      { id: 'main', label: 'main.ts' },
    ],
  },
  { id: 'package', label: 'package.json' },
];

<qz-tree [nodes]="nodes" />`;

export const EXPANDED_SNIPPET = `const nodes: TreeNode[] = [
  {
    id: 'docs',
    label: 'docs',
    expanded: true, // starts expanded
    children: [
      { id: 'readme', label: 'README.md' },
      { id: 'license', label: 'LICENSE' },
    ],
  },
];

<qz-tree [nodes]="nodes" />`;

export const CUSTOM_SNIPPET = `<qz-tree [nodes]="nodes">
  <ng-template let-node let-level="level" let-expanded="expanded">
    <div [style.padding-left.px]="level * 20">
      {{ expanded ? '📂' : '📁' }} {{ node.label }}
    </div>
  </ng-template>
</qz-tree>`;

export const API_SNIPPET = `treeService.expandAll();
treeService.collapseAll();
treeService.toggle('node-id');
treeService.select('node-id');
treeService.clearSelection();`;

export const LAZY_SNIPPET = `// Only the first level is in memory; children arrive per expand.
readonly nodes: TreeNode[] = [
  { id: 'assets', label: 'assets/', hasChildren: true },
  { id: 'robots.txt', label: 'robots.txt' },
];

readonly loadChildren: TreeLoadChildrenFn = async (node) => {
  const res = await fetch(\`/api/list?prefix=\${node.id}\`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json(); // TreeNode[]
};

<qz-tree [nodes]="nodes" [loadChildren]="loadChildren" [nodeTemplate]="tpl" />

<ng-template
  #tpl
  let-node
  let-level="level"
  let-expanded="expanded"
  let-hasChildren="hasChildren"
  let-loading="loading"
  let-error="error"
  let-toggle="toggle"
  let-retry="retry"
>
  <div role="treeitem" [attr.aria-level]="level + 1" [attr.aria-busy]="loading() || null">
    @if (hasChildren) {
      <button (click)="error() ? retry() : toggle()">
        {{ loading() ? '…' : error() ? '↻' : expanded ? '▼' : '▶' }}
      </button>
    }
    {{ node.label }}
    @if (error()) { <span>{{ $any(error()).message }}</span> }
  </div>
</ng-template>`;
