import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TreeComponent, TreeNode } from 'quartz';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { BASIC_SNIPPET, EXPANDED_SNIPPET, CUSTOM_SNIPPET, API_SNIPPET } from './tree.snippets';

@Component({
  selector: 'app-tree-page',
  imports: [TreeComponent, DemoPageComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tree.page.html',
  styleUrl: './tree.page.scss',
})
export default class TreePage {
  readonly basicCode = BASIC_SNIPPET;
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
