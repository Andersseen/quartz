# Spec: Tree lazy loading (per-level children loading)

- **Status:** Done
- **Branch:** feature/tree-lazy-loading
- **Date:** 2026-08-18
- **Related:** `packages/quartz/src/lib/tree/`, docs page `/tree`

## 1. Problem

`qz-tree` requires the whole tree in memory before it renders anything: `nodes` is
`input.required<TreeNode[]>()` and `TreeNode.children` is a plain array. That rules out the
cases where a tree actually earns its keep — object storage browsers (R2/S3), remote file
systems, paginated APIs — where children are only knowable one level at a time.

## 2. Goal / non-goals

- **Goal:** an optional `loadChildren` hook so a node that declares `hasChildren: true`
  fetches its children the first time it is expanded, exactly once, with per-node
  `idle | loading | loaded | error` state exposed as signals to the consumer template.
- **Non-goals:** virtualization (separate `virtual-scroll` primitive), drag & drop,
  tri-state checkboxes, pagination _within_ a level ("load more" siblings), cache
  invalidation / refresh of already-loaded levels, `Observable` loaders (a consumer can do
  `firstValueFrom(obs$)`).
- **Compatibility:** every existing input, ARIA attribute and behaviour is unchanged when
  `loadChildren` is not provided. No new component, no new file in the primitive.

## 3. Public API

```ts
// tree.types.ts
export interface TreeNode<T = unknown> {
  id: string;
  label: string;
  children?: TreeNode<T>[];
  /**
   * Declares that this node has children before they are known. Used by lazy loading.
   * When omitted, expandability is inferred from `children` (existing behaviour).
   */
  hasChildren?: boolean;
  expanded?: boolean;
  disabled?: boolean;
  data?: T;
}

/** Lifecycle of a node's lazily-loaded children. */
export type TreeNodeLoadState = 'idle' | 'loading' | 'loaded' | 'error';

/** Resolves the children of `node`. Rejecting puts the node in the `error` state. */
export type TreeLoadChildrenFn<T = unknown> = (node: TreeNode<T>) => Promise<TreeNode<T>[]>;

// tree.component.ts
readonly loadChildren = input<TreeLoadChildrenFn | null>(null);

// TreeNodeContext — new members (existing members untouched)
loadState: Signal<TreeNodeLoadState>;
loading: Signal<boolean>;
error: Signal<unknown>;
retry: () => void;

// TreeService — new members
setLoadChildren(fn: TreeLoadChildrenFn | null): void;
readonly loadStates: Signal<ReadonlyMap<string, TreeNodeLoadState>>;
loadState(nodeOrId: TreeNode | string): TreeNodeLoadState;
isLoading(nodeOrId: TreeNode | string): boolean;
loadError(nodeOrId: TreeNode | string): unknown;
retry(nodeOrId: TreeNode | string): void;
hasChildren(node: TreeNode): boolean;
findNode(id: string): TreeNode | null;
```

Usage:

```html
<qz-tree [nodes]="roots" [loadChildren]="listPrefix" [nodeTemplate]="tpl" />

<ng-template #tpl let-node let-loading="loading" let-error="error" let-retry="retry">
  {{ node.label }} @if (loading()) { <span>…</span> } @if (error()) {
  <button (click)="retry()">retry</button> }
</ng-template>
```

## 4. Behaviour

1. `hasChildren(node)` = `node.children ? node.children.length > 0 : (node.hasChildren ?? false)`.
   With no `hasChildren` flag and no loader, this is byte-for-byte today's behaviour.
2. Expanding a node (`expand`, `toggle`, ArrowRight, toggle click) whose `children` are
   `undefined`, whose `hasChildren` is `true`, and while `loadChildren` is set, calls
   `loadChildren(node)` and sets its state to `loading`.
3. On resolve, the returned array is written into the node (immutably — the array passed to
   `[nodes]` is never mutated) and the state becomes `loaded`.
4. A `loaded` node never calls `loadChildren` again: collapse + re-expand renders from the
   already-loaded children. A second expand while `loading` does not issue a second call.
5. On reject (or a synchronous throw in the loader), the node goes to `error`, the error
   value is retained, and **the node is collapsed** — never left in a permanent `loading`.
6. `retry(node)` clears the error, returns the node to `idle` and expands it again, which
   re-issues the request. Re-expanding a node in `error` also retries (a user gesture),
   so the default template's toggle stays useful.
7. `loadState` reports `loaded` for nodes that already carry a `children` array (static
   data), so a template can treat static and lazy nodes uniformly.
