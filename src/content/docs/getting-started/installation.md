---
title: Installation
description: Install Quartz Headless from npm, or copy the source into your project with the CLI.
group: Getting started
order: 1
---

Quartz ships as two npm packages and, optionally, as copy-the-source files. Pick **one** mode per piece; both can coexist in a project.

## Requirements

| Requirement                                             | Version                                                  |
| ------------------------------------------------------- | -------------------------------------------------------- |
| Angular                                                 | `^21.2.0 \|\| ^22.0.0` (zoneless, standalone)            |
| `@quartz-headless/primitives` → `@quartz-headless/core` | same minor (`primitives@0.11.x` peers on `core@^0.11.0`) |
| `@angular/forms`                                        | optional, only for `@quartz-headless/primitives/forms`   |

## npm package mode

```bash
pnpm add @quartz-headless/core @quartz-headless/primitives
# or only the infrastructure layer:
pnpm add @quartz-headless/core
```

The two packages version in lockstep. `@quartz-headless/core` has no Angular Forms or Primitives dependency; `@quartz-headless/primitives` declares Core as a real `peerDependency`, so install both.

Quartz targets zoneless change detection:

```ts
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection()],
};
```

## CLI source-copy mode

The CLI copies raw TypeScript from this repository into your project so you own and can edit it.

```bash
git clone https://github.com/Andersseen/quartz.git
cd quartz && pnpm install

pnpm quartz list                    # everything available
pnpm quartz add overlay             # one Core piece (+ the Core siblings it needs)
pnpm quartz add dialog select       # several at once
pnpm quartz add toast --output src/app/ui
```

- **Core** pieces are pure copy-source with zero npm dependencies; siblings they need are copied too.
- **Primitives** depend on `@quartz-headless/core` as an installed package. `quartz add select` copies only `select/` and tells you to `npm install @quartz-headless/core`.
- The CLI does not distribute the optional Forms entry point (`@quartz-headless/primitives/forms`); use the npm package for Angular Forms adapters.

> [!NOTE]
> The unscoped `quartz-headless` package is frozen at its last release. New work ships in the two scoped packages.

## Next

- [Quick start](/docs/getting-started/quick-start)
- [Core versus Primitives](/docs/guides/core-vs-primitives)
