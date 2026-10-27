---
title: Pagination
description: 'Bounded page navigation with current-page semantics and boundary focus recovery.'
group: Primitives
order: 119
---

## At a glance

- **State** — One-based `page` model and nonnegative `pageCount`
- **Controls** — First, previous, next, last and explicit page buttons
- **Accessibility** — Named navigation landmark, `aria-current="page"`, native disabled buttons
- **CLI** — `pnpm quartz add pagination`

## Live example

::demo[pagination]

::playground[quartz-pagination]

## Usage

```ts
import {
  PaginationDirective,
  PaginationFirstDirective,
  PaginationLastDirective,
  PaginationNextDirective,
  PaginationPageDirective,
  PaginationPreviousDirective,
} from '@quartz-headless/primitives';
```

```html
<nav qzPagination aria-label="Search results" [(page)]="page" [pageCount]="pageCount">
  <button qzPaginationFirst>First</button>
  <button qzPaginationPrevious>Previous</button>
  @for (number of pages; track number) {
  <button [qzPaginationPage]="number">{{ number }}</button>
  }
  <button qzPaginationNext>Next</button>
  <button qzPaginationLast>Last</button>
</nav>
```

The page model is one-based and normalized to `[1, pageCount]`. A zero page count normalizes `page` to 1 and disables controls; there is no current page in that state. The root `disabled` input disables all controls. Page count changes and programmatic page updates are clamped after render.

Boundary controls use native `disabled`. If the focused next/previous control becomes disabled after changing pages, focus moves to the current page button, or the navigation root if no current button is rendered. Give the navigation an accessible name. Quartz supplies behavior and a `data-qz-pagination` hook; consumers style the native buttons and layout.

The API does not prescribe a page-window algorithm: render the page buttons your application needs. Pagination is a bounded page control, distinct from Navbar, NavigationMenu, Menu and Toolbar. It is SSR-safe and creates no overlay.
