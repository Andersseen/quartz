---
title: Tabs
description: 'A WAI-ARIA tabs primitive with roving focus, automatic or manual activation, orientation support and RTL-aware horizontal navigation.'
group: Primitives
order: 109
---

## At a glance

- **Collection** — DOM order, disabled tabs and roving tabindex
- **Activation** — Automatic by default, manual when panels are expensive
- **ARIA** — tablist, tab, tabpanel, controls and labelledby
- **CLI** — pnpm quartz add tabs

## Playground

::playground[quartz-tabs]

## Live examples

::demo[tabs]

## Code

### Horizontal tabs

```ts
tab = signal<string | null>('account');

<div qzTabs [(value)]="tab">
  <div qzTabList>
    <button qzTab="account">Account</button>
    <button qzTab="security">Security</button>
  </div>
  <section qzTabPanel="account">Account panel</section>
  <section qzTabPanel="security">Security panel</section>
</div>
```

### Vertical, manual and RTL

```html
<div qzTabs [(value)]="tab" activationMode="manual" orientation="vertical">
  <div qzTabList>
    <button qzTab="preview">Preview</button>
    <button qzTab="settings">Settings</button>
  </div>
  <section qzTabPanel="preview">Preview panel</section>
  <section qzTabPanel="settings">Settings panel</section>
</div>
```
