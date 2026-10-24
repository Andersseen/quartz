---
title: Packages and versions
description: Published packages, entry points, peer dependencies and the lockstep version policy.
group: Reference
order: 900
---

| Entry point                         | Package                       | Notes                                                  |
| ----------------------------------- | ----------------------------- | ------------------------------------------------------ |
| `@quartz-headless/core`             | `@quartz-headless/core`       | Infrastructure; no Primitives/Forms imports            |
| `@quartz-headless/primitives`       | `@quartz-headless/primitives` | Peers on `@quartz-headless/core@^<same minor>`         |
| `@quartz-headless/primitives/forms` | `@quartz-headless/primitives` | Optional `@angular/forms` peer; Angular Forms adapters |

Both packages release together (`0.11.0` today). Public exports are guarded by declaration snapshots in the repository (`docs/api/snapshots/`): any addition, removal or signature change must be acknowledged in a pull request.

## API reference

Generated from the public entry points with `doq-api`:

- [`@quartz-headless/core`](/docs/reference/api/core)
- [`@quartz-headless/primitives`](/docs/reference/api/primitives)
- [`@quartz-headless/primitives/forms`](/docs/reference/api/forms)

Behavioural contracts that the signatures cannot express (keyboard, ARIA, forms semantics) are documented on each component page and in the [guides](/docs/guides/accessibility).
