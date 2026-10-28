---
title: Search Composition
description: 'Compose search from native input, Angular Forms and button behavior.'
group: Guides
order: 190
---

## Live demo

::demo[controls-text-files]

Search is a native text-input composition recipe, not a Quartz primitive. Keep the input responsible for text entry, selection, keyboard behavior and form submission. Add a clear button only while there is a query, and return focus to the input after clearing.

```html
<form role="search" (submit)="submitSearch($event)">
  <label for="site-search">Search</label>
  <input #search id="site-search" type="search" [formControl]="query" />
  @if (query.value) {
  <button type="button" aria-label="Clear search" (click)="query.setValue(''); search.focus()">
    Clear
  </button>
  }
</form>
```

Native inputs and textareas keep native Angular Forms accessors. Use FormField when you need stable label, hint, error and control relationships. Quartz does not provide a separate search primitive or text-input state engine.

The consumer owns the signal or `FormControl` model. Clear writes an empty value through that model and restores focus; the button is conditional on a non-empty query, named for assistive technology and excluded from form submission with `type="button"`. Keyboard editing, disabled/readonly handling, autofill and selection stay native. Use a `<label>` for the search input; the enclosing `role="search"` names the search landmark through an accessible name if the page has more than one search form. This composition uses no generated IDs and is SSR-safe as native markup.

## API reference and differences

Search is composed from native HTML and Angular Forms; Quartz adds no search primitive. For labels, hints and errors, see the [FormField API](/docs/primitives/form-field). Keep the native search input in the form and give the clear button `type="button"`; after clearing, return focus to the input.
