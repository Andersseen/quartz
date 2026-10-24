---
title: How these docs work
description: The documentation is Markdown rendered by Doqs; live examples are real Quartz components, and code shown here is read from the source.
group: Guides
order: 20
---

These pages are served by [Doqs](https://github.com/Andersseen/doqs) on Analog: Markdown becomes prerendered routes, a sidebar, search and previous/next links. Quartz owns the brand and the examples.

::include{file="/_partials/generated-note.md"}

## Live examples are real primitives

A `::playground[id]` or `::demo[id]` line renders a standalone Angular component that uses the actual Quartz directives. The Select playground wraps `qzSelect` and exposes `multiple`, `closeOnSelect`, `disabled`, groups and RTL as Doqs controls:

::source{file="src/app/docs-playgrounds/select-playground.ts" region="select-playground-inputs" title="select-playground.ts"}

## The async guard is source-backed

The Combobox guide shows [[api:createLatestRequest]]. This is the implementation it documents:

::source{file="packages/primitives/src/combobox/combobox-request.ts" region="latest-request" title="combobox-request.ts"}

## API reference

Per-symbol reference pages are generated with `doq-api` from the three public entry points (`pnpm docs:api`, verified in CI with `pnpm docs:api:check`): [Core](/docs/reference/api/core), [Primitives](/docs/reference/api/primitives), [Forms](/docs/reference/api/forms).
