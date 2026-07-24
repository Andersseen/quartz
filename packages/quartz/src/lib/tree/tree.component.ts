import {
  Component,
  ChangeDetectionStrategy,
  input,
  TemplateRef,
  effect,
  inject,
} from '@angular/core';
import { TreeNode, TreeConfig } from './tree.types';
import { TreeService } from './tree.service';
import { TreeNodeComponent } from './tree-node.component';

export interface TreeNodeContext {
  $implicit: TreeNode;
  node: TreeNode;
  level: number;
  expanded: boolean;
  selected: boolean;
  hasChildren: boolean;
  toggle: () => void;
  select: () => void;
}

@Component({
  selector: 'qz-tree',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TreeService],
  imports: [TreeNodeComponent],
  template: `
    <div class="qz-tree" role="tree">
      @for (node of treeService.nodes(); track node.id; let i = $index, count = $count) {
        <qz-tree-node
          [node]="node"
          [level]="0"
          [setsize]="count"
          [posinset]="i + 1"
          [isFirst]="i === 0"
          [template]="nodeTemplate()"
        />
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .qz-tree {
        user-select: none;
      }
    `,
  ],
  host: {
    '[class.qz-tree-host]': 'true',
  },
})
export class TreeComponent {
  readonly nodes = input.required<TreeNode[]>();
  readonly config = input<Partial<TreeConfig>>({});
  readonly nodeTemplate = input<TemplateRef<TreeNodeContext> | null>(null);

  readonly treeService = inject(TreeService);

  constructor() {
    // Single source of truth for (re)initialization: runs on mount and whenever
    // `nodes` or `config` change. Previously an `ngOnInit` duplicated this call.
    effect(() => {
      const n = this.nodes();
      const c = this.config();
      if (n) {
        this.treeService.init(n, c);
      }
    });
  }
}
