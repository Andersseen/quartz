import {
  Component,
  ChangeDetectionStrategy,
  input,
  TemplateRef,
  effect,
  OnInit,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TreeService],
  imports: [TreeNodeComponent],
  template: `
    <div class="qz-tree" role="tree">
      @for (node of treeService.nodes(); track node.id) {
        <qz-tree-node [node]="node" [level]="0" [template]="nodeTemplate()" />
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
export class TreeComponent implements OnInit {
  readonly nodes = input.required<TreeNode[]>();
  readonly config = input<Partial<TreeConfig>>({});
  readonly nodeTemplate = input<TemplateRef<TreeNodeContext> | null>(null);

  readonly treeService = inject(TreeService);

  constructor() {
    effect(() => {
      const n = this.nodes();
      const c = this.config();
      if (n) {
        this.treeService.init(n, c);
      }
    });
  }

  ngOnInit(): void {
    this.treeService.init(this.nodes(), this.config());
  }
}
