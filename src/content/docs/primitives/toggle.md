---
title: Toggle
description: 'A pressed/unpressed button primitive. Use it for stateful buttons, not on/off settings where Switch is the clearer semantic.'
group: Primitives
order: 114
---

## At a glance

- **API** — qzToggle with [(pressed)]
- **Keyboard** — Click, Enter and Space through native button behavior
- **ARIA** — aria-pressed without role switch
- **CLI** — pnpm quartz add toggle

## Live examples

::demo[toggle]

## Code

### Single toggle

```ts
bold = signal(false);

<button qzToggle [(pressed)]="bold">
  Bold
</button>
```
