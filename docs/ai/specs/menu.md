# Spec: Menu (Primitives)

- **Status:** Draft
- **Branch:** feature/menu
- **Date:** 2026-08-29
- **Related:** `docs/ai/specs/directionality.md` (Core foundation this spec composes),
  `docs/ai/specs/listbox.md` (closest existing composition precedent)

## 1. Problem

Quartz has no dropdown/context menu pattern. It's the next composition primitive per
`STATE.md`'s "In progress / next up" list, and is explicitly meant to stress-test whether
Core's five foundations (Collection, Overlay, Dismiss, Focus, Directionality) are sufficient
to build a real, nested, accessible widget without adding Menu-specific infrastructure to
Core.

## 2. Goal / non-goals

- Goal: a headless, accessible Menu (trigger, items, submenus, checkbox items, radio
  items, separator) built almost entirely by composing existing Core exports, shipped in
  `@quartz-headless/primitives`.
- Non-goals: Popover, standalone Context Menu, Select, Combobox, Autocomplete, Tabs,
  Accordion, Toolbar, Sidebar, Menubar (horizontal top-level menu with left/right movement
  between top-level menus). "Safe triangle" pointer geometry for submenu hover is
  deliberately deferred (documented as a follow-up, §12 below).

## 3. Audit: Menu responsibility vs. Core responsibility

Walked each of the five foundations against what Menu needs. Headline finding: **no Core
changes are required.** Every gap that looked at first like a Core limitation resolves via
an export Core already has.

