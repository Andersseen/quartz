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

## Live examples

::demo[accordion]

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
