import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TreeService, FlatTreeNode } from './tree.service';
import { TreeNode } from './tree.types';

const MOCK_NODES: TreeNode[] = [
  {
    id: 'root',
    label: 'Root',
    children: [
      { id: 'child-1', label: 'Child 1' },
      {
        id: 'child-2',
        label: 'Child 2',
        children: [{ id: 'grandchild', label: 'Grandchild' }],
      },
      { id: 'child-3', label: 'Child 3', disabled: true },
    ],
  },
  { id: 'another', label: 'Another' },
];

describe('TreeService', () => {
  let service: TreeService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TreeService] });
    service = TestBed.inject(TreeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('init', () => {
    it('should initialize with empty nodes', () => {
      service.init([]);
      expect(service.nodes()).toEqual([]);
      expect(service.visibleNodes()).toEqual([]);
    });

    it('should initialize with default config', () => {
      service.init(MOCK_NODES);
      expect(service.nodes().length).toBe(2);
      expect(service.expandedIds()).toEqual(new Set());
      expect(service.selectedIds()).toEqual(new Set());
      expect(service.activeId()).toBeNull();
    });

    it('should expandAll when config.expandAll is true', () => {
      service.init(MOCK_NODES, { expandAll: true });
      const expanded = service.expandedIds();
      expect(expanded.has('root')).toBe(true);
      expect(expanded.has('child-2')).toBe(true);
      expect(expanded.has('child-1')).toBe(false);
    });

    it('should respect expanded node state from data', () => {
      const nodes: TreeNode[] = [
        {
          id: 'a',
          label: 'A',
          expanded: true,
          children: [{ id: 'b', label: 'B' }],
        },
      ];
      service.init(nodes);
      expect(service.expandedIds()).toEqual(new Set(['a']));
    });

    it('should reset activeId on re-init', () => {
      service.init(MOCK_NODES);
      service.setActive('another');
      expect(service.activeId()).toBe('another');
      service.init([{ id: 'new', label: 'New' }]);
      expect(service.activeId()).toBeNull();
    });
  });

  describe('expansion', () => {
    beforeEach(() => {
      service.init(MOCK_NODES);
    });

    it('should toggle expansion', () => {
      expect(service.isExpanded('root')).toBe(false);
      service.toggle('root');
      expect(service.isExpanded('root')).toBe(true);
      service.toggle('root');
      expect(service.isExpanded('root')).toBe(false);
    });

    it('should expand a node', () => {
      service.expand('root');
      expect(service.isExpanded('root')).toBe(true);
    });

    it('should collapse a node', () => {
      service.expand('root');
      service.collapse('root');
      expect(service.isExpanded('root')).toBe(false);
    });

    it('should expand all nodes with children', () => {
      service.expandAll();
      const expanded = service.expandedIds();
      expect(expanded.has('root')).toBe(true);
      expect(expanded.has('child-2')).toBe(true);
      expect(expanded.has('child-1')).toBe(false);
      expect(expanded.has('another')).toBe(false);
    });

    it('should collapse all nodes', () => {
      service.init(MOCK_NODES, { expandAll: true });
      service.collapseAll();
      expect(service.expandedIds()).toEqual(new Set());
    });

    it('should compute visible nodes respecting expansion', () => {
      service.expand('root');
      const visible = service.visibleNodes();
      expect(visible.map((v) => v.node.id)).toEqual([
        'root',
        'child-1',
        'child-2',
        'child-3',
        'another',
      ]);
      expect(visible.find((v) => v.node.id === 'child-1')?.level).toBe(1);
      expect(visible.find((v) => v.node.id === 'child-1')?.parentId).toBe('root');
      expect(visible.find((v) => v.node.id === 'root')?.parentId).toBeNull();
    });

    it('should include nested children when expanded', () => {
      service.expandAll();
      const visible = service.visibleNodes().map((v) => v.node.id);
      expect(visible).toContain('grandchild');
    });
  });

  describe('selection', () => {
    beforeEach(() => {
      service.init(MOCK_NODES);
    });

    it('should select a node in single-select mode', () => {
      service.select('root');
      expect(service.isSelected('root')).toBe(true);
      expect(service.selectedIds()).toEqual(new Set(['root']));
    });

    it('should replace selection in single-select mode', () => {
      service.select('root');
      service.select('another');
      expect(service.isSelected('root')).toBe(false);
      expect(service.isSelected('another')).toBe(true);
    });

    it('should add multiple selections in multi-select mode', () => {
      service.init(MOCK_NODES, { multiSelect: true });
      service.select('root');
      service.select('another');
      expect(service.isSelected('root')).toBe(true);
      expect(service.isSelected('another')).toBe(true);
    });

    it('should deselect a node', () => {
      service.select('root');
      service.deselect('root');
      expect(service.isSelected('root')).toBe(false);
    });

    it('should toggle selection', () => {
      service.toggleSelection('root');
      expect(service.isSelected('root')).toBe(true);
      service.toggleSelection('root');
      expect(service.isSelected('root')).toBe(false);
    });

    it('should clear selection', () => {
      service.init(MOCK_NODES, { multiSelect: true });
      service.select('root');
      service.select('another');
      service.clearSelection();
      expect(service.selectedIds()).toEqual(new Set());
    });

    it('should expose selected nodes preserving original data', () => {
      service.select('root');
      expect(service.selectedNodes().map((n) => n.id)).toEqual(['root']);
    });

    it('should find selected nodes recursively', () => {
      service.init(MOCK_NODES, { multiSelect: true });
      service.select('child-1');
      service.select('grandchild');
      expect(service.selectedNodes().map((n) => n.id)).toEqual(['child-1', 'grandchild']);
    });
  });

  describe('active / roving tabindex', () => {
    beforeEach(() => {
      service.init(MOCK_NODES);
    });

    it('should set active id', () => {
      service.setActive('root');
      expect(service.activeId()).toBe('root');
    });
  });

  describe('keyboard navigation', () => {
    beforeEach(() => {
      service.init(MOCK_NODES);
    });

    it('should focus the next visible node', () => {
      service.expand('root');
      service.setActive('root');
      service.focusNext('root');
      expect(service.activeId()).toBe('child-1');
    });

    it('should not move past the last visible node', () => {
      service.expand('root');
      service.setActive('another');
      service.focusNext('another');
      expect(service.activeId()).toBe('another');
    });

    it('should focus the previous visible node', () => {
      service.expand('root');
      service.setActive('child-1');
      service.focusPrevious('child-1');
      expect(service.activeId()).toBe('root');
    });

    it('should not move before the first visible node', () => {
      service.expand('root');
      service.setActive('root');
      service.focusPrevious('root');
      expect(service.activeId()).toBe('root');
    });

    it('should focus the first visible node', () => {
      service.expand('root');
      service.setActive('another');
      service.focusFirst();
      expect(service.activeId()).toBe('root');
    });

    it('should focus the last visible node', () => {
      service.setActive('root');
      service.focusLast();
      expect(service.activeId()).toBe('another');
    });

    it('should focus the parent node', () => {
      service.expand('root');
      service.setActive('child-1');
      service.focusParent('child-1');
      expect(service.activeId()).toBe('root');
    });

    it('should not focus parent for root nodes', () => {
      service.expand('root');
      service.setActive('root');
      service.focusParent('root');
      expect(service.activeId()).toBe('root');
    });

    it('should focus the first child when expanded', () => {
      service.expand('root');
      service.setActive('root');
      service.focusFirstChild('root');
      expect(service.activeId()).toBe('child-1');
    });

    it('should not focus first child when collapsed', () => {
      service.setActive('root');
      service.focusFirstChild('root');
      expect(service.activeId()).toBe('root');
    });

    it('should not focus first child for leaf nodes', () => {
      service.expand('root');
      service.setActive('child-1');
      service.focusFirstChild('child-1');
      expect(service.activeId()).toBe('child-1');
    });

    it('should skip disabled nodes when moving focus', () => {
      service.expand('root');
      service.setActive('child-2');
      service.focusNext('child-2');
      expect(service.activeId()).toBe('another');
    });
  });

  describe('typeahead', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      service.init(MOCK_NODES);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should focus the first node matching the typed prefix', () => {
      service.expand('root');
      service.typeahead('A', 'root');
      expect(service.activeId()).toBe('another');
    });

    it('should build a multi-character prefix for a unique match', () => {
      service.init([
        { id: 'a1', label: 'Alpha' },
        { id: 'a2', label: 'Amazon' },
        { id: 'b1', label: 'Beta' },
      ]);
      // Start from 'b1' so the single-char search wraps around to 'a1'.
      service.typeahead('A', 'b1');
      expect(service.activeId()).toBe('a1');
      service.typeahead('M', 'a1');
      expect(service.activeId()).toBe('a2');
    });

    it('should keep the current node when a longer prefix matches it', () => {
      service.expand('root');
      service.typeahead('C', 'root');
      expect(service.activeId()).toBe('child-1');
      service.typeahead('H', 'child-1');
      expect(service.activeId()).toBe('child-1');
    });

    it('should cycle through matches with repeated single character after reset', () => {
      service.init([
        { id: 'a1', label: 'Alpha' },
        { id: 'a2', label: 'Amazon' },
        { id: 'b1', label: 'Beta' },
      ]);
      service.typeahead('A', 'b1');
      expect(service.activeId()).toBe('a1');
      vi.advanceTimersByTime(600);
      service.typeahead('A', 'a1');
      expect(service.activeId()).toBe('a2');
    });

    it('should reset the buffer after the timeout', () => {
      service.expand('root');
      service.typeahead('C', 'root');
      vi.advanceTimersByTime(600);
      service.typeahead('A', 'child-1');
      expect(service.activeId()).toBe('another');
    });

    it('should do nothing when no visible nodes match', () => {
      service.expand('root');
      service.setActive('root');
      service.typeahead('Z', 'root');
      expect(service.activeId()).toBe('root');
    });

    it('should skip disabled nodes', () => {
      service.expand('root');
      service.setActive('root');
      service.typeahead('C', 'root');
      expect(service.activeId()).toBe('child-1');
      vi.advanceTimersByTime(600);
      service.typeahead('C', 'child-1');
      expect(service.activeId()).toBe('child-2');
    });
  });

  describe('edge cases', () => {
    it('should handle empty nodes for focus methods', () => {
      service.init([]);
      service.focusFirst();
      service.focusLast();
      expect(service.activeId()).toBeNull();
    });

    it('should handle unknown ids in focus methods gracefully', () => {
      service.init(MOCK_NODES);
      service.focusNext('unknown');
      service.focusPrevious('unknown');
      service.focusParent('unknown');
      service.focusFirstChild('unknown');
      expect(service.activeId()).toBeNull();
    });

    it('should not expose children of unexpanded nodes in visible nodes', () => {
      service.init(MOCK_NODES);
      expect(service.visibleNodes().map((v: FlatTreeNode) => v.node.id)).toEqual([
        'root',
        'another',
      ]);
    });
  });
});
