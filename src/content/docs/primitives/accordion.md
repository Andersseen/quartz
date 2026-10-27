---
title: Accordion
description: 'Disclosure sections with single, collapsible or multiple open state, accessible trigger/panel relationships and optional header arrow navigation.'
group: Primitives
order: 110
---

## At a glance

- **State** — Single, single collapsible and multiple modes
- **Keyboard** — Native button activation plus Arrow/Home/End between headers
- **ARIA** — expanded, controls, labelledby and optional region panels
- **CLI** — pnpm quartz add accordion
- **Direction** — Horizontal headers honor LTR/RTL; vertical is the default

## Live examples

::demo[accordion]

::playground[quartz-accordion]

## Code

### Single mode

```ts
section = signal<string | null>(null);

<div qzAccordion [(value)]="section">
  <div qzAccordionItem="shipping">
    <button qzAccordionTrigger>Shipping</button>
    <div qzAccordionPanel>Shipping panel</div>
  </div>
</div>
```

### Collapsible and multiple

```html
<div qzAccordion type="multiple" [(value)]="sections">
  <div qzAccordionItem="one">
    <button qzAccordionTrigger>One</button>
    <div qzAccordionPanel>Panel one</div>
  </div>
</div>
```

### Orientation and disabled state

```html
<div qzAccordion orientation="horizontal" [disabled]="readOnly">
  <section qzAccordionItem="account">
    <button qzAccordionTrigger>Account</button>
    <div qzAccordionPanel>Account settings</div>
  </section>
</div>
```

Accordion supports `vertical` (default) and `horizontal` header navigation. Arrow keys follow the selected axis and text direction; Home/End move to endpoints. Focus movement does not expand a section. Native button activation toggles it. A disabled container disables each trigger. A required-open item that cannot collapse exposes `aria-disabled` while remaining operable for focus; it is not given native `disabled`.

The value remains consumer-owned through `[(value)]`; multiple mode uses an array. Items can be added or removed dynamically, and keyboard focus follows current DOM order. Trigger/panel IDs and relationships are managed by the directives. Provide labels in the trigger text and keep the panel content in consumer markup. Styling remains consumer-owned; `data-qz-state` and disabled hooks are available. The directives are safe for prerendering and do not create browser resources during server rendering.

Use [Toolbar](/docs/primitives/toolbar) for action groups and [NavigationMenu](/docs/primitives/navigation-menu) for site links with flyouts. Accordion is a disclosure pattern and is not interchangeable with Menu or Navbar. Its public API is Quartz's own, rather than Volt's internal symbols.
