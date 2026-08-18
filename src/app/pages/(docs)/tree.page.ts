import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { TreeComponent, TreeNode, TreeLoadChildrenFn } from 'quartz';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import {
  BASIC_SNIPPET,
  EXPANDED_SNIPPET,
  CUSTOM_SNIPPET,
  API_SNIPPET,
  LAZY_SNIPPET,
} from './tree.snippets';

/** Stand-in for a remote object-storage listing (R2/S3-style keys). */
const FAKE_LISTING: Record<string, TreeNode[]> = {
  assets: [
    { id: 'assets/img', label: 'img/', hasChildren: true },
    { id: 'assets/logo.svg', label: 'logo.svg' },
    { id: 'assets/theme.css', label: 'theme.css' },
  ],
  'assets/img': [
    { id: 'assets/img/hero.png', label: 'hero.png' },
    { id: 'assets/img/avatar.webp', label: 'avatar.webp' },
  ],
  backups: [
    { id: 'backups/2026-08', label: '2026-08/', hasChildren: true },
    { id: 'backups/2026-07', label: '2026-07/', hasChildren: true },
  ],
  'backups/2026-08': [{ id: 'backups/2026-08/db.sql.gz', label: 'db.sql.gz' }],
  'backups/2026-07': [{ id: 'backups/2026-07/db.sql.gz', label: 'db.sql.gz' }],
};

@Component({
  selector: 'app-tree-page',
  imports: [TreeComponent, DemoPageComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tree.page.html',
})
export default class TreePage {
  readonly basicCode = BASIC_SNIPPET;
  readonly lazyCode = LAZY_SNIPPET;
  readonly expandedCode = EXPANDED_SNIPPET;
  readonly customCode = CUSTOM_SNIPPET;
  readonly apiCode = API_SNIPPET;

  readonly fileNodes: TreeNode[] = [
    {
      id: 'project',
      label: 'quartz',
      children: [
        {
          id: 'src',
          label: 'src',
          children: [
            {
              id: 'app',
              label: 'app',
              children: [
                {
                  id: 'components',
                  label: 'components',
                  children: [{ id: 'demo', label: 'demo-page.component.ts' }],
                },
                {
                  id: 'pages',
                  label: 'pages',
                  children: [{ id: 'index', label: 'index.page.ts' }],
                },
              ],
            },
            { id: 'styles', label: 'styles.scss' },
            { id: 'main', label: 'main.ts' },
          ],
        },
        {
          id: 'packages',
          label: 'packages',
          children: [
            {
              id: 'quartz-lib',
              label: 'quartz',
              children: [
                {
                  id: 'lib',
                  label: 'src/lib',
                  children: [
                    { id: 'overlay', label: 'overlay' },
                    { id: 'dialog', label: 'dialog' },
                    { id: 'tooltip', label: 'tooltip' },
                    { id: 'tree', label: 'tree' },
                  ],
                },
              ],
            },
          ],
        },
        { id: 'package', label: 'package.json' },
        { id: 'readme', label: 'README.md' },
      ],
    },
  ];

  readonly expandedNodes: TreeNode[] = [
    {
      id: 'root',
      label: 'project-root',
      expanded: true,
      children: [
        {
          id: 'config',
          label: 'config',
          expanded: true,
          children: [
            { id: 'tsconfig', label: 'tsconfig.json' },
            { id: 'angular', label: 'angular.json' },
          ],
        },
        {
          id: 'docs',
          label: 'docs',
          children: [{ id: 'guide', label: 'getting-started.md' }],
        },
      ],
    },
  ];

  /** Only the first level is known up front — everything else declares `hasChildren`. */
  readonly lazyNodes: TreeNode[] = [
    { id: 'assets', label: 'assets/', hasChildren: true },
    { id: 'backups', label: 'backups/', hasChildren: true },
    { id: 'restricted', label: 'restricted/', hasChildren: true },
    { id: 'robots.txt', label: 'robots.txt' },
  ];

  /** Counts real requests, so re-expanding visibly does *not* refetch. */
  readonly requestCount = signal(0);

  readonly loadPrefix: TreeLoadChildrenFn = async (node) => {
    this.requestCount.update((n) => n + 1);
    await new Promise((resolve) => setTimeout(resolve, 700));
    if (node.id.startsWith('restricted')) {
      throw new Error('403 Forbidden');
    }
    return FAKE_LISTING[node.id] ?? [];
  };

  messageOf(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  readonly customNodes: TreeNode[] = [
    {
      id: 'design',
      label: 'Design System',
      children: [
        { id: 'colors', label: 'Colors', children: [{ id: 'palette', label: 'palette.json' }] },
        { id: 'typo', label: 'Typography', children: [{ id: 'fonts', label: 'fonts.scss' }] },
        { id: 'icons', label: 'Icons', children: [{ id: 'sprite', label: 'sprite.svg' }] },
      ],
    },
  ];
}
