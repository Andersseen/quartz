import {
  Component,
  ChangeDetectionStrategy,
  input,
  TemplateRef,
  effect,
  inject,
  untracked,
  Signal,
} from '@angular/core';
import { TreeNode, TreeConfig, TreeNodeLoadState, TreeLoadChildrenFn } from './tree.types';
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
  /**
   * Lazy-load state of this node's children. Reports `loaded` for nodes whose children
   * were provided statically, so a template can treat both kinds of node alike.
   */
  loadState: Signal<TreeNodeLoadState>;
  /** Shorthand for `loadState() === 'loading'`. */
  loading: Signal<boolean>;
  /** Rejection value of the last failed load, or `undefined`. */
  error: Signal<unknown>;
  /** Clear the error and request the children again. */
  retry: () => void;
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
  /**
   * Optional per-level loader. When set, a node with `hasChildren: true` and no `children`
   * fetches them the first time it is expanded — once; collapsing and re-expanding does not
   * repeat the request. `expandAll()` never triggers it.
   */
  readonly loadChildren = input<TreeLoadChildrenFn | null>(null);

  readonly treeService = inject(TreeService);

  constructor() {
    // Kept separate from the init effect on purpose: a consumer passing an inline arrow
    // (`[loadChildren]="(n) => ..."`) changes the function identity on every change
    // detection, and that must not reset expansion/selection/loaded children.
    effect(() => {
      const fn = this.loadChildren();
      untracked(() => this.treeService.setLoadChildren(fn));
    });

    // Single source of truth for (re)initialization: runs on mount and whenever
    // `nodes` or `config` change. Previously an `ngOnInit` duplicated this call.
    effect(() => {
      const n = this.nodes();
      const c = this.config();
      if (n) {
        // `untracked`: init reads the service's own signals, and tracking those would
        // re-initialize (and wipe expansion/loaded children) on every expand.
        untracked(() => this.treeService.init(n, c));
      }
    });
  }
}
