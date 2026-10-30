---
title: CLI source-copy
description: What `quartz add` copies, where it puts it, and the guarantees it makes before touching your files.
group: Guides
order: 19
---

`quartz add` copies Quartz **source** from a clone of this repository into your project. It is not published as a package.

```bash
git clone https://github.com/Andersseen/quartz.git && cd quartz && pnpm install
pnpm quartz add accordion dialog resizable --output "../my-app/src/app/quartz"
```

## Destination and dependencies

- Each piece lands in `<output>/<name>/`, flat. Without `--output` the CLI uses the first existing of `src/lib/components`, `src/app/lib/components`, `src/app/components`.
- **Core** pieces are self-contained; the CLI also copies the Core folders they import (for example `splitter` brings `directionality`).
- **Primitives** import `@quartz-headless/core` as a bare package: install it (`npm install @quartz-headless/core`) — the CLI tells you when it is required. Mixing copied Core and installed Core is fine as long as you do not pass objects between the two copies.
- Paths with spaces work.

## Safeguards

| Behaviour           | Detail                                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| Preflight           | The whole plan (unknown names, missing sources, conflicting files) is checked before anything is written. |
| No silent overwrite | A destination file that differs from the Quartz source stops the run (exit 4). Pass `--force` to replace. |
| Repeatable          | Files already identical are reported as up to date; running twice is a successful no-op.                  |
| No partial installs | A write failure rolls back every file and directory the run created (exit 6).                             |
| `--dry-run`         | Prints the plan and writes nothing.                                                                       |

Exit codes: `0` ok · `2` usage (bad or missing flag value, unknown option) · `3` unknown component (with suggestions) · `4` destination conflict · `5` registry source missing · `6` filesystem error.

There is no updater: re-run with `--force` to take a newer copy, after checking your own edits.
