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
