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

export const CUSTOM_SNIPPET = `// Project an <ng-template> into <qz-tree>, or pass one via [nodeTemplate].
// Quartz's <qz-tree-node> host already owns role="treeitem", tabindex, every aria-*,
// indentation, and click/keydown/focus — the template only supplies content/visuals.
// Don't add role, tabindex, aria-* or a row-level (click) handler here; that would
// duplicate what the host already provides.
<qz-tree [nodes]="nodes">
  <ng-template let-node let-expanded="expanded" let-hasChildren="hasChildren" let-toggle="toggle">
    @if (hasChildren) {
      <span (click)="toggle(); $event.stopPropagation()">{{ expanded ? '▼' : '▶' }}</span>
    }
    {{ hasChildren ? (expanded ? '📂' : '📁') : '📄' }} {{ node.label }}
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

<!-- aria-busy already comes from the host while loading() is true — the template only
     needs to render content/visuals, same as any other custom node template. -->
<ng-template
  #tpl
  let-node
  let-expanded="expanded"
  let-hasChildren="hasChildren"
  let-loading="loading"
  let-error="error"
  let-toggle="toggle"
  let-retry="retry"
>
  @if (hasChildren) {
    <button (click)="error() ? retry() : toggle()">
      {{ loading() ? '…' : error() ? '↻' : expanded ? '▼' : '▶' }}
    </button>
  }
  {{ node.label }}
  @if (error()) { <span>{{ $any(error()).message }}</span> }
</ng-template>`;
