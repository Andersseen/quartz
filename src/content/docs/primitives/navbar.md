---
title: Navbar
description: 'Headless navbar behaviour for sticky state, scrolled/stuck hooks, scroll direction, reveal state and responsive mobile menu control.'
group: Primitives
order: 119
---

## At a glance

- **Scroll state** — Thresholded scrolled, stuck and direction signals
- **Reveal** — State-only reveal on scroll-up
- **Menu** — Trigger, ARIA, Escape and outside dismissal
- **CLI** — pnpm quartz add navbar

## Live examples

::demo[navbar]

## Code

### Sticky app bar

```html
<nav qzNavbar sticky reveal="scroll-up" [scrollThreshold]="8">
  <a href="/">Quartz Console</a>

  <a href="/deployments">Deployments</a>
  <a href="/usage">Usage</a>

  <button qzNavbarTrigger>Menu</button>
  <div qzNavbarMenu>
    <a href="/sidebar">Sidebar</a>
    <a href="/navbar">Navbar</a>
    <a href="/stepper">Stepper</a>
  </div>
</nav>
```
