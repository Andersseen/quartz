# Spec: Listbox primitive

- **Status:** Draft — needs user approval before implementation
- **Branch:** feature/listbox
- **Date:** 2026-07-06
- **Related:** README table (marked "coming soon"), `cli/registry.js` (`soon: true`),
  empty folder `packages/quartz/src/lib/listbox/`, placeholder page `(docs)/listbox.page.ts`

> This spec is pre-written as a starting point because listbox is the declared next
> primitive. An agent picking this up must review §3/§8 with the user before coding.

## 1. Problem

Quartz has no selection primitive. Consumers building selects, comboboxes, or command
palettes must hand-roll WAI-ARIA listbox semantics (roving focus/active-descendant,
typeahead, single/multi selection) — exactly the hard behavioural work Quartz exists to own.

## 2. Goal / non-goals

- **Goal:** a headless WAI-ARIA listbox: keyboard navigation, single & multi selection,
  typeahead, disabled options — unstyled, zoneless, SSR-safe.
- **Non-goals:** no combobox/autocomplete (separate future primitive that would _compose_
  listbox + overlay), no built-in filtering, no virtual scroll integration in v1, no styles.

## 3. Public API (proposal — confirm with user)

Directive-based (host elements stay consumer-owned, like splitter):

```ts
// listbox.directive.ts — container, role="listbox"
@Directive({ selector: '[qzListbox]' })
class ListboxDirective<T> {
  value = model<T | T[] | null>(); // two-way selection
  multiple = input(false, { transform: booleanAttribute });
  orientation = input<'vertical' | 'horizontal'>('vertical');
  disabled = input(false, { transform: booleanAttribute });
}

// listbox-option.directive.ts — role="option"
@Directive({ selector: '[qzListboxOption]' })
class ListboxOptionDirective<T> {
  qzListboxOption = input.required<T>(); // option value
  optionDisabled = input(false, { transform: booleanAttribute });
}

// listbox.types.ts
interface ListboxConfig {
  typeaheadTimeoutMs: number; /* … */
}
const DEFAULT_LISTBOX_CONFIG: ListboxConfig;
```

Selection state coordinated by a container-scoped `ListboxService` (splitter pattern:
`providers: [ListboxService]` on the container directive). Expose state to consumers via
data attributes: `data-qz-selected`, `data-qz-active`, `data-qz-disabled`.

## 4. Behaviour

1. Container gets `role="listbox"`, `tabindex="0"`, `aria-multiselectable` when multiple.
2. Options get `role="option"`, `aria-selected`, unique ids; container tracks active option
   via `aria-activedescendant`.
3. ArrowDown/ArrowUp (or Left/Right when horizontal) move the active option, skipping
   disabled options; Home/End jump to first/last enabled option.
4. Enter/Space selects the active option; in multiple mode it toggles.
5. Click on an option selects it (toggle in multiple mode); disabled options are inert.
6. Type-ahead: printable characters accumulate for `typeaheadTimeoutMs` and move the
   active option to the next match.
7. `value` model updates reactively (signals); programmatic writes update DOM state.
8. Focus leaving the listbox keeps selection; re-focus restores last active option.

### Keyboard & ARIA

| Key / attribute                                                                   | Behaviour                             |
| --------------------------------------------------------------------------------- | ------------------------------------- |
| ArrowDown/Up (or Right/Left)                                                      | move active descendant, skip disabled |
| Home / End                                                                        | first / last enabled option           |
| Enter / Space                                                                     | select / toggle active option         |
| a–z typeahead                                                                     | jump to next matching option label    |
| `aria-activedescendant`, `aria-selected`, `aria-multiselectable`, `aria-disabled` | as per WAI-ARIA listbox pattern       |

### SSR behaviour

Pure directives on consumer DOM — nothing to guard beyond not reading `document` at
import time. Renders inert HTML on the server; keyboard wiring activates in browser.

## 5. Files to create / modify

| File                                                          | Action      | Purpose                                 |
| ------------------------------------------------------------- | ----------- | --------------------------------------- |
| `packages/quartz/src/lib/listbox/listbox.types.ts`            | create      | interfaces + DEFAULT_LISTBOX_CONFIG     |
| `packages/quartz/src/lib/listbox/listbox.service.ts`          | create      | container-scoped selection/active state |
| `packages/quartz/src/lib/listbox/listbox.directive.ts`        | create      | container host directive                |
| `packages/quartz/src/lib/listbox/listbox-option.directive.ts` | create      | option host directive                   |
| `packages/quartz/src/lib/listbox/index.ts`                    | create      | barrel                                  |
| `packages/quartz/src/lib/listbox/*.spec.ts`                   | create      | unit tests                              |
| `packages/quartz/src/public-api.ts`                           | edit        | export listbox API                      |
| `cli/registry.js`                                             | edit        | fill `files`, drop `soon: true`         |
| `src/app/pages/(docs)/listbox.page.*` + `listbox.snippets.ts` | edit/create | real demo                               |
| `README.md`                                                   | edit        | remove "coming soon"                    |
| `docs/ai/STATE.md`                                            | edit        | flip matrix row                         |

## 6. Test plan

Unit (host-component pattern, one test per §4 item): rendering roles/ids, arrow
navigation incl. disabled skip, Home/End, Enter/Space single + multiple, click selection,
typeahead with fake timers, model two-way sync. E2E: select an option via keyboard on the
demo page.

## 7. Definition of done

- [ ] All §4 behaviours implemented and tested
- [ ] "New primitive" checklist in WORKFLOW.md completed
- [ ] `pnpm lint && pnpm typecheck && pnpm test` green
- [ ] `docs/ai/STATE.md` updated

## 8. Open questions

1. Directive-based API (proposed) vs rendered `qz-listbox` component (tree-style)?
2. Should v1 include `compareWith`-style equality input for object values?
3. Horizontal orientation in v1 or defer?
