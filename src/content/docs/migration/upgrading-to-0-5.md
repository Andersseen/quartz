---
title: Migrating to the 0.5 baseline
description: Button-first controls, the committed Switch output, Tooltip interactivity and the Tree template context.
group: Migration
order: 952
---

## Button-first controls

Checkbox, Switch and Toggle are button-first primitives. Use button hosts:

```html
<button qzCheckbox [checked]="accepted()">Accept</button>
<button qzSwitch [checked]="enabled()">Notifications</button>
<button qzToggle [pressed]="pressed()">Bold</button>
```

## Switch committed output

Use `checkedChangeCommitted` instead of the older `(toggled)`. Programmatic writes to `checked` are not user commits.

```html
<button qzSwitch [(checked)]="enabled" (checkedChangeCommitted)="save($event)">
  Notifications
</button>
```

## Tooltip interactivity

Tooltip is the non-interactive help primitive. Use Popover or Menu for interactive floating content.

## Tree template context

Tree node templates use `TreeNodeContext`: `$implicit`, `node`, `level`, `expanded`, `selected`, `disabled`, `loading`, `loadState`, `error`, `retry`.
