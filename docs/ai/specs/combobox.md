# Spec: Combobox primitive

- **Status:** Draft
- **Branch:** main / post-0.1.0 planning
- **Date:** 2026-08-31
- **Related:** `docs/ai/specs/listbox.md`, `docs/ai/specs/menu.md`,
  `docs/ai/specs/directionality.md`
- **External references:** WAI-ARIA APG Combobox Pattern
  (<https://www.w3.org/WAI/ARIA/apg/patterns/combobox/>), WAI-ARIA APG Listbox Pattern
  (<https://www.w3.org/WAI/ARIA/apg/patterns/listbox/>)

## 1. Problem

Quartz has Listbox, Popover, Menu and the Core foundations needed for an editable
suggestions widget, but it does not yet have a Combobox primitive. Combobox is not just
"Listbox in an overlay": editable input changes the focus model, keyboard contract, ARIA
owner, filtering story, IME handling and state transitions.

This spec defines an implementable architecture for the first Combobox build step after
`0.1.0`. It deliberately does **not** implement the primitive.

## 2. Goals

- Build an editable, single-selection Combobox primitive for
  `@quartz-headless/primitives`.
- Model the modern WAI-ARIA combobox pattern where the editable `<input>` carries
  `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete` and
  `aria-activedescendant`.
- Keep DOM focus on the input while visual/assistive focus moves through suggestions via
  active descendant.
- Separate `inputValue`, active option, committed selected value, open state and filtered
  options.
- Reuse existing Quartz Core foundations and Listbox behaviour where that is clean.
- Stay signal-first, standalone, zoneless and SSR-safe.
- Support object values with `displayWith` and `compareWith`.
- Support static, controlled-filtered and asynchronously replaced options without adding a
  fetching abstraction.
- Handle IME composition explicitly.

## 3. Non-goals

- Select-only combobox.
- MultiCombobox, MultiSelect, TagsInput or tokenized input.
- Command Palette.
- Separate Autocomplete primitive.
- Virtualized combobox.
- Grid, tree or dialog popups.
- Fuzzy search or ranking.
- Remote fetching API.
- Full forms framework or required immediate `ControlValueAccessor`.
- Deep browser autofill/password/autocomplete control.

## 4. Core and Primitive Audit

The audit below is based on the current implementations under:

- `packages/core/src/collection`
- `packages/core/src/overlay`
- `packages/core/src/dismiss`
- `packages/core/src/focus`
- `packages/core/src/directionality`
- `packages/primitives/src/listbox`
- `packages/primitives/src/popover`
- `packages/primitives/src/menu`

| Combobox requirement                          | Existing Quartz owner                     | Reuse / extend / missing                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DOM-order option registry                     | Core `CollectionStore`                    | **Reuse.** It registers items, sorts by DOM order, skips disabled items, exposes `items`, `enabledItems`, `activeId` and `activeItem`.                                                                                                                                                                                            |
| Active option without moving DOM focus        | Core `CollectionStore`                    | **Reuse.** Its default `focusStrategy` is `'aria-activedescendant'`; navigation methods can update `activeId` without focusing option elements.                                                                                                                                                                                   |
| Roving focus                                  | Core `CollectionStore`, Menu              | **Do not use for Combobox.** Combobox is not roving-tabindex; the input keeps DOM focus.                                                                                                                                                                                                                                          |
| Typeahead                                     | Core `CollectionStore`, Listbox, Menu     | **Do not reuse for filtering.** Collection typeahead maps printable keypresses to existing labels; Combobox typing changes real input text and filtering derives from `inputValue`.                                                                                                                                               |
| Active recovery when active option is removed | Core `CollectionStore`                    | **Partial reuse.** `unregister()` moves active to the first enabled item only when the active item unregisters. Async replacement can work if options are directive-projected and unregister/register normally. A data-driven implementation must mirror this behaviour.                                                          |
| Single selection                              | Listbox                                   | **Reuse conceptually, not by direct directive composition.** Listbox's `value`, `compareWith` and disabled selection guards are the right model.                                                                                                                                                                                  |
| Multi selection                               | Listbox                                   | **Out of scope.** Do not carry Listbox's `multiple` API into Combobox v1.                                                                                                                                                                                                                                                         |
| `aria-activedescendant` ownership             | Listbox                                   | **Extend via a small shared behaviour or separate Combobox directives.** Current `ListboxDirective` writes `aria-activedescendant` on the listbox container. Combobox must write it on the input.                                                                                                                                 |
| Listbox option directive                      | `ListboxOptionDirective`                  | **Not reusable directly.** It injects `ListboxDirective`, computes `aria-selected` from committed Listbox value and registers with Listbox. Combobox options need to inject Combobox, expose active suggestion separately from committed selection and may use different `aria-selected` semantics.                               |
| Keyboard navigation among options             | Listbox + Core Collection                 | **Reuse Collection methods; do not reuse Listbox container keydown wholesale.** Combobox must intercept only Combobox keys from the input and leave native editing keys alone.                                                                                                                                                    |
| Popup rendering                               | Core `OverlayService` / `OverlayRef`      | **Reuse directly.** Overlay already supports portals, `bottom-start`, offset, flip, `mounted$`, `closed$`, scroll close and `matchAnchorWidth`.                                                                                                                                                                                   |
| Popover trigger abstraction                   | `PopoverTriggerDirective`                 | **Do not compose directly.** Popover trigger focuses/restores around a trigger and owns trigger ARIA. Combobox needs the input to be trigger, value owner and focus owner. The useful pattern is its controlled `model()` sync.                                                                                                   |
| Outside pointer dismissal                     | Core `Dismiss` via Overlay                | **Reuse.** Overlay's dismiss excludes anchor and treats panel roots as inside. Combobox should include input/trigger and panel as roots/exclusions so clicks inside suggestions do not close before selection.                                                                                                                    |
| Focus outside / blur close                    | Core `Dismiss`                            | **Reuse carefully.** `focusOutside` exists in Dismiss but Overlay does not expose it in `OverlayConfig`. Combobox can use a small Combobox-owned `createDismissController()` if focus-outside close is required; otherwise close on input blur with queued related-target checks. Prefer Dismiss over bespoke document listeners. |
| Escape close                                  | Core `Dismiss`, Combobox input keydown    | **Use input keydown as primary.** Escape must close without moving focus. Overlay's Escape close is acceptable if it does not fight the input handler, but Combobox-specific state rollback/preservation means input handler should own it.                                                                                       |
| Focus restore                                 | Core `focusSafely`, `createFocusRestorer` | **Mostly unnecessary.** DOM focus should never leave input during normal operation. Use `focusSafely(input)` after pointer selection if the browser moves focus.                                                                                                                                                                  |
| RTL / direction                               | Core Directionality, Collection           | **Reuse for horizontal cases only if added later.** Vertical suggestions use physical Up/Down. `bottom-start` already resolves against anchor direction in Overlay.                                                                                                                                                               |
| Stable ids                                    | Current primitives use module counters    | **Needs a Combobox-specific policy.** Current counters are deterministic within a process but can mismatch under SSR/hydration if server and client render different instance counts. Combobox should allow explicit ids and generate deterministic per-instance ids only during directive construction, not random ids.          |
| SSR no DOM at import time                     | Core foundations                          | **Reuse pattern.** Overlay guards `document.defaultView`; Focus and Dismiss guard browser-only work; Directionality is pure attribute walking. Combobox must not create DOM/listeners until instance lifecycle.                                                                                                                   |

### Conclusion on Listbox Reuse

Choose **B: Combobox reuses parts but needs a small generic improvement in Listbox or a
shared lower behaviour**, not direct reuse of `ListboxDirective` and
`ListboxOptionDirective`.

Why:

- `ListboxService` is already close to a reusable option registry and active-descendant
  controller, but its public type is tied to `ListboxOptionDirective<unknown>`.
- `ListboxDirective` assumes the listbox container is tabbable and handles keydown itself.
  Combobox needs keydown on the input and must preserve native editing behaviour.
- `ListboxOptionDirective` assumes a `ListboxDirective` parent and maps `aria-selected` to
  committed Listbox selection. Combobox needs active suggestion, committed selected value
  and input text to be distinct.
- Direct composition would either produce duplicate ARIA (`aria-activedescendant` on both
  input and popup), invalid focus assumptions, or hidden coupling through the listbox's
  selection API.

Recommended implementation path:

1. Add a **private primitives-level shared option controller** only if implementation shows
   real duplication between `ListboxService` and `ComboboxService`.
2. Keep it small: Collection wrapper + option registry + selection helpers, not a new Core
   abstraction and not a public "SelectableCollection" unless repeated by a third primitive.
3. For the first build, it is acceptable for Combobox to use `CollectionStore` directly and
   duplicate a small amount of Listbox selection code. If duplication grows beyond
   registration, disabled skip, active id and `compareWith`, extract then.

Core remains unchanged for the first implementation.

## 5. Proposed Public API

Directive-based, headless, projected-template-first. No rendered component is required.

```ts
// combobox.types.ts
import type { OverlayFlipAxis, OverlayPlacement } from '@quartz-headless/core';

export type ComboboxAutocomplete = 'none' | 'list';
export type ComboboxOpenOnFocus = boolean;
export type ComboboxOpenReason = 'focus' | 'input' | 'keyboard' | 'trigger' | 'programmatic';
export type ComboboxCloseReason =
  | 'escape'
  | 'selection'
  | 'outside-pointer'
  | 'focus-outside'
  | 'tab'
  | 'scroll'
  | 'programmatic';

export interface ComboboxConfig<T> {
  placement: OverlayPlacement; // default 'bottom-start'
  offset: number; // default 4
  flip: boolean; // default true
  flipAxis: OverlayFlipAxis; // default 'main'
  matchAnchorWidth: boolean; // default true
  autocomplete: ComboboxAutocomplete; // default 'list'
  openOnFocus: boolean; // default false
  openOnTyping: boolean; // default true
  closeOnSelect: boolean; // default true
  closeOnEscape: boolean; // default true
  closeOnOutsidePointer: boolean; // default true
  closeOnFocusOutside: boolean; // default true
  allowFreeform: boolean; // default false for v1
  resetActiveOnClose: boolean; // default true
  filter: ComboboxFilter<T> | null; // default contains match
}

export type ComboboxFilter<T> = (option: T, query: string, label: string) => boolean;
export type ComboboxDisplayWith<T> = (value: T) => string;
export type ComboboxCompareWith<T> = (a: T, b: T) => boolean;

export const DEFAULT_COMBOBOX_CONFIG: ComboboxConfig<unknown>;
```

```ts
// combobox.directive.ts
@Directive({
  selector: '[qzCombobox]',
  exportAs: 'qzCombobox',
  standalone: true,
  providers: [ComboboxService],
})
export class ComboboxDirective<T> {
  readonly value = model<T | null>(null);
  readonly inputValue = model('');
  readonly open = model(false);

  readonly content = input<TemplateRef<unknown> | null>(null);
  readonly options = input<readonly T[] | null>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly filter = input<ComboboxFilter<T> | null>(DEFAULT_COMBOBOX_CONFIG.filter);
  readonly displayWith = input<ComboboxDisplayWith<T>>(defaultDisplayWith);
  readonly compareWith = input<ComboboxCompareWith<T>>(Object.is);
  readonly allowFreeform = input(DEFAULT_COMBOBOX_CONFIG.allowFreeform, {
    transform: booleanAttribute,
  });
  readonly config = input<Partial<ComboboxConfig<T>>>({});

  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly selected = output<T | null>();
  readonly inputValueChangeCommitted = output<string>();

  readonly isOpen: Signal<boolean>;
  readonly activeId: Signal<string | null>;
  readonly activeOption: Signal<ComboboxOptionDirective<T> | null>;
  readonly filteredOptions: Signal<readonly T[]>;
  readonly empty: Signal<boolean>;

  openPopup(reason?: ComboboxOpenReason): void;
  closePopup(reason?: ComboboxCloseReason): void;
  togglePopup(): void;
  selectActive(): void;
  selectOption(option: ComboboxOptionDirective<T>): void;
  setActive(id: string | null): void;
}
```

```ts
// combobox-input.directive.ts
@Directive({
  selector: 'input[qzComboboxInput]',
  exportAs: 'qzComboboxInput',
  standalone: true,
  host: {
    '[attr.role]': '"combobox"',
    '[attr.aria-expanded]': 'combobox.isOpen()',
    '[attr.aria-controls]': 'combobox.isOpen() ? combobox.panelId() : null',
    '[attr.aria-activedescendant]': 'combobox.activeId()',
    '[attr.aria-autocomplete]': 'combobox.autocomplete()',
    '[attr.aria-disabled]': 'combobox.disabled() || null',
    '[attr.data-qz-open]': 'combobox.isOpen() ? "" : null',
    '[attr.data-qz-disabled]': 'combobox.disabled() ? "" : null',
    '(input)': 'onInput($event)',
    '(focus)': 'onFocus()',
    '(keydown)': 'onKeydown($event)',
    '(compositionstart)': 'onCompositionStart()',
    '(compositionend)': 'onCompositionEnd($event)',
  },
})
export class ComboboxInputDirective {}
```

```ts
// combobox-content.directive.ts
@Directive({
  selector: 'ng-template[qzComboboxContent]',
  exportAs: 'qzComboboxContent',
  standalone: true,
})
export class ComboboxContentDirective {
  readonly templateRef: TemplateRef<unknown>;
}
```

```ts
// combobox-listbox.directive.ts
@Directive({
  selector: '[qzComboboxListbox]',
  exportAs: 'qzComboboxListbox',
  standalone: true,
  host: {
    '[attr.id]': 'combobox.panelId()',
    '[attr.role]': '"listbox"',
    '[attr.aria-busy]': 'combobox.loading() || null',
    '[attr.data-qz-combobox-listbox]': '""',
    '[attr.data-qz-open]': 'combobox.isOpen() ? "" : null',
    '[attr.data-qz-loading]': 'combobox.loading() ? "" : null',
  },
})
export class ComboboxListboxDirective {}
```

```ts
// combobox-option.directive.ts
@Directive({
  selector: '[qzComboboxOption]',
  exportAs: 'qzComboboxOption',
  standalone: true,
  host: {
    '[attr.id]': 'id',
    '[attr.role]': '"option"',
    '[attr.aria-selected]': 'active()',
    '[attr.aria-disabled]': 'optionDisabled() || null',
    '[attr.data-qz-active]': 'active() ? "" : null',
    '[attr.data-qz-selected]': 'selected() ? "" : null',
    '[attr.data-qz-disabled]': 'optionDisabled() ? "" : null',
    '(mousedown)': 'onPointerDown($event)',
    '(click)': 'onClick($event)',
  },
})
export class ComboboxOptionDirective<T> implements CollectionItem {
  readonly qzComboboxOption = input.required<T>();
  readonly qzComboboxOptionDisabled = input(false, { transform: booleanAttribute });
  readonly qzComboboxOptionLabel = input<string | null>(null);

  readonly id: string;
  readonly value: InputSignal<T>;
  readonly optionDisabled: InputSignal<boolean>;
  readonly label: Signal<string>;
  readonly active: Signal<boolean>;
  readonly selected: Signal<boolean>;
  readonly element: () => HTMLElement;
  readonly disabled: () => boolean;
}
```

```ts
// combobox-trigger.directive.ts, optional explicit trigger button
@Directive({
  selector: '[qzComboboxTrigger]',
  exportAs: 'qzComboboxTrigger',
  standalone: true,
  host: {
    '[attr.type]': 'hostIsButton ? "button" : null',
    '[attr.tabindex]': '-1',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-controls]': 'combobox.isOpen() ? combobox.panelId() : null',
    '[attr.aria-expanded]': 'combobox.isOpen()',
    '[attr.data-qz-open]': 'combobox.isOpen() ? "" : null',
    '(click)': 'onClick($event)',
  },
})
export class ComboboxTriggerDirective {}
```

No `qzComboboxEmpty` or `qzComboboxLoading` directive is proposed for v1. Empty/loading
content has no required behaviour beyond normal projected markup; the root/listbox exposes
`empty`, `loading`, `data-qz-loading` and `aria-busy` for consumers.

### Public exports

`packages/primitives/src/combobox/index.ts` should export:

- `ComboboxDirective`
- `ComboboxInputDirective`
- `ComboboxContentDirective`
- `ComboboxListboxDirective`
- `ComboboxOptionDirective`
- `ComboboxTriggerDirective`
- `DEFAULT_COMBOBOX_CONFIG`
- public types from `combobox.types.ts`

`ComboboxService` should start as internal unless examples prove consumers need imperative
service access beyond `exportAs="qzCombobox"`.

## 6. API Shape Decision

Evaluated options:

| Model                                             | Result                                                                                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Compose `<div qzListbox>` inside Combobox         | Rejected for v1. Puts `tabindex` and key handling on the popup container, duplicates active-descendant ownership and ties options to Listbox selection semantics.  |
| Data-driven only (`[options]` renders everything) | Rejected as the primary API. It is easy but not headless enough; consumers lose markup control for avatars, groups, descriptions and custom empty/loading content. |
| Projected options only                            | Accepted as the core headless model. It matches current Listbox/Menu style and lets Collection sort by DOM order.                                                  |
| Hybrid projected + optional `[options]`           | Accepted carefully. `[options]` can be a convenience source for filtering examples, but the primary rendered options are still `qzComboboxOption` directives.      |
| Template-ref content API                          | Accepted. Overlay needs a `TemplateRef`; `qzComboboxContent` marks the suggestions template without copying Popover's trigger semantics.                           |

Recommended usage shape:

```html
<div qzCombobox #combo="qzCombobox" [content]="content" [options]="fruits">
  <input qzComboboxInput />

  <ng-template #content qzComboboxContent>
    <ul qzComboboxListbox>
      @for (fruit of combo.filteredOptions(); track fruit) {
      <li [qzComboboxOption]="fruit">{{ fruit }}</li>
      } @if (combo.empty()) {
      <li>No results</li>
      }
    </ul>
  </ng-template>
</div>
```

## 7. ARIA Model

- The editable `<input qzComboboxInput>` is the combobox element.
- The input gets `role="combobox"`.
- The input gets `aria-expanded="true|false"`.
- The input gets `aria-controls="<panel id>"` while open. It may keep the id while closed,
  but v1 should prefer setting it only while open to match APG guidance and avoid dangling
  references before the overlay exists.
- The input gets `aria-activedescendant="<active option id>"` when an enabled option is
  active, otherwise no attribute.
- The input gets `aria-autocomplete="list"` by default when filtering/suggestions are tied
  to typed text, or `"none"` when configured for unfiltered recent values.
- `aria-haspopup` is optional because `combobox` implies `listbox`. Do not set it unless a
  future popup type is not a listbox.
- The popup gets `role="listbox"`.
- Suggestions get `role="option"`.
- Disabled suggestions get `aria-disabled="true"`.
- While open, `aria-selected` on options should represent the currently active suggested
  option for assistive technology focus inside the popup. Committed selection remains
  separate and is exposed as `data-qz-selected`. This keeps APG "selection follows focus in
  the popup" compatible with Quartz's committed value model.
- Do not create an extra wrapper with `role="combobox"` around the input.
- Do not override native labeling. A normal `<label for>` should remain the preferred label
  path for input hosts.

## 8. Focus Model

Combobox has three separate concepts:

| Concept        | Meaning                                                                                                                      | Owner                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| DOM focus      | The real browser focus target. It remains on `<input qzComboboxInput>` during typing and suggestion navigation.              | `ComboboxInputDirective`              |
| Active option  | The suggestion currently highlighted/announced through `aria-activedescendant`. It can change without DOM focus moving.      | `ComboboxService` + `CollectionStore` |
| Selected value | The committed app value selected by click/Enter or controlled programmatically. It does not have to equal the active option. | `ComboboxDirective.value`             |

Valid state example:

```text
inputValue: "app"
active option: Apple
selected value: null
open: true
```

Pointer selection may cause the browser to focus the clicked option if the consumer renders
focusable markup. `qzComboboxOption` should prevent default on `mousedown`/`pointerdown`
where needed, select on click, and call `focusSafely(input)` after selection if focus moved.

The popup and options should not be in the page Tab sequence. Consumers may put clickable
content inside the panel later, but v1 should document that interactive children inside an
option are unsupported because they conflict with the active-descendant model.

## 9. State Model

Required separate state:

- `inputValue`: text currently in the input.
- `activeId` / active option: highlighted suggestion.
- `value`: committed selection, `T | null`.
- `open`: popup visibility.
- `filteredOptions`: derived from `options`, `inputValue` and optional filter.
- `loading`: consumer-provided boolean; no fetching built into Quartz.
- `disabled`: disables input, trigger, opening and selection.

Controlled/uncontrolled balance:

- `value = model<T | null>(null)`: controllable committed value.
- `inputValue = model('')`: controllable input text.
- `open = model(false)`: controllable popup state, following Popover's pattern.
- `disabled = input(false)`: controlled only.
- `loading = input(false)`: controlled only.
- Active option is not externally controlled in v1; expose imperative `setActive()` via
  `exportAs` for advanced cases.

Synchronization rules:

1. Initial `value` sets initial `inputValue` through `displayWith(value)` unless
   `inputValue` is explicitly bound by the consumer.
2. Typing updates `inputValue`, opens when `openOnTyping` is true, re-filters options and
   clears committed `value` in strict mode only after the typed text no longer equals the
   displayed selected value.
3. Programmatic `value` updates set `inputValue = displayWith(value)` unless the user is
   actively composing text.
4. Programmatic `inputValue` updates re-filter options and may clear active option if no
   longer present.
5. Closing does not commit the active option.

## 10. Filtering

Combobox should support both simple defaults and full consumer control.

Chosen model: **Option C, optional filter callback with controlled escape hatch**.

- If `[options]` and `filter` are provided, `filteredOptions` is computed by Quartz.
- Default filter is a small case-insensitive `label.includes(query)` check after trimming
  query. It is not fuzzy search.
- If consumers want server-side filtering, they pass already-filtered `options` and set
  `[filter]="null"` or a function that returns `true`.
- Filtering uses `displayWith(option)` or explicit `qzComboboxOptionLabel` for labels.
- Collection typeahead is not used for filtering and printable keydown is not intercepted.

Async tolerance:

- Combobox does not fetch.
- `loading` can be toggled by the consumer while options are replaced.
- Late responses are a consumer data problem; Quartz remains stable if `options` changes.
- When options are replaced, if the active id unregisters, active moves to the first enabled
  option or `null`. If the committed value still compares equal to a new option, selected
  state recovers through `compareWith`.
- Empty results are representable by `combo.empty()` and normal projected content.

## 11. Open and Close Behaviour

Open:

| Trigger                       | Behaviour                                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Input focus                   | Opens only when `openOnFocus` is true. Default false to avoid surprising virtual keyboard/browser autocomplete interactions. |
| Typing/input event            | Opens when `openOnTyping` is true and Combobox is enabled. Default true.                                                     |
| ArrowDown                     | Opens if closed and activates first enabled option; if open, activates next. Prevent default.                                |
| ArrowUp                       | Opens if closed and activates last enabled option; if open, activates previous. Prevent default.                             |
| Explicit trigger click        | Toggles open. Trigger is optional and not in Tab order by default.                                                           |
| Programmatic `open.set(true)` | Opens if enabled and browser DOM is available.                                                                               |

Close:

| Trigger              | Behaviour                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Escape               | If open, close, keep focus on input, do not commit active option. In strict mode restore input to committed selected display; in freeform mode preserve typed input. |
| Enter selection      | Select active enabled option, update `value`, update `inputValue`, close when `closeOnSelect` is true, keep focus on input.                                          |
| Outside pointer      | Close without committing active option. Keep or restore focus only if useful; do not steal focus from the actual outside target.                                     |
| Focus outside / blur | Close after queued related-target check if focus moved outside input, trigger and panel.                                                                             |
| Tab                  | Close without `preventDefault`; allow native focus movement. Do not commit active option.                                                                            |
| No results           | Default: stay open so empty content can render. Consumers can close via controlled `open`.                                                                           |
| Scroll               | Close through Overlay default unless future usability testing says input-bound suggestions should reposition instead.                                                |

## 12. Keyboard Contract

The input owns keydown. Combobox intercepts only keys that are part of the combobox pattern.

| Key                         | Behaviour                                                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ArrowDown                   | Prevent default. Open if closed. If open, activate next enabled option, wrapping by default through Collection config.                                                   |
| ArrowUp                     | Prevent default. Open if closed. If open, activate previous enabled option.                                                                                              |
| Enter                       | If open and active enabled option exists, prevent default and select it. Otherwise leave native form submit behaviour alone.                                             |
| Escape                      | If open, prevent default, stop propagation, close without committing active option. If closed, do nothing in v1.                                                         |
| Tab                         | Close if open but do not prevent default. Native focus movement continues.                                                                                               |
| Home                        | Do not intercept by default because editable input Home moves the caret. Future optional config may use Alt/Home or Ctrl/Home style navigation, but v1 leaves it native. |
| End                         | Do not intercept by default because editable input End moves the caret.                                                                                                  |
| PageUp / PageDown           | Not implemented in v1. Leave native behaviour.                                                                                                                           |
| ArrowLeft / ArrowRight      | Leave native caret movement.                                                                                                                                             |
| Backspace / Delete          | Leave native editing. Input event handles filtering after the browser mutates text.                                                                                      |
| Printable characters        | Leave native typing. Input event handles `inputValue`. No Collection typeahead.                                                                                          |
| Alt+ArrowDown / Alt+ArrowUp | Optional future behaviour; not in v1 unless implementation is trivial and well tested.                                                                                   |

During IME composition, keydown handling is further restricted by §15.

## 13. Selection Model

V1 is single selection only.

On selecting an enabled option by click or Enter:

1. `value` becomes the option value.
2. `inputValue` becomes `displayWith(option.value)`.
3. `selected` emits the committed value.
4. Popup closes when `closeOnSelect` is true, default true.
5. DOM focus remains or returns to input.
6. Active option resets to `null` on close when `resetActiveOnClose` is true; otherwise it
   may remain for immediate reopen.

`displayWith` and `compareWith`:

```ts
displayWith?: (value: T) => string; // default String(value ?? '')
compareWith?: (a: T, b: T) => boolean; // default Object.is
```

Do not depend exclusively on object identity. If async options replace object instances,
`compareWith` should allow selected recovery.

Freeform:

- Default v1 behaviour: `allowFreeform = false`.
- In strict mode, blur/Escape after uncommitted typing restores `inputValue` to the current
  selected value display, or `''` when `value === null`.
- If `allowFreeform = true`, the consumer should type `T` as `string` or a union that
  includes string-like freeform values. Freeform commit happens on blur or Enter when no
  active option is selected.
- Do not build tags/multi-value semantics on top of freeform in v1.

## 14. Disabled Options

Reuse Collection's disabled skip model.

- Disabled options are visible.
- Disabled options have `aria-disabled="true"` and `data-qz-disabled`.
- Disabled options are skipped by ArrowUp/ArrowDown.
- Disabled options cannot be selected by click or Enter.
- If the active option becomes disabled after async update, next navigation should skip it;
  implementation should also consider clearing/recovering active immediately when disabled
  changes.

## 15. IME and Composition Events

Combobox must track composition:

- `compositionstart`: set `isComposing = true`.
- While composing, do not use printable keys, Enter or Escape for Combobox selection/close
  if the event indicates composition (`event.isComposing === true`) or internal composing
  state is true.
- ArrowUp/ArrowDown during composition should be conservative: if the event is composing,
  leave it to the browser/IME; otherwise normal navigation is allowed.
- `compositionend`: set `isComposing = false`, then read the final input value and run the
  same input handling path as a normal `input` event.
- Filtering should happen from finalized input value, not intermediate keydown guesses.

Required tests must cover that Enter during composition does not select the active option
and that compositionend updates `inputValue`/filtering.

## 16. Native Input Behaviour

Quartz should rely on the browser for single-line text editing. It must not capture:

- text selection shortcuts;
- caret movement with ArrowLeft/ArrowRight;
- Home/End;
- Backspace/Delete;
- platform editing shortcuts using Ctrl/Meta/Alt;
- browser spellcheck/autocorrect interactions.

The implementation should update from input/composition events after native editing rather
than trying to predict text from keydown.

## 17. Overlay Integration

Use `OverlayService.create()` directly from Combobox, anchored to the input element.

Defaults:

- `placement: 'bottom-start'`
- `offset: 4`
- `flip: true`
- `flipAxis: 'main'`
- `matchAnchorWidth: true`
- `closeOnClickOutside: true`
- `closeOnEscape: false` if input owns Escape; otherwise ensure Escape path calls
  Combobox close state, not just Overlay close.
- `closeOnScroll: false`

`matchAnchorWidth` should default to true for Combobox because suggestions visually belong
to the editable field and most consumers expect popup width to align with the input. It is
still configurable.

Open lifecycle:

1. Create `OverlayRef` with current config and content template.
2. Subscribe to `mounted$`, assign stable panel id if the consumer did not provide one.
3. Register panel element with Combobox service for inside/outside checks.
4. Set `open`/`isOpen` true and emit `opened`.
5. Queue position update after render if options/loading/empty content changes size.

Close lifecycle:

1. Destroy dismiss subscriptions/listeners.
2. Destroy overlay view/ref.
3. Set `open`/`isOpen` false and clear panel id if generated.
4. Optionally reset active id.
5. Emit `closed`.

## 18. Dismiss

Use existing Overlay/Dismiss machinery.

- Outside pointer should treat input, optional trigger and panel as inside while open.
- Click inside a suggestion must select before the outside-dismiss path closes the overlay.
  Preventing default on option pointerdown is acceptable to preserve input focus.
- Escape is handled on the input to apply Combobox-specific state rules.
- Focus outside can use `createDismissController({ focusOutside: true })` if Overlay config
  remains pointer/escape/scroll-only. This is not a Core change.
- Scroll close is opt-in for Combobox. Editable suggestions should not disappear because a
  long page or code preview emits an incidental document scroll while the user is typing.

No Combobox-specific global listener stack should be created.

## 19. Mobile, Touch and Browser Autocomplete

- Opening must work from touch/click/focus; no hover dependency.
- Default `openOnFocus = false` reduces accidental popup fights with mobile virtual
  keyboards.
- Optional trigger button should be `tabindex="-1"` by default so it is not an extra stop
  in keyboard navigation.
- Do not silently override the input's native `autocomplete`, `autocorrect`, `spellcheck`
  or password-manager attributes. Consumers can set them.
- Document that browser autofill popups are outside Quartz control.

## 20. Forms Integration

Do not implement `ControlValueAccessor` in the first Combobox build.

Rationale:

- Quartz primitives currently expose signal/model APIs rather than Angular Forms-first
  components.
- CVA adds touched/dirty/disabled/writeValue timing and form reset semantics that should be
  designed once the base state machine is stable.
- `[(value)]`, `[(inputValue)]` and `[(open)]` give a clean v1 API and are testable without
  forms coupling.

Future CVA can wrap `value`, `inputValue` and disabled state after the base primitive
ships.

## 21. SSR, Hydration and Tree-shaking

Requirements:

- No DOM access at import time.
- No random ids.
- Id counters are acceptable only if deterministic under the same render tree; prefer
  allowing explicit `id` on input/panel and generating child ids from a per-instance
  sequence.
- Overlay open must no-op when `document.defaultView` is missing, matching `OverlayRef`.
- Dismiss/listeners attach only while a Combobox instance is open in the browser.
- Do not use `MutationObserver` or global services for direction/focus.
- All directives standalone. Components, if ever added for examples, use OnPush.

Known current pattern: Listbox/Menu/Popover use module counters. Combobox should either
match that temporarily or improve by deriving option ids from the Combobox instance id and
option registration order. Do not introduce random UUIDs that can hydrate differently.

## 22. Internal Architecture

Recommended files:

```text
packages/primitives/src/combobox/
  combobox.types.ts
  combobox.service.ts
  combobox.directive.ts
  combobox-input.directive.ts
  combobox-content.directive.ts
  combobox-listbox.directive.ts
  combobox-option.directive.ts
  combobox-trigger.directive.ts
  index.ts
  *.spec.ts
```

`ComboboxService` responsibilities:

- Hold the `CollectionStore<ComboboxOptionDirective<unknown>>`.
- Register/unregister options.
- Track input element, optional trigger, panel element.
- Expose `activeId`, `activeOption`, enabled options and empty state.
- Own open/close transitions and OverlayRef.
- Own `isComposing`.
- Apply selection state and display/value sync through methods called by directives.
- Configure Collection with vertical orientation, wrap true, focus strategy
  `aria-activedescendant`.

`ComboboxDirective` responsibilities:

- Provide the service.
- Expose public models/inputs/outputs.
- Resolve content through explicit `[content]` first, then `qzComboboxContent` projection.
- Bridge controlled `open` model using Popover's `internalSync` pattern.
- Compute filtered options for data-driven examples.

`ComboboxInputDirective` responsibilities:

- Apply ARIA to the input.
- Read/write the DOM input value from/to `inputValue`.
- Handle input, focus, keydown and composition events.

`ComboboxContentDirective` responsibilities:

- Capture the overlay template.

`ComboboxListboxDirective` responsibilities:

- Apply listbox role/id and data hooks to the popup root.

`ComboboxOptionDirective` responsibilities:

- Register as a Collection item.
- Provide value, disabled, label and element.
- Reflect active, selected and disabled states.
- Handle pointer/click selection without moving focus.

## 23. Usage Examples

### Static options

```html
<div qzCombobox #combo="qzCombobox" [content]="content" [options]="fruits">
  <label for="fruit">Fruit</label>
  <input id="fruit" qzComboboxInput />

  <ng-template #content qzComboboxContent>
    <ul qzComboboxListbox>
      @for (fruit of combo.filteredOptions(); track fruit) {
      <li [qzComboboxOption]="fruit">{{ fruit }}</li>
      }
    </ul>
  </ng-template>
</div>
```

### Object options

```html
<div
  qzCombobox
  #combo="qzCombobox"
  [content]="content"
  [options]="users"
  [displayWith]="displayUser"
  [compareWith]="compareUsers"
  [(value)]="selectedUser"
>
  <input qzComboboxInput />

  <ng-template #content qzComboboxContent>
    <div qzComboboxListbox>
      @for (user of combo.filteredOptions(); track user.id) {
      <div [qzComboboxOption]="user" [qzComboboxOptionLabel]="user.name">
        <strong>{{ user.name }}</strong>
        <span>{{ user.email }}</span>
      </div>
      }
    </div>
  </ng-template>
</div>
```

```ts
displayUser = (user: User) => user.name;
compareUsers = (a: User, b: User) => a.id === b.id;
```

### Controlled filtering

```html
<div
  qzCombobox
  #combo="qzCombobox"
  [content]="content"
  [options]="products"
  [filter]="productFilter"
  [(inputValue)]="query"
>
  <input qzComboboxInput />

  <ng-template #content qzComboboxContent>
    <div qzComboboxListbox>
      @for (product of combo.filteredOptions(); track product.sku) {
      <div [qzComboboxOption]="product" [qzComboboxOptionLabel]="product.name">
        {{ product.name }}
      </div>
      }
    </div>
  </ng-template>
</div>
```

```ts
productFilter = (product: Product, query: string, label: string) =>
  label.toLowerCase().startsWith(query.trim().toLowerCase());
```

### Async options

```html
<div
  qzCombobox
  #combo="qzCombobox"
  [content]="content"
  [options]="results()"
  [filter]="null"
  [loading]="loading()"
  [(inputValue)]="query"
>
  <input qzComboboxInput />

  <ng-template #content qzComboboxContent>
    <div qzComboboxListbox>
      @if (loading()) {
      <div>Loading...</div>
      } @for (result of combo.filteredOptions(); track result.id) {
      <div [qzComboboxOption]="result" [qzComboboxOptionLabel]="result.title">
        {{ result.title }}
      </div>
      }
    </div>
  </ng-template>
</div>
```

Note: fetching and cancellation stay in consumer code. Quartz only tolerates `results()`
being replaced.

### Disabled option

```html
@for (user of combo.filteredOptions(); track user.id) {
<div [qzComboboxOption]="user" [qzComboboxOptionDisabled]="user.archived">{{ user.name }}</div>
}
```

### Empty results

```html
<ng-template #content qzComboboxContent>
  <div qzComboboxListbox>
    @for (item of combo.filteredOptions(); track item.id) {
    <div [qzComboboxOption]="item">{{ item.name }}</div>
    } @if (combo.empty() && !combo.loading()) {
    <div>No results</div>
    }
  </div>
</ng-template>
```

## 24. Required Unit Tests

- Renders input `role="combobox"` with `aria-expanded`, `aria-controls`,
  `aria-autocomplete` and `aria-activedescendant`.
- Opens and closes from typing, ArrowDown, optional trigger, Escape, selection and outside
  dismissal.
- Keeps DOM focus on the input while ArrowDown/ArrowUp changes active option.
- Updates `aria-activedescendant` when active option changes.
- Typing updates `inputValue` and filtered options.
- Default filter is case-insensitive contains match.
- Custom `filter` callback controls filtering.
- `[filter]="null"` leaves consumer-provided options unchanged.
- Enter selects active option, updates `value`, updates `inputValue`, closes and restores
  input focus.
- Escape closes and applies strict/freeform input preservation rules.
- Tab closes without preventing native focus movement.
- Disabled options are skipped and not selectable.
- Dynamic option removal recovers active option or clears it.
- Async-style options replacement preserves committed selection via `compareWith`.
- Object values use `displayWith` and `compareWith`.
- Controlled `value`, `inputValue` and `open` models sync without loops.
- Outside pointer closes while clicks inside options select correctly.
- IME: compositionstart blocks Enter selection; compositionend updates filtering.
- SSR: rendering directives does not access browser-only DOM, generated ids are stable.
- RTL: `bottom-start` placement delegates to Overlay; vertical navigation is unchanged.

## 25. E2E Plan

- Mouse/touch opens suggestions and selects an option.
- Keyboard-only flow: focus input, type, ArrowDown, Enter.
- Typing filters suggestions and updates empty content.
- Escape closes without committing active suggestion.
- Tab closes and moves focus to the next page control.
- Async result update while open does not move DOM focus from input.
- Disabled option is skipped by arrows and cannot be clicked.
- Empty state renders when no results match.
- IME-safe flow where Playwright/browser support allows composition events.
- `document.activeElement` remains the input while `aria-activedescendant` changes.
- `aria-controls` references the mounted popup id while open.

## 26. Known Limitations

- No CVA in v1.
- No multiselect/tags.
- No virtualization.
- No fuzzy/ranked search.
- No grid/tree/dialog popup.
- No mobile-native select replacement.
- Browser autocomplete/autofill UI is not controlled.
- Interactive children inside options are not supported in v1.
- Live-region announcements are not added automatically. APG relationships should be the
  first accessibility path; add live regions later only if assistive technology testing
  shows missing announcements for result counts or selection.

## 27. Future Extensions

- Optional CVA wrapper after base state stabilizes.
- Optional `autoActiveFirstOption`.
- Optional freeform commit policies beyond blur/Enter.
- Optional popup trigger directive refinements.
- Shared private Listbox/Combobox option-controller extraction if duplication is proven.
- Virtual scroll integration after Combobox has stable option identity and active recovery.
- Command Palette or TagsInput as separate primitives, not hidden Combobox modes.

## 28. Build-phase Definition of Done

- Core remains unchanged unless implementation reveals a generic gap documented in this
  spec first.
- If Listbox is changed, the change must benefit Listbox independently, not only make
  Combobox composition possible.
- Public API exports added from `@quartz-headless/primitives`.
- Unit and E2E coverage listed above.
- Demo/docs can be added during the build phase, but this spec step does not add them.
- `docs/ai/STATE.md` must say Combobox spec complete and implementation not started until
  code exists.
