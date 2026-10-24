---
title: Collection
description: A registration store with DOM-order items, an active item, roving or active-descendant focus and typeahead — the engine under Select, Listbox, Combobox, Menu, Tabs and Tree.
group: Core
order: 20
---

`CollectionStore<T extends CollectionItem>` keeps a signal of registered items sorted in **DOM order**, tracks one active item, and implements next/previous/first/last/typeahead on top of it. Primitives register their options with it; headers, group labels and separators are never registered, so they are skipped by navigation automatically.

```ts
import { CollectionStore, type CollectionItem } from '@quartz-headless/core';

interface Row extends CollectionItem {
  id: string;
}

const store = new CollectionStore<Row>(
  { focusStrategy: 'aria-activedescendant', orientation: 'vertical' },
  document,
);
store.register({ id: 'a', element: () => document.getElementById('a'), label: 'Apple' });
store.next();
store.activeId(); // signal<string | null>
```

## Item contract

| Field      | Meaning                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `id`       | Stable unique id (also the element id for `aria-activedescendant`)      |
| `element`  | Element or accessor; defines DOM order and receives focus (roving mode) |
| `disabled` | Boolean or accessor; disabled items are never active or reachable       |
| `label`    | Typeahead text; defaults to the element text                            |

## Behaviour

- Registration re-sorts by DOM order, so conditionally rendered options appear in their visual position.
- Unregistering the active item moves activity to the nearest enabled neighbour (next sibling first).
- `focusStrategy`: `'roving-tabindex'` moves DOM focus (`activeTabIndex(id)` gives the tabindex); `'aria-activedescendant'` keeps focus on a host and only updates `activeId`.
- `handleKeydown(event)` maps arrows (direction aware on the horizontal axis), Home/End and single-character typeahead.
- Typeahead ignores a no-match key rather than dropping the user's position; the buffer expires after `typeaheadTimeoutMs`.

See the generated [API reference](/docs/reference/api/core) for every export.
