import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { render, screen, fireEvent } from '@testing-library/angular';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TreeComponent } from './tree.component';
import { TreeService } from './tree.service';
import { TreeNode, TreeLoadChildrenFn } from './tree.types';

/** Flush pending microtasks (loader promises) without fake timers. */
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** A bucket that knows it has children but has not fetched them. */
const lazyNodes = (): TreeNode[] => [
  { id: 'bucket', label: 'bucket', hasChildren: true },
  { id: 'file', label: 'file.txt' },
];

const childrenOf = (node: TreeNode): TreeNode[] => [
  { id: `${node.id}/a`, label: 'a.txt' },
  { id: `${node.id}/nested`, label: 'nested', hasChildren: true },
];

describe('TreeService — lazy loading', () => {
  let service: TreeService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TreeService] });
    service = TestBed.inject(TreeService);
  });

  describe('hasChildren inference', () => {
    it('should infer expandability from children when the flag is absent', () => {
      expect(service.hasChildren({ id: 'a', label: 'a' })).toBe(false);
      expect(service.hasChildren({ id: 'a', label: 'a', children: [] })).toBe(false);
      expect(
        service.hasChildren({ id: 'a', label: 'a', children: [{ id: 'b', label: 'b' }] }),
      ).toBe(true);
    });

    it('should honour the hasChildren flag before children are known', () => {
      expect(service.hasChildren({ id: 'a', label: 'a', hasChildren: true })).toBe(true);
    });

    it('should let a loaded (empty) children array win over the flag', () => {
      expect(service.hasChildren({ id: 'a', label: 'a', hasChildren: true, children: [] })).toBe(
        false,
      );
    });
  });

  describe('loading on expand', () => {
    it('should load children the first time a node is expanded', async () => {
      const loader = vi.fn(async (node: TreeNode) => childrenOf(node));
      service.init(lazyNodes());
      service.setLoadChildren(loader);

      expect(service.loadState('bucket')).toBe('idle');

      service.expand('bucket');
      expect(service.loadState('bucket')).toBe('loading');
      expect(service.isLoading('bucket')).toBe(true);

      await flush();

      expect(loader).toHaveBeenCalledTimes(1);
      expect(service.loadState('bucket')).toBe('loaded');
      expect(service.findNode('bucket')?.children).toHaveLength(2);
      expect(service.isExpanded('bucket')).toBe(true);
    });

    it('should not load again when collapsed and re-expanded', async () => {
      const loader = vi.fn(async (node: TreeNode) => childrenOf(node));
      service.init(lazyNodes());
      service.setLoadChildren(loader);

      service.expand('bucket');
      await flush();
      service.collapse('bucket');
      service.expand('bucket');
      await flush();
      service.toggle('bucket'); // collapse
      service.toggle('bucket'); // expand
      await flush();

      expect(loader).toHaveBeenCalledTimes(1);
      expect(service.findNode('bucket')?.children).toHaveLength(2);
    });

    it('should not issue a second request while one is in flight', async () => {
      const pending = deferred<TreeNode[]>();
      const loader = vi.fn(() => pending.promise);
      service.init(lazyNodes());
      service.setLoadChildren(loader);

      service.expand('bucket');
      service.collapse('bucket');
      service.expand('bucket');

      expect(loader).toHaveBeenCalledTimes(1);
      pending.resolve([{ id: 'bucket/a', label: 'a.txt' }]);
      await flush();
      expect(loader).toHaveBeenCalledTimes(1);
      expect(service.loadState('bucket')).toBe('loaded');
    });

    it('should never call the loader for a declared leaf', async () => {
      const loader = vi.fn(async () => []);
      service.init(lazyNodes());
      service.setLoadChildren(loader);

      service.expand('file');
      await flush();

      expect(loader).not.toHaveBeenCalled();
    });

    it('should treat an empty result as loaded and turn the node into a leaf', async () => {
      const loader = vi.fn(async () => []);
      service.init(lazyNodes());
      service.setLoadChildren(loader);

      service.expand('bucket');
      await flush();

      const bucket = service.findNode('bucket')!;
      expect(service.loadState(bucket)).toBe('loaded');
      expect(service.hasChildren(bucket)).toBe(false);

      service.collapse('bucket');
      service.expand('bucket');
      await flush();
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('should report loaded for statically provided children', () => {
      service.init([{ id: 'root', label: 'Root', children: [{ id: 'kid', label: 'Kid' }] }]);
      expect(service.loadState('root')).toBe('loaded');
      expect(service.loadState('kid')).toBe('idle');
    });

    it('should not mutate the array passed to init', async () => {
      const loader = vi.fn(async (node: TreeNode) => childrenOf(node));
      const original = lazyNodes();
      service.init(original);
      service.setLoadChildren(loader);

      service.expand('bucket');
      await flush();

      expect(original[0].children).toBeUndefined();
      expect(service.findNode('bucket')?.children).toHaveLength(2);
    });

    it('should load a node marked expanded in the data', async () => {
      const loader = vi.fn(async (node: TreeNode) => childrenOf(node));
      service.setLoadChildren(loader);
      service.init([{ id: 'bucket', label: 'bucket', hasChildren: true, expanded: true }]);

      await flush();

      expect(loader).toHaveBeenCalledTimes(1);
      expect(service.findNode('bucket')?.children).toHaveLength(2);
    });

    it('should start pending loads when the loader arrives after expansion', async () => {
      const loader = vi.fn(async (node: TreeNode) => childrenOf(node));
      service.init(lazyNodes());

      service.expand('bucket');
      await flush();
      expect(service.loadState('bucket')).toBe('idle');

      service.setLoadChildren(loader);
      await flush();

      expect(loader).toHaveBeenCalledTimes(1);
      expect(service.findNode('bucket')?.children).toHaveLength(2);
    });

    it('should discard a result that resolves after a re-init', async () => {
      const pending = deferred<TreeNode[]>();
      service.init(lazyNodes());
      service.setLoadChildren(() => pending.promise);

      service.expand('bucket');
      service.init(lazyNodes()); // new dataset

      pending.resolve([{ id: 'stale', label: 'stale' }]);
      await flush();

      expect(service.findNode('bucket')?.children).toBeUndefined();
      expect(service.loadState('bucket')).toBe('idle');
    });
  });

  describe('errors', () => {
    it('should collapse the node and keep the error on rejection', async () => {
      const failure = new Error('network down');
      const loader = vi.fn(() => Promise.reject(failure));
      service.init(lazyNodes());
      service.setLoadChildren(loader);

      service.expand('bucket');
      await flush();

      expect(service.loadState('bucket')).toBe('error');
      expect(service.isLoading('bucket')).toBe(false);
      expect(service.isExpanded('bucket')).toBe(false);
      expect(service.loadError('bucket')).toBe(failure);
    });

    it('should treat a synchronous throw in the loader as an error', async () => {
      const failure = new Error('boom');
      service.init(lazyNodes());
      service.setLoadChildren((() => {
        throw failure;
      }) as unknown as TreeLoadChildrenFn);

      service.expand('bucket');
      await flush();

      expect(service.loadState('bucket')).toBe('error');
      expect(service.isExpanded('bucket')).toBe(false);
      expect(service.loadError('bucket')).toBe(failure);
    });

    it('should retry after a failure and clear the error', async () => {
      const failure = new Error('network down');
      const loader = vi
        .fn<(node: TreeNode) => Promise<TreeNode[]>>()
        .mockRejectedValueOnce(failure)
        .mockImplementation(async (node: TreeNode) => childrenOf(node));
      service.init(lazyNodes());
      service.setLoadChildren(loader);

      service.expand('bucket');
      await flush();
      expect(service.loadState('bucket')).toBe('error');

      service.retry('bucket');
      expect(service.loadState('bucket')).toBe('loading');
      await flush();

      expect(loader).toHaveBeenCalledTimes(2);
      expect(service.loadState('bucket')).toBe('loaded');
      expect(service.loadError('bucket')).toBeUndefined();
      expect(service.isExpanded('bucket')).toBe(true);
      expect(service.findNode('bucket')?.children).toHaveLength(2);
    });

    it('should retry when a failed node is expanded again', async () => {
      const loader = vi
        .fn<(node: TreeNode) => Promise<TreeNode[]>>()
        .mockRejectedValueOnce(new Error('nope'))
        .mockImplementation(async (node: TreeNode) => childrenOf(node));
      service.init(lazyNodes());
      service.setLoadChildren(loader);

      service.expand('bucket');
      await flush();
      service.expand('bucket');
      await flush();

      expect(loader).toHaveBeenCalledTimes(2);
      expect(service.loadState('bucket')).toBe('loaded');
    });

    it('should ignore retry while a load is in flight', async () => {
      const pending = deferred<TreeNode[]>();
      const loader = vi.fn(() => pending.promise);
      service.init(lazyNodes());
      service.setLoadChildren(loader);

      service.expand('bucket');
      service.retry('bucket');

      expect(loader).toHaveBeenCalledTimes(1);
      pending.resolve([]);
      await flush();
    });
  });

  describe('expandAll', () => {
    it('should not trigger loads for unloaded nodes', async () => {
      const loader = vi.fn(async (node: TreeNode) => childrenOf(node));
      service.init(lazyNodes());
      service.setLoadChildren(loader);

      service.expandAll();
      await flush();

      expect(loader).not.toHaveBeenCalled();
      expect(service.isExpanded('bucket')).toBe(false);
    });

    it('should expand already-loaded levels only', async () => {
      const loader = vi.fn(async (node: TreeNode) => childrenOf(node));
      service.init(lazyNodes());
      service.setLoadChildren(loader);

      service.expand('bucket');
      await flush();
      service.collapseAll();
      service.expandAll();
      await flush();

      expect(loader).toHaveBeenCalledTimes(1);
      expect(service.isExpanded('bucket')).toBe(true);
      // The nested child declares children but they were never fetched.
      expect(service.isExpanded('bucket/nested')).toBe(false);
    });

    it('should not trigger loads through config.expandAll on init', async () => {
      const loader = vi.fn(async (node: TreeNode) => childrenOf(node));
      service.setLoadChildren(loader);
      service.init(lazyNodes(), { expandAll: true });

      await flush();

      expect(loader).not.toHaveBeenCalled();
    });
  });
});

