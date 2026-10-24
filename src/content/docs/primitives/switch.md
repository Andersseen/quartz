---
title: Switch
description: 'A compact button-based ARIA switch for boolean state. Use it where the change takes effect immediately.'
group: Primitives
order: 111
---

## At a glance

- **Button first** — Native click, Enter and Space behavior
- **Signals** — Two-way checked model
- **ARIA** — role switch and aria-checked included
- **CLI** — pnpm quartz add switch

## Playground

::playground[quartz-switch]

## Live examples

::demo[switch]

## Code

### Basic, controlled and disabled

```ts
enabled = signal(false);

<button qzSwitch [(checked)]="enabled">
  Notifications
</button>
```
