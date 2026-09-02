import { Component, ChangeDetectionStrategy } from '@angular/core';
import { render, screen, fireEvent } from '@testing-library/angular';
import { describe, it, expect } from 'vitest';
import { TreeComponent } from './tree.component';
import { TreeNode } from './tree.types';

const MOCK_NODES: TreeNode[] = [
  {
    id: '1',
    label: 'Root',
    children: [
      { id: '1-1', label: 'Child 1' },
      { id: '1-2', label: 'Child 2', children: [{ id: '1-2-1', label: 'Deep' }] },
    ],
  },
  { id: '2', label: 'Another' },
];

@Component({
  standalone: true,
  imports: [TreeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<qz-tree [nodes]="nodes" />`,
})
class TestHost {
  nodes = MOCK_NODES;
}

@Component({
  standalone: true,
  imports: [TreeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<qz-tree [nodes]="nodes" [config]="{ toggleOnClick: false }" />`,
})
class NoToggleOnClickHost {
  nodes = MOCK_NODES;
}

@Component({
  standalone: true,
  imports: [TreeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <qz-tree [nodes]="nodes">
      <ng-template let-node let-expanded="expanded" let-hasChildren="hasChildren">
        <span>{{ hasChildren ? (expanded ? 'open' : 'closed') : 'leaf' }}:{{ node.label }}</span>
      </ng-template>
    </qz-tree>
  `,
})
class ProjectedTemplateHost {
  nodes = MOCK_NODES;
}

@Component({
  standalone: true,
  imports: [TreeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<qz-tree [nodes]="nodes" aria-label="Project files" />`,
})
class TreeWithAriaLabelHost {
  nodes = MOCK_NODES;
}

describe('TreeComponent', () => {
  it('should render root nodes', async () => {
    await render(TestHost);
    expect(screen.getByText('Root')).toBeInTheDocument();
    expect(screen.getByText('Another')).toBeInTheDocument();
  });

  it('should expand node on toggle click', async () => {
    const { fixture } = await render(TestHost);

    // Initially collapsed, children should not be visible
    expect(screen.queryByText('Child 1')).toBeNull();

    const rootToggle = screen.getByText('Root').previousElementSibling as HTMLElement;
    expect(rootToggle).not.toBeNull();

    fireEvent.click(rootToggle);
    fixture.detectChanges();

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('should select node on click', async () => {
    const { fixture } = await render(TestHost);
    const another = screen.getByText('Another');

    fireEvent.click(another);
    fixture.detectChanges();

    expect(another.closest('.qz-tree-node')).toHaveClass('qz-tree-node--selected');
  });

  it('should expose WAI-ARIA tree attributes', async () => {
    await render(TestHost);
    const items = screen.getAllByRole('treeitem');
    // Two visible root items initially (children collapsed).
    expect(items).toHaveLength(2);

    const [root, another] = items;
    expect(root).toHaveAttribute('aria-level', '1');
    expect(root).toHaveAttribute('aria-setsize', '2');
    expect(root).toHaveAttribute('aria-posinset', '1');
    expect(root).toHaveAttribute('aria-expanded', 'false');
    expect(another).toHaveAttribute('aria-posinset', '2');
    expect(another).not.toHaveAttribute('aria-expanded');
  });

  it('should seed roving tabindex on the first node only', async () => {
    await render(TestHost);
    const [root, another] = screen.getAllByRole('treeitem');
    expect(root).toHaveAttribute('tabindex', '0');
    expect(another).toHaveAttribute('tabindex', '-1');
  });

  it('should move the roving tabindex with ArrowDown', async () => {
    const { fixture } = await render(TestHost);
    const [root, another] = screen.getAllByRole('treeitem');

    fireEvent.keyDown(root, { key: 'ArrowDown' });
    fixture.detectChanges();

    expect(another).toHaveAttribute('tabindex', '0');
    expect(root).toHaveAttribute('tabindex', '-1');
  });

  it('should expand a collapsed node with ArrowRight', async () => {
    const { fixture } = await render(TestHost);
    const [root] = screen.getAllByRole('treeitem');
    expect(screen.queryByText('Child 1')).toBeNull();

    fireEvent.keyDown(root, { key: 'ArrowRight' });
    fixture.detectChanges();

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(root).toHaveAttribute('aria-expanded', 'true');
  });

  it('should select the active node with Enter', async () => {
    const { fixture } = await render(TestHost);
    const [, another] = screen.getAllByRole('treeitem');

    fireEvent.keyDown(another, { key: 'Enter' });
    fixture.detectChanges();

    expect(another).toHaveAttribute('aria-selected', 'true');
  });

  it('should toggle expansion when the row is clicked (toggleOnClick default)', async () => {
    const { fixture } = await render(TestHost);
    const root = screen.getByText('Root');

    expect(screen.queryByText('Child 1')).toBeNull();

    fireEvent.click(root);
    fixture.detectChanges();
    expect(screen.getByText('Child 1')).toBeInTheDocument();

    fireEvent.click(root);
    fixture.detectChanges();
    expect(screen.queryByText('Child 1')).toBeNull();
  });

  it('should still select the node it expands', async () => {
    const { fixture } = await render(TestHost);
    const root = screen.getByText('Root');

    fireEvent.click(root);
    fixture.detectChanges();

    expect(root.closest('.qz-tree-node')).toHaveClass('qz-tree-node--selected');
  });

  it('should not toggle on click when toggleOnClick is false', async () => {
    const { fixture } = await render(NoToggleOnClickHost);
    const root = screen.getByText('Root');

    fireEvent.click(root);
    fixture.detectChanges();

    expect(screen.queryByText('Child 1')).toBeNull();
    expect(root.closest('.qz-tree-node')).toHaveClass('qz-tree-node--selected');
  });

  it('should render an ng-template projected into qz-tree', async () => {
    await render(ProjectedTemplateHost);

    expect(screen.getByText('closed:Root')).toBeInTheDocument();
    expect(screen.getByText('leaf:Another')).toBeInTheDocument();
  });

  it('keeps Quartz-owned role/tabindex/aria-* on a custom-templated row (the row element itself, not just its projected content)', async () => {
    await render(ProjectedTemplateHost);

    const items = screen.getAllByRole('treeitem');
    expect(items).toHaveLength(2); // fails pre-fix: custom template rows carried no role at all

    const [root, another] = items;
    expect(root).toHaveAttribute('tabindex', '0');
    expect(another).toHaveAttribute('tabindex', '-1');
    expect(root).toHaveAttribute('aria-level', '1');
    expect(root).toHaveAttribute('aria-setsize', '2');
    expect(root).toHaveAttribute('aria-posinset', '1');
    expect(root).toHaveAttribute('aria-expanded', 'false');
    expect(root).toHaveAttribute('aria-selected', 'false');
  });

  it('drives keyboard navigation and real DOM focus through a custom-templated row', async () => {
    const { fixture } = await render(ProjectedTemplateHost);
    const [root, another] = screen.getAllByRole('treeitem');

    fireEvent.keyDown(root, { key: 'ArrowDown' });
    fixture.detectChanges();

    expect(another).toHaveAttribute('tabindex', '0');
    expect(root).toHaveAttribute('tabindex', '-1');
    // Pre-fix, the roving-focus effect looked up a template-ref that only existed in the
    // default (non-custom-template) branch, so DOM focus never actually followed here.
    expect(document.activeElement).toBe(another);
  });

  it('expands a custom-templated row with ArrowRight and selects it with Enter', async () => {
    const { fixture } = await render(ProjectedTemplateHost);
    const [root] = screen.getAllByRole('treeitem');
    expect(screen.queryByText('leaf:Child 1')).toBeNull();

    fireEvent.keyDown(root, { key: 'ArrowRight' });
    fixture.detectChanges();
    expect(screen.getByText('leaf:Child 1')).toBeInTheDocument();
    expect(root).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(root, { key: 'Enter' });
    fixture.detectChanges();
    expect(root).toHaveAttribute('aria-selected', 'true');
  });

  it('exposes an accessible name for the tree container via plain attribute passthrough', async () => {
    await render(TreeWithAriaLabelHost);
    expect(screen.getByRole('tree', { name: 'Project files' })).toBeInTheDocument();
  });
});
