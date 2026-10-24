---
title: Sidebar
description: 'Application navigation sidebar behaviour for push and overlay layouts, collapsed state, responsive mode switching and logical inline sides.'
group: Primitives
order: 118
---

## At a glance

- **Layout** — Push mode owns structural grid geometry
- **Overlay** — Escape, outside pointer, optional focus and scroll lock
- **Responsive** — Viewport breakpoint chooses desktop/mobile mode
- **CLI** — pnpm quartz add sidebar

## Live examples

::demo[sidebar]

## Code

### Push and collapsed

```html
<div qzSidebar [(open)]="open" [(collapsed)]="collapsed">
  <aside qzSidebarPanel>
    <button qzSidebarTrigger>Toggle</button>
    <nav>...</nav>
  </aside>

  <main qzSidebarContent>...</main>
</div>
```

### Overlay and RTL

```html
<div qzSidebar desktopMode="push" mobileMode="overlay" breakpoint="md" side="inline-start">
  <aside qzSidebarPanel>...</aside>
  <main qzSidebarContent>...</main>
</div>
```