let loaderImpl: (node: TreeNode) => Promise<TreeNode[]>;

@Component({
  standalone: true,
  imports: [TreeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<qz-tree [nodes]="nodes" [loadChildren]="loadChildren" />`,
})
class LazyHost {
  nodes: TreeNode[] = lazyNodes();
  // Stable identity on purpose — the loader must be swappable per test without re-init.
  readonly loadChildren: TreeLoadChildrenFn = (node) => loaderImpl(node);
}

describe('TreeComponent — lazy loading', () => {
  const settle = async (fixture: ComponentFixture<LazyHost>) => {
    await flush();
    fixture.detectChanges();
  };

  const toggleOf = (label: string) => screen.getByText(label).previousElementSibling as HTMLElement;

  beforeEach(() => {
    loaderImpl = async (node: TreeNode) => childrenOf(node);
  });

  it('should expose aria-expanded on a node whose children are not loaded yet', async () => {
    await render(LazyHost);
    const [bucket, file] = screen.getAllByRole('treeitem');

    expect(bucket).toHaveAttribute('aria-expanded', 'false');
    expect(bucket).not.toHaveAttribute('aria-busy');
    expect(bucket).not.toHaveAttribute('data-qz-load-state');
    expect(file).not.toHaveAttribute('aria-expanded');
  });

  it('should mark the node busy while loading and clear it afterwards', async () => {
    const pending = deferred<TreeNode[]>();
    loaderImpl = () => pending.promise;
    const { fixture } = await render(LazyHost);

    fireEvent.click(toggleOf('bucket'));
    fixture.detectChanges();

    const bucket = screen.getAllByRole('treeitem')[0];
    expect(bucket).toHaveAttribute('aria-busy', 'true');
    expect(bucket).toHaveAttribute('data-qz-load-state', 'loading');
    expect(bucket).toHaveAttribute('aria-expanded', 'true');

    pending.resolve([{ id: 'bucket/a', label: 'a.txt' }]);
    await settle(fixture);

    expect(bucket).not.toHaveAttribute('aria-busy');
    expect(bucket).toHaveAttribute('data-qz-load-state', 'loaded');
    expect(screen.getByText('a.txt')).toBeInTheDocument();
  });

  it('should keep ARIA correct for deferred children', async () => {
    const { fixture } = await render(LazyHost);

    fireEvent.click(toggleOf('bucket'));
    await settle(fixture);

    const [bucket, first, nested, file] = screen.getAllByRole('treeitem');

    expect(bucket).toHaveAttribute('aria-level', '1');
    expect(bucket).toHaveAttribute('aria-setsize', '2');
    expect(bucket).toHaveAttribute('aria-posinset', '1');
    expect(bucket).toHaveAttribute('aria-expanded', 'true');

    expect(first).toHaveAttribute('aria-level', '2');
    expect(first).toHaveAttribute('aria-setsize', '2');
    expect(first).toHaveAttribute('aria-posinset', '1');
    expect(first).not.toHaveAttribute('aria-expanded');

    expect(nested).toHaveAttribute('aria-level', '2');
    expect(nested).toHaveAttribute('aria-posinset', '2');
    // Declares children it has not fetched — still an expandable treeitem.
    expect(nested).toHaveAttribute('aria-expanded', 'false');

    expect(file).toHaveAttribute('aria-level', '1');
    expect(file).toHaveAttribute('aria-posinset', '2');

    // Loaded children live in a proper group, and nothing else does.
    const groups = document.querySelectorAll('[role="group"]');
    expect(groups).toHaveLength(1);
    expect(groups[0].querySelectorAll(':scope > qz-tree-node')).toHaveLength(2);
  });

  it('should load only once when expanded via the keyboard and re-expanded', async () => {
    const loader = vi.fn(async (node: TreeNode) => childrenOf(node));
    loaderImpl = loader;
    const { fixture } = await render(LazyHost);
    const bucket = screen.getAllByRole('treeitem')[0];

    fireEvent.keyDown(bucket, { key: 'ArrowRight' });
    await settle(fixture);
    expect(screen.getByText('a.txt')).toBeInTheDocument();

    fireEvent.keyDown(bucket, { key: 'ArrowLeft' });
    await settle(fixture);
    expect(screen.queryByText('a.txt')).toBeNull();

    fireEvent.keyDown(bucket, { key: 'ArrowRight' });
    await settle(fixture);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(screen.getByText('a.txt')).toBeInTheDocument();
  });

  it('should surface the error state and recover through the toggle', async () => {
    const loader = vi
      .fn<(node: TreeNode) => Promise<TreeNode[]>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockImplementation(async (node: TreeNode) => childrenOf(node));
    loaderImpl = loader;
    const { fixture } = await render(LazyHost);

    fireEvent.click(toggleOf('bucket'));
    await settle(fixture);

    const bucket = screen.getAllByRole('treeitem')[0];
    expect(bucket).toHaveAttribute('data-qz-load-state', 'error');
    expect(bucket).toHaveAttribute('aria-expanded', 'false');
    expect(bucket).not.toHaveAttribute('aria-busy');
    expect(screen.queryByText('a.txt')).toBeNull();

    fireEvent.click(toggleOf('bucket')); // retry affordance
    await settle(fixture);

    expect(loader).toHaveBeenCalledTimes(2);
    expect(bucket).toHaveAttribute('data-qz-load-state', 'loaded');
    expect(screen.getByText('a.txt')).toBeInTheDocument();
  });
});