| Concern                                                               | Owner                                                                                         | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Linear next/prev/first/last, disabled-skipping, typeahead             | **Collection** (`CollectionStore`)                                                            | One `CollectionStore` per menu _level_ (root + each open submenu). `orientation: 'vertical'`, `focusStrategy: 'roving-tabindex'`. Menu is the **first real caller of `CollectionStore.handleKeydown()`** anywhere in the codebase (Listbox/Tree both reimplement their own switch — see directionality.md §4 bucket 3). Vertical orientation means the direction-aware branch in `handleKeydown` is inert here (Up/Down never depend on direction, by Collection's own documented invariant) — direction only matters for Menu's own submenu-open/close keys (see Directionality row).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Roving tabindex mechanics (`tabindex` 0/-1, `focusActive()`)          | **Collection**                                                                                | Reused via `collection.activeTabIndex(id)` / `collection.focusActive()`, exactly like `TreeNodeComponent`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Portal, positioning, flip/clamp, `mounted$`/`closed$`                 | **Overlay** (`OverlayService` / `OverlayRef`)                                                 | One `OverlayRef` per level, created directly via `OverlayService.create()` (not `OverlayTriggerDirective` — Menu needs custom initial-focus-on-open and suppresses each ref's _own_ dismiss wiring, see next row). `mounted$` gives the trigger/item the real panel element to read its generated `id` for `aria-controls` — no new API needed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Root menu placement                                                   | **Overlay**                                                                                   | `placement` input, default `'bottom-start'` (already direction-aware for its cross-axis via the existing `top/bottom-start/end` logical swap).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Submenu placement (inline-end, mirrored in RTL)                       | **Overlay + Directionality composed at the Menu layer**                                       | Overlay's `left`/`right` placements are physical-only by design (directionality.md §4 bucket 2 — no logical meaning to invent for the _main_ axis). Menu resolves the physical side itself with the **already-exported** `inlineToPhysical(resolveDirection(itemEl), 'inline-end')` → `'left' \| 'right'`, then requests `` `${side}-start` `` as the `OverlayPlacement`. This is exactly the composition Directionality's helpers were built for (its own spec says "reusable by any current or future Core/Primitives piece") — **zero Core change**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Escape / outside-pointer / scroll dismissal, nested-layer correctness | **Dismiss** (`createDismissController`)                                                       | The existing top-layer-only `layers` stack already prevents a submenu's own dismissal from bubbling into closing its parent (parent isn't top-layer while a child is open, so its listeners are inert — verified by reading `dismiss.ts`, not just assumed). The one real gap: top-layer-only semantics mean an outside click while a submenu is open would, by default, close _only_ the innermost submenu, not the whole tree — most real menus close the whole tree on an outside click. Fixed **without a second stack**: every level's own `OverlayConfig` sets `closeOnClickOutside/closeOnEscape/closeOnScroll: false` (suppressing each `OverlayRef`'s private dismiss wiring), and the **root** `MenuService` owns exactly one `createDismissController()` — the same public Core factory, still pushed onto the same shared `layers` array — configured with `rootElements` returning _every currently-open panel across all levels_. Outside-pointer/scroll close the whole tree; Escape is handled separately (see §4) to step up one level at a time per APG. This is composition of an existing public factory, not new Core surface. |
| Focus restore to trigger/parent item                                  | **Focus** (`createFocusRestorer`, `focusSafely`)                                              | Reused as-is, same pattern as `DialogService`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| LTR/RTL resolution, inline-start/end key mapping                      | **Directionality** (`resolveDirection`, `inlineToPhysical`, `inlineStartKey`, `inlineEndKey`) | Menu resolves direction live off the relevant element (matching `OverlayRef`'s own pattern — no cached/injected `DirectionalityService`, just the pure functions) and uses `inlineEndKey`/`inlineStartKey` for "open submenu" / "close submenu, return to parent" instead of hardcoding `ArrowRight`/`ArrowLeft`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

**Conclusion:** Core is untouched by this PR. Every "hypothetical" example of a legitimate
Core change listed in the brief (generic nested-dismiss handling, focus restoration helper,
collection active-item semantics, logical overlay positioning) already exists in Core from
prior work — Menu is the first primitive to actually exercise all of them together, which is
the point of this stress test.

## 4. Public API (design this FIRST)

All new exports live in `packages/primitives/src/menu/`, re-exported from
`@quartz-headless/primitives`. Nothing is added to `@quartz-headless/core`.

```ts
// menu.types.ts
export interface MenuConfig {
  /** Wrap Home/End-adjacent navigation past the first/last item. Default: true. */
  wrap: boolean;
  /** Typeahead reset window, ms. Default: 500. */
  typeaheadTimeoutMs: number;
  /** Pointer hover-intent delay before opening a submenu, ms. Default: 100. */
  submenuOpenDelayMs: number;
}
export const DEFAULT_MENU_CONFIG: MenuConfig;

/** Duck-typed shape every item-like directive (item/checkbox/radio) satisfies to join a level's CollectionStore. */
export interface MenuCollectionEntry extends CollectionItem {
  activate(): void;
}

// menu.service.ts — one instance per `qzMenu` level (providers: [MenuService])
export class MenuService {
  readonly items: Signal<readonly MenuCollectionEntry[]>;
  readonly activeId: Signal<string | null>;
  readonly isRoot: boolean;
  register(item: MenuCollectionEntry): void;
  unregister(item: MenuCollectionEntry): void;
  handleKeydown(event: KeyboardEvent): void; // Up/Down/Home/End/typeahead via CollectionStore + Menu-specific Enter/Space/inline-end/inline-start/Escape/Tab
  activeTabIndex(id: string): 0 | -1;
  // Submenu bookkeeping (one open submenu per level at a time)
  openSubmenuId: Signal<string | null>;
  requestOpenSubmenu(ownerId: string, open: () => void): void;
  closeOpenSubmenu(): void;
  // Tree-wide (meaningful only on the root instance; delegated to root otherwise)
  registerPanel(el: HTMLElement): void;
  unregisterPanel(el: HTMLElement): void;
  registerRootClose(fn: (restoreFocus: boolean) => void): void;
  closeAll(restoreFocus?: boolean): void; // default true
}

// menu.directive.ts
@Directive({ selector: '[qzMenu]', exportAs: 'qzMenu', providers: [MenuService] })
export class MenuDirective {
  readonly config = input<Partial<MenuConfig>>({});
  // host: role="menu", tabindex not set on container (roving tabindex lives on items),
  // (keydown) delegates to MenuService.handleKeydown()
}

// menu-trigger.directive.ts
@Directive({ selector: '[qzMenuTrigger]', exportAs: 'qzMenuTrigger' })
export class MenuTriggerDirective {
  readonly menu = input.required<TemplateRef<unknown>>();
  readonly placement = input<OverlayPlacement>('bottom-start');
  readonly offset = input(4);
  readonly flip = input(true);
  readonly flipAxis = input<OverlayFlipAxis>('main');
  readonly matchAnchorWidth = input(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly isOpen: Signal<boolean>;
  open(): void;
  close(): void;
  toggle(): void;
  // host: aria-haspopup="menu", [attr.aria-expanded]=isOpen(), [attr.aria-controls]=panelId(),
  // (click)=toggle(), (keydown): ArrowDown opens+focuses first, ArrowUp opens+focuses last
}

// menu-item.directive.ts
@Directive({ selector: '[qzMenuItem]', exportAs: 'qzMenuItem' })
export class MenuItemDirective implements MenuCollectionEntry {
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly submenu = input<TemplateRef<unknown> | null>(null);
  readonly closeOnSelect = input(true); // ignored when `submenu` is set (submenu owners never self-select)
  readonly selected = output<void>();
  readonly isSubmenuOpen: Signal<boolean>;
  // host: role="menuitem", [attr.tabindex], [attr.aria-disabled], [attr.data-qz-disabled],
  // [attr.data-qz-highlighted], and when `submenu` is set: aria-haspopup="menu",
  // [attr.aria-expanded], [attr.aria-controls], [attr.data-qz-open];
  // (click)/(keydown Enter/Space) activate(); (pointerenter)/(pointerleave) for hover-intent
}

// menu-separator.directive.ts
@Directive({ selector: '[qzMenuSeparator]' })
export class MenuSeparatorDirective {
  // host: role="separator", aria-orientation="horizontal" — not a CollectionItem, not focusable
}

// menu-checkbox-item.directive.ts
@Directive({ selector: '[qzMenuCheckboxItem]', exportAs: 'qzMenuCheckboxItem' })
export class MenuCheckboxItemDirective implements MenuCollectionEntry {
  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly closeOnSelect = input(false);
  readonly selected = output<void>();
  // host: role="menuitemcheckbox", [attr.aria-checked], [attr.data-qz-checked], roving tabindex like MenuItemDirective
}

// menu-radio-group.directive.ts
@Directive({ selector: '[qzMenuRadioGroup]', exportAs: 'qzMenuRadioGroup' })
export class MenuRadioGroupDirective<T> {
  readonly value = model<T | null>(null);
  readonly compareWith = input<(a: T, b: T) => boolean>(Object.is);
  // host: role="group"
}

// menu-radio-item.directive.ts
@Directive({ selector: '[qzMenuRadioItem]', exportAs: 'qzMenuRadioItem' })
export class MenuRadioItemDirective<T> implements MenuCollectionEntry {
  readonly value = input.required<T>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly closeOnSelect = input(false);
  readonly selected = output<void>();
  // host: role="menuitemradio", [attr.aria-checked], [attr.data-qz-checked], roving tabindex; registers with the enclosing MenuRadioGroupDirective (not its own separate group state) and with the level's MenuService for navigation
}
```

Template usage:

```html
<button qzMenuTrigger [menu]="fileMenu">File</button>

<ng-template #fileMenu>
  <div qzMenu>
    <button qzMenuItem (selected)="edit()">Edit</button>
    <button qzMenuItem [disabled]="true">Archive</button>

    <div qzMenuSeparator></div>

    <button qzMenuItem [submenu]="shareMenu">Share</button>
    <ng-template #shareMenu>
      <div qzMenu>
        <button qzMenuItem (selected)="emailLink()">Email</button>
        <button qzMenuItem (selected)="copyLink()">Copy link</button>
      </div>
    </ng-template>

    <div qzMenuSeparator></div>

    <button qzMenuCheckboxItem [(checked)]="showToolbar">Show toolbar</button>

    <div qzMenuRadioGroup [(value)]="align">
      <button qzMenuRadioItem value="left">Align left</button>
      <button qzMenuRadioItem value="center">Align center</button>
    </div>
  </div>
</ng-template>
```

Note the two `input`s that carry a `TemplateRef` are named after the _concept_ (`menu`,
`submenu`), with the selector left as a bare activator (`qzMenuTrigger`, `qzMenuItem`) —
this matches `OverlayTriggerDirective`'s existing `[qzOverlayTrigger] [overlayTemplate]`
split rather than a `[qzMenuTriggerFor]="tpl"` selector-as-input idiom (which would read as
a copy of Angular CDK's `cdkMenuTriggerFor`/Material's `matMenuTriggerFor` naming — avoided
per the brief). Folding submenu-ness into `MenuItemDirective` itself (an input, not a
separate `SubmenuTrigger` directive) keeps the item count down to exactly the primitives
enumerated in the brief.

## 5. Internal architecture (how the pieces actually connect)

- **One `MenuService` per `qzMenu` level**, provided via `providers: [MenuService]` on
  `MenuDirective` — same pattern as `ListboxService`/`SplitterService`. Each instance builds
  its own `CollectionStore<MenuCollectionEntry>`.
- **Parent discovery is plain Angular DI, not a new Core concept.** A submenu's
  `<ng-template>` is lexically declared _inside_ its owning `qzMenuItem`'s host template,
  which is inside the parent `qzMenu`'s element tree. `MenuItemDirective.submenu` renders
  that template via the item's own `ViewContainerRef`, so the nested `MenuDirective`'s
  `MenuService` constructor resolves its parent with
  `inject(MenuService, { skipSelf: true, optional: true })` and finds the enclosing level
  automatically — no token, no manual wiring. `OverlayRef` moving the rendered DOM into the
  body-anchored portal does not affect this: Angular's injector hierarchy follows the
  logical view tree, not DOM parentage (the same reason `DialogService`/`TooltipDirective`
  content can already inject app-level services from inside `document.body`).
- **The root is just "the level with no parent."** `MenuService.isRoot = !parent`. The root
  instance owns the tree-wide `DismissController` and the list of currently-open panel
  elements across every level; non-root instances forward tree-wide calls
  (`registerPanel`/`closeAll`) to `parent`/`root`.
- **Escape vs. outside-click/scroll/Tab have different scopes**, all Menu-specific policy
  (not Dismiss policy): Escape closes _one_ level (the deepest open one) and returns focus
  to whatever owns that level (parent menu item, or the trigger at the root); outside-click
  and scroll close the _whole_ tree via the root's single `DismissController`; Tab closes
  the whole tree too, without `preventDefault`, so native tab order proceeds (per the APG
  Menu Button pattern).
- **Focus restoration** reuses `createFocusRestorer` exactly like `DialogService`: captured
  when a level opens, invoked when that level (or the whole tree) closes.
- **Submenu placement**: resolved once per open, `` `${inlineToPhysical(resolveDirection(itemEl), 'inline-end')}-start` ``,
  passed as `OverlayConfig.placement` to that level's `OverlayService.create()` call.
- **Hover-intent**: `pointerenter` on a submenu-owning item starts a
  `submenuOpenDelayMs` timer; `pointerleave` before it fires cancels it. Opening a submenu
  always closes any other open sibling submenu at that level first (`MenuService.requestOpenSubmenu`
  enforces "one open submenu per level"). No safe-triangle geometry in this PR — see §12.

## 6. Behaviour

Numbered, testable statements.

**Basic**

1. Clicking the trigger opens the menu; clicking it again (or clicking the open trigger)
   closes it.
2. Opening via click focuses the first enabled item.
3. Opening via `ArrowDown` on the trigger focuses the first enabled item; `ArrowUp` focuses
   the last enabled item.
4. Activating a plain `qzMenuItem` (click, Enter, Space) emits `selected` and, when
   `closeOnSelect` is true (default), closes the entire tree and restores focus to the
   trigger.
5. A `disabled` item cannot be activated by pointer or keyboard and is skipped by
   Up/Down/Home/End/typeahead navigation.

**Keyboard**

6. `ArrowDown`/`ArrowUp` move the active item within the open level, wrapping past the
   ends (`wrap: true` default).
7. `Home`/`End` jump to the first/last enabled item.
8. Typeahead: consecutive printable-character keystrokes within `typeaheadTimeoutMs` build a
   query and jump to the next matching label; repeating one character cycles matches.
9. `Escape` closes the deepest open level and returns focus to: the parent item that owns
   it (submenu), or the trigger (root).
10. `Tab` closes the entire tree without trapping focus; native tab order proceeds.

**Focus**

11. Initial focus never gets stuck on the trigger while the menu is open — it always lands
    on a menu item once open.
12. Roving tabindex: exactly one item per open level has `tabindex="0"`; the rest have
    `tabindex="-1"`.
13. Closing (any reason) restores focus predictably: to the trigger for a root-tree close,
    to the parent item for a single-level Escape.

**Submenu**

14. A `qzMenuItem` with `[submenu]` opens its nested menu on click, Enter/Space, or the
    inline-end arrow key, focusing the submenu's first item.
15. The inline-start arrow key inside a submenu closes that submenu and returns focus to
    the item that owns it, without closing the parent.
16. Hovering a different sibling item that owns a submenu closes the previously-open
    submenu (after `submenuOpenDelayMs`) and opens the new one.
17. A pointer/keyboard event inside a submenu never closes an ancestor level.
18. An outside click/scroll while any submenu is open closes the _entire_ tree, not just
    the innermost submenu.

**RTL**

19. In `dir="rtl"`, the inline-end key (physically `ArrowLeft`) opens a submenu and the
    inline-start key (physically `ArrowRight`) closes it — mirrored from LTR.
20. In `dir="rtl"`, a submenu's overlay renders on the physical left of its owning item
    (`left-start`), not the right.

**Checkbox / Radio**

21. `qzMenuCheckboxItem` toggles `checked` on activation and reflects it via
    `aria-checked`/`data-qz-checked`; does not close the menu by default
    (`closeOnSelect: false`).
22. `qzMenuRadioItem`s sharing a `qzMenuRadioGroup` are mutually exclusive; selecting one
    updates the group's `value` and every item's `aria-checked` accordingly; does not close
    the menu by default.
23. Checkbox/radio items participate in the same roving-tabindex/typeahead sequence as
    plain items (not a separate focus zone).

### Keyboard & ARIA (mandatory for primitives)

| Key / attribute                                            | Behaviour                                              |
| ---------------------------------------------------------- | ------------------------------------------------------ |
| `ArrowDown` / `ArrowUp`                                    | Move active item within the open level (wraps)         |
| `Home` / `End`                                             | First / last enabled item                              |
| Typeahead (printable char)                                 | Jump to next label match                               |
| `Enter` / `Space`                                          | Activate active item (select, toggle, open submenu)    |
| Inline-end key (`ArrowRight` in ltr)                       | Open active item's submenu, focus its first item       |
| Inline-start key (`ArrowLeft` in ltr)                      | Inside a submenu: close it, focus owning item          |
| `Escape`                                                   | Close deepest open level, focus its owner              |
| `Tab`                                                      | Close entire tree, native tab order proceeds           |
| `role="menu"`                                              | `qzMenu` host                                          |
| `role="menuitem"`                                          | `qzMenuItem` host                                      |
| `role="menuitemcheckbox"` + `aria-checked`                 | `qzMenuCheckboxItem` host                              |
| `role="menuitemradio"` + `aria-checked`                    | `qzMenuRadioItem` host                                 |
| `role="separator"`                                         | `qzMenuSeparator` host                                 |
| `role="group"`                                             | `qzMenuRadioGroup` host                                |
| `aria-haspopup="menu"` + `aria-expanded` + `aria-controls` | `qzMenuTrigger`, and any `qzMenuItem` with `[submenu]` |
| `aria-disabled`                                            | Any item-like directive when `disabled`                |

### SSR behaviour

No `window`/`document` access at import time or in field initializers (every directive
reads `DOCUMENT` via `inject()`, matching the rest of the library). With no `defaultView`,
`OverlayService`/`OverlayRef` already no-op (existing SSR guard) — `MenuTriggerDirective`
and submenu-owning `MenuItemDirective` degrade the same way: `open()` becomes a no-op,
`isOpen` stays `false`, no DOM is created. Covered by a `menu.ssr.spec.ts` mirroring
`dialog.service.ssr.spec.ts`.

## 7. Files to create / modify

| File                                                            | Action | Purpose                                                                    |
| --------------------------------------------------------------- | ------ | -------------------------------------------------------------------------- |
| `packages/primitives/src/menu/menu.types.ts`                    | create | `MenuConfig`, `DEFAULT_MENU_CONFIG`, `MenuCollectionEntry`                 |
| `packages/primitives/src/menu/menu.service.ts`                  | create | per-level service + root/tree coordination                                 |
| `packages/primitives/src/menu/menu.directive.ts`                | create | `[qzMenu]` container                                                       |
| `packages/primitives/src/menu/menu-trigger.directive.ts`        | create | `[qzMenuTrigger]`                                                          |
| `packages/primitives/src/menu/menu-item.directive.ts`           | create | `[qzMenuItem]` (+ submenu)                                                 |
| `packages/primitives/src/menu/menu-separator.directive.ts`      | create | `[qzMenuSeparator]`                                                        |
| `packages/primitives/src/menu/menu-checkbox-item.directive.ts`  | create | `[qzMenuCheckboxItem]`                                                     |
| `packages/primitives/src/menu/menu-radio-group.directive.ts`    | create | `[qzMenuRadioGroup]`                                                       |
| `packages/primitives/src/menu/menu-radio-item.directive.ts`     | create | `[qzMenuRadioItem]`                                                        |
| `packages/primitives/src/menu/index.ts`                         | create | barrel                                                                     |
| `packages/primitives/src/menu/*.spec.ts` (≈8-9 files)           | create | unit + SSR + RTL/submenu coverage                                          |
| `packages/primitives/src/public-api.ts`                         | edit   | export Menu                                                                |
| `cli/registry.js`                                               | edit   | `menu` entry, `layer: 'primitives'`, `peerDeps: ['@quartz-headless/core']` |
| `cli/cli.smoke.spec.js`                                         | edit   | account for new registry entry if it enumerates components                 |
| `e2e/behavior.spec.ts`                                          | edit   | new `Menu behavior` `describe` block                                       |
| `src/app/pages/(docs)/menu.page.{ts,html}` + `menu.snippets.ts` | create | demo                                                                       |
| `src/app/app.config.ts`                                         | edit   | `extraRoutes` entry (known Vite cache workaround)                          |
| `src/app/components/sidebar/sidebar.component.ts`               | edit   | nav entry                                                                  |
| `README.md`                                                     | edit   | primitive table row                                                        |
| `docs/ai/STATE.md`                                              | edit   | matrix row + date, once Done                                               |

**No files under `packages/core/` are modified.**

## 8. Test plan

Unit (mirrors §6 numbering, one spec per behaviour group):

- Basic open/close/select/disabled — `menu.directive.spec.ts`, `menu-item.directive.spec.ts`
- Keyboard (arrows/home/end/typeahead/enter/space/escape/tab) — `menu.directive.spec.ts`
- Focus (initial, roving tabindex, restore-on-close) — `menu-trigger.directive.spec.ts`
- Submenu (pointer open, keyboard open/close, nested dismiss, focus return) —
  `menu-submenu.spec.ts`
- RTL (mirrored keys, mirrored placement) — cases inside `menu-submenu.spec.ts`
- Checkbox — `menu-checkbox-item.directive.spec.ts`
- Radio — `menu-radio-item.directive.spec.ts`
- SSR — `menu.ssr.spec.ts`

E2E (`e2e/behavior.spec.ts`, new `Menu behavior` describe block):

- Open with pointer, select item
- Open with keyboard, navigate entirely via keyboard
- Escape restores focus to trigger
- Disabled items skipped
- Typeahead works
- Open submenu via keyboard, navigate it, return to parent
- Same submenu flow in RTL (a demo page with a `dir="rtl"` wrapper section)
- Click outside closes the whole menu (including an open submenu)

## 9. Definition of done

- [ ] All §6 behaviours implemented and tested
- [ ] WORKFLOW.md "add a NEW primitive" checklist completed
- [ ] `pnpm lint && pnpm typecheck && pnpm test` green
- [ ] `pnpm e2e` green
- [ ] `pnpm build:lib` (core then primitives) and `pnpm verify:build` green
- [ ] CLI (`quartz add menu`) smoke-tested
- [ ] `docs/ai/STATE.md` updated

## 10. Open questions

None blocking — defaults chosen and documented above (roving tabindex over
aria-activedescendant, `closeOnSelect` default `true`/`false`/`false` for item/checkbox/
radio, `submenuOpenDelayMs: 100`, unconditional focus-restore on tree close). Flagging one
non-blocking judgment call for awareness rather than approval: **outside-click and Tab both
close the whole tree** (not just the top level) — this matches common real-world menu
behavior (native OS menus, most web implementations) but is a deliberate product choice
rather than something APG mandates outright. Happy to change if a different behavior is
preferred.
