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

::playground[quartz-sidebar]

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

The `open` and `collapsed` models are independent: desktop collapse keeps the sidebar present as a rail, while a closed mobile overlay removes the drawer from interaction. `desktopMode` / `mobileMode`, `breakpoint`, and `side` select layout and responsive behavior. Logical `inline-start` / `inline-end` sides follow RTL.

Overlay mode supports Escape and outside-pointer dismissal. Optional focus trapping applies while the drawer is open; Escape restores focus to its trigger and scroll locking lasts only for the open modal drawer. Push mode does not trap focus or lock page scrolling. On breakpoint changes the mode follows the viewport without confusing collapsed with closed. Destroying the sidebar releases listeners, focus state and scroll lock.

Use the trigger as a native button and name the panel with `aria-label` or `aria-labelledby`. Consumer CSS owns responsive layout and appearance; `data-qz-state`, `data-qz-mode` and `data-qz-open` expose state hooks. The service uses browser viewport and overlay facilities only after rendering; prerender output uses the initial configured mode until the client measures its viewport. Sidebar is an application layout pattern, distinct from Navbar, NavigationMenu and Menu. Its API and focus contract are Quartz-specific.

For router-aware links, keep routing in the application and expose the active destination to assistive technology:

```html
<a
  routerLink="/projects"
  routerLinkActive="active"
  #active="routerLinkActive"
  [attr.aria-current]="active.isActive ? 'page' : null"
>
  Projects
</a>
```