8. A loader resolving after `init()` re-ran (new `nodes`/`config`) is discarded — a
   generation counter guards against stale writes.
9. **`expandAll()` only expands already-loaded nodes.** It never triggers `loadChildren` —
   expanding everything must not mean downloading the whole tree. Same for
   `config.expandAll` at init. A node marked `expanded: true` in the data _is_ loaded on
   init, because that is a per-node request from the consumer.
10. Setting `loadChildren` after nodes are already expanded (input arriving late) starts
    the pending loads for those expanded-but-unloaded nodes.

### Keyboard & ARIA

| Key / attribute                                 | Behaviour                                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `ArrowRight`                                    | Collapsed + `hasChildren` → expand (triggers the load). Expanded → first child.           |
| `ArrowLeft`                                     | Unchanged (collapse, else focus parent).                                                  |
| `aria-expanded`                                 | Present on any node with `hasChildren` — including one whose children are not loaded yet. |
| `aria-busy="true"`                              | On the treeitem while its children are loading.                                           |
| `aria-level` / `aria-setsize` / `aria-posinset` | Unchanged; lazily-loaded children get correct values from the loaded array.               |
| `data-qz-load-state`                            | `loading` / `loaded` / `error` on the treeitem (absent when `idle`) for styling.          |
| `role="group"`                                  | Only wraps real children — no placeholder rows inside it while loading.                   |

### SSR behaviour

No DOM/timer work is added. `loadChildren` is consumer code; if it is called during SSR it
is the consumer's own fetch. The node component's focus effect keeps its `defaultView` guard.

## 5. Files to create / modify

| File                                                  | Action | Purpose                                                     |
| ----------------------------------------------------- | ------ | ----------------------------------------------------------- |
| `packages/quartz/src/lib/tree/tree.types.ts`          | edit   | `hasChildren`, `TreeNodeLoadState`, `TreeLoadChildrenFn`    |
| `packages/quartz/src/lib/tree/tree.service.ts`        | edit   | load state, dedupe, immutable child insertion               |
| `packages/quartz/src/lib/tree/tree.component.ts`      | edit   | `loadChildren` input, context signal members                |
| `packages/quartz/src/lib/tree/tree-node.component.ts` | edit   | `hasChildren` via service, aria-busy, load state in context |
| `packages/quartz/src/lib/tree/index.ts`               | edit   | export new types                                            |
| `packages/quartz/src/public-api.ts`                   | edit   | export new types                                            |
| `packages/quartz/src/lib/tree/tree-lazy.spec.ts`      | create | lazy-loading unit tests                                     |
| `src/app/pages/(docs)/tree.page.*`                    | edit   | lazy-loading demo section + snippet                         |
| `README.md`, `docs/ai/STATE.md`                       | edit   | document the feature                                        |

`cli/registry.js` needs **no** change: no new library file (the spec file and `*.spec.ts`
are not part of the registry).

## 6. Test plan

Unit (`tree-lazy.spec.ts`, mirrors §4):

- collapse + re-expand issues exactly one `loadChildren` call (§4.4)
- a second expand while in flight does not issue a second call (§4.4)
- rejection → state `error`, node collapsed, error retained (§4.5)
- `retry()` re-issues the request and succeeds (§4.6)
- ARIA correct on deferred children: `aria-level`, `aria-setsize`, `aria-posinset`,
  `aria-expanded` on an unloaded parent, `aria-busy` while loading (§4 ARIA table)
- `expandAll()` does not call the loader (§4.9)
- `hasChildren` inference unchanged without the flag (§4.1)
- late `loadChildren` starts pending loads (§4.10)
- stale resolution after re-init is discarded (§4.8)

E2E: N/A — no new user-visible flow on the docs site beyond the demo section.

## 7. Definition of done

- [x] All §4 behaviours implemented and tested
- [x] MODIFY-an-existing-primitive checklist in WORKFLOW.md completed
- [x] `pnpm lint && pnpm typecheck && pnpm test` green
- [x] `docs/ai/STATE.md` updated

## 8. Open questions

- **Should this be a new component?** No. Lazy loading is state, not rendering: it lives in
  `TreeService` and is surfaced through `TreeNodeContext`. A `qz-tree-loading` style
  component would have to render something visual, which the library forbids
  (CONTEXT.md non-goals). Resolved.
- **`expandAll()` + `loadChildren`** — resolved as §4.9 (only already-loaded nodes).
