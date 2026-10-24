---
title: Styling and data-qz hooks
description: Quartz ships no CSS. Style from data-qz-* attributes and ARIA state.
group: Guides
order: 14
---

**You own the styles — Quartz owns the behaviour.** The libraries ship no theme. Structural portal styles exist only where behaviour requires them (an overlay container is positioned `fixed`).

## State hooks

Every primitive reflects its state as attributes you can target with any CSS approach:

| Attribute                                | Meaning                                                            |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `data-qz-open`                           | A popup trigger/host is open                                       |
| `data-qz-selected`                       | Option or item is selected                                         |
| `data-qz-highlighted` / `data-qz-active` | The active (keyboard-focused) option                               |
| `data-qz-disabled`                       | Disabled control or option                                         |
| `data-qz-placeholder`                    | Select trigger with nothing selected                               |
| `data-qz-empty` / `data-qz-loading`      | Combobox listbox has no results / is loading                       |
| `data-qz-state`                          | `open`/`closed`, `checked`/`unchecked`, … on disclosure-like parts |
| `data-qz-orientation`                    | `horizontal`/`vertical`                                            |

```css
[qzSelectOption][data-qz-highlighted] {
  background: var(--accent-soft);
}
[qzSelectTrigger][data-qz-placeholder] {
  color: var(--muted);
}
```

## Tailwind

```html
<button
  qzSelectOption="es"
  class="data-[qz-highlighted]:bg-emerald-500/20 data-[qz-selected]:font-semibold"
>
  …
</button>
```

## Parts you must label

Headless means you also own visible labels: give triggers an accessible name (text, `aria-label` or `aria-labelledby`); a Select/Combobox popup is then named after its trigger automatically.
