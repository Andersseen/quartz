---
title: Recipes for real applications
description: Installation, zoneless and SSR setup, an accessible form, Dialog with Select, floating surfaces, Sidebar, Drawer, Toast, the optional Forms entry point, the CLI and upgrades — every code block is taken from a compiled consumer fixture.
group: Guides
order: 14
---

Every block that carries a `verified-by` comment below is checked by `pnpm test` (`scripts/docs-recipes.spec.mjs`) to appear verbatim
(whitespace-normalised) in the consumer fixture application under `consumer/app`. That application is installed from the packed
tarballs, compiled with strict AOT and `strictTemplates`, server-rendered, hydrated and driven in Chromium, Firefox and WebKit on
Angular 21.2 and 22 — see [Compatibility](/docs/guides/compatibility). If a snippet and the public API ever disagree, the build fails.

## Install

```bash
# Primitives (accessible patterns). Core is a REQUIRED peer of Primitives, so install both.
npm install @quartz-headless/core @quartz-headless/primitives

# Only if you want Angular Forms adapters (formControlName / ngModel): @angular/forms is an optional peer.
npm install @angular/forms

# Only building your own widget on the low-level infrastructure:
npm install @quartz-headless/core
```

Supported: Angular `^21.2.0 || ^22.0.0`, RxJS `^7.8.0`, Node as required by your Angular version. Use Core directly for overlay,
focus, dismiss, collection and viewport work; use Primitives for ready patterns; import
`@quartz-headless/primitives/forms` only where you bind to Angular Forms — the main entry never imports `@angular/forms`.
Pre-release builds (`-beta.N`, `-rc.N`) are published to the `next` dist-tag and pin their exact Core companion.

## Zoneless application with SSR and hydration

<!-- verified-by: consumer/app/src/app/app.config.ts -->

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
  ],
};
```

Quartz generates DOM ids from an application-scoped `QzIdGenerator`, so concurrent server renders are identical and server ids survive
hydration. Do not wrap Quartz hosts in `ngSkipHydration`.

## Accessible form field with Angular Forms

<!-- verified-by: consumer/app/src/app/pages/forms.page.ts -->

```html
<div qzFormField id="email-field" required>
  <label qzFormFieldLabel for="email-field-control">Email</label>
  <p qzFormFieldDescription id="email-field-hint">Work address.</p>
  @if (showError('email')) {
  <p qzFormFieldError id="email-field-error" role="alert" class="err">Enter a valid email.</p>
  }
  <input qzFormFieldControl qzAutofill type="email" formControlName="email" />
</div>
```

<!-- verified-by: consumer/app/src/app/pages/forms.page.ts -->

```ts
import { QUARTZ_FORMS } from '@quartz-headless/primitives/forms';
```

`QUARTZ_FORMS` spread into a component's `imports` enables `formControlName`/`ngModel` on Quartz controls. FormField wires `for`,
`aria-describedby`, `aria-invalid` and `aria-required` between the parts.

## Dialog containing a Select

<!-- verified-by: consumer/app/src/app/pages/overlays.page.ts -->

```html
<ng-template #dialogTpl let-ref let-labelledBy="ariaLabelledBy" let-describedBy="ariaDescribedBy">
  <div class="panel" data-testid="dialog">
    <h2 [id]="labelledBy">Pick a fruit</h2>
    <p [id]="describedBy">The choice closes the dialog.</p>
    <div qzSelect [(value)]="picked" data-testid="dialog-select">
      <button qzSelectTrigger [attr.aria-label]="'Dialog fruit: ' + (picked() ?? 'Choose')">
        {{ picked() ?? 'Choose' }}
      </button>
      <ng-template qzSelectContent>
        <div qzSelectListbox class="panel">
          <div qzSelectOption="apple">Apple</div>
          <div qzSelectOption="pear">Pear</div>
        </div>
      </ng-template>
    </div>
    <button type="button" (click)="finish(ref)">Done</button>
  </div>
</ng-template>
```

<!-- verified-by: consumer/app/src/app/pages/overlays.page.ts -->

```ts
openDialog(): void {
  this.picked.set(null);
  this.dialogs.open(this.dialogTpl(), this.vcr, { ariaLabel: 'Fruit' });
}
```

The template context supplies the generated title/description ids and the `DialogRef` (`$implicit`). Escape closes the Select popup
first; focus returns to the opener when the Dialog closes.

## Tooltip, Popover and Menu

<!-- verified-by: consumer/app/src/app/pages/overlays.page.ts -->

```html
<button qzTooltip="Saves your work" tooltipPlacement="bottom" data-testid="tooltip-anchor">
  Save
</button>
<button qzPopoverTrigger [popover]="pop" data-testid="popover-trigger">Popover</button>
<ng-template #pop>
  <div qzPopover class="panel" data-testid="popover">Popover body <button>Inside</button></div>
</ng-template>
<button qzMenuTrigger [menu]="menu" data-testid="menu-trigger">Menu</button>
<ng-template #menu>
  <div qzMenu class="panel" data-testid="menu">
    <button qzMenuItem (selected)="menuChoice.set('one')">One</button>
    <button qzMenuItem (selected)="menuChoice.set('two')">Two</button>
  </div>
</ng-template>
```

Tooltip is non-interactive; put interactive content in a Popover or Menu.

## Responsive Sidebar

<!-- verified-by: consumer/app/src/app/pages/parity.page.ts -->

```html
<div qzSidebar #sb="qzSidebar" [(open)]="sbOpen" [(collapsed)]="sbCollapsed" breakpoint="md">
  <aside qzSidebarPanel aria-label="Project navigation">
    <a href="#one" aria-label="Item 1">1</a>
    <a href="#two" aria-label="Item 2">2</a>
  </aside>
  <div qzSidebarContent>
    <button qzSidebarTrigger>Toggle sidebar</button>
    <button type="button" (click)="sb.collapse()">Collapse rail</button>
  </div>
</div>
```

Below the breakpoint the panel is an off-canvas modal (focus trapped, Escape restores focus to the trigger); above it, it is a docked
panel that can collapse to a rail. A page hydrated at a mobile width starts closed.

## Drawer

<!-- verified-by: consumer/app/src/app/pages/overlays.page.ts -->

```ts
openDrawer(): void {
  this.drawers.open(this.drawerTpl(), this.vcr, { side: 'inline-end' });
}
```

## Programmatic Toast

<!-- verified-by: consumer/app/src/app/pages/overlays.page.ts -->

```ts
toast(): void {
  this.toasts.show({
    type: 'success',
    message: 'File archived',
    duration: 0,
    actions: [{ label: 'Undo', run: () => this.undone.set('yes') }],
  });
}
```

Render `<qz-toast-container />` once in your layout. Toasts announce through a live region without moving focus.

## Copy the source instead (CLI)

```bash
npx quartz list
npx quartz add dialog --dry-run   # plan only: nothing is written
npx quartz add dialog accordion   # refuses to overwrite modified files unless --force
```

Primitives copied this way still import `@quartz-headless/core`, so install the Core package; Core pieces are copied as source with
their Core dependencies. The CLI is itself exercised by an external consumer (`pnpm verify:consumer:cli`).

## Upgrading

1. Read the [migration notes](/docs/migration/upgrading-to-1-0) and the changelog entries between your version and the target.
2. Upgrade both packages to the same version: `npm install @quartz-headless/core@X @quartz-headless/primitives@X`.
3. Rebuild with `strictTemplates`; renamed or removed inputs fail at compile time.
4. Re-run your keyboard/focus tests: behavior changes are listed per release in the changelog.
