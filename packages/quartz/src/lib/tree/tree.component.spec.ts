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
});
