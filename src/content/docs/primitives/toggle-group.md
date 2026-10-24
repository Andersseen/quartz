---
title: ToggleGroup
description: 'A group of toggle buttons with single or multiple selection, Collection-powered roving focus and RTL-aware horizontal keys.'
group: Primitives
order: 115
---

## At a glance

- **API** — qzToggleGroup type single|multiple with qzToggleItem
- **Focus** — One tab stop; disabled items are skipped
- **ARIA** — role group with item aria-pressed
- **CLI** — pnpm quartz add toggle-group

## Playground

::playground[quartz-toggle-group]

## Live examples

::demo[toggle-group]

## Code

### Single, multiple and RTL

```ts
alignment = signal<string | readonly string[] | null>('left');

<div qzToggleGroup type="single" [(value)]="alignment">
  <button qzToggleItem="left">Left</button>
  <button qzToggleItem="center">Center</button>
  <button qzToggleItem="right">Right</button>
</div>
```
