# Support

Quartz is maintained on a best-effort basis. There is **no support SLA** and no guaranteed response time.

## Supported platforms

| Item     | Supported                                                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------- | --- | ----------------------------------------------------------------------------------------- |
| Angular  | `^21.2.0                                                                                                                              |     | ^22.0.0` — each combination is exercised by the consumer matrix (`docs/compatibility.md`) |
| RxJS     | `^7.8.0`                                                                                                                              |
| Node     | The versions Angular itself supports for your Angular major (<https://angular.dev/reference/versions>); CI uses 20.19, 22 and 24      |
| Browsers | Current Chromium, Firefox and WebKit (Playwright-tested)                                                                              |
| Packages | `@quartz-headless/core`, `@quartz-headless/primitives` (+ `/forms`). The unscoped `quartz-headless` package is frozen and unsupported |

Not supported or not verified: Angular < 21.2, Node outside Angular's table, touch input and physical IME (manual-only), genuine browser Autofill (see `docs/api/volt-parity.md`).

## Getting help

1. Check the docs (<https://quartz-headless.pages.dev>), `docs/compatibility.md` and the migration notes.
2. Search existing issues; then open a _Bug report_ with a minimal reproduction, or a question as a discussion/issue.
3. Accessibility regressions have their own template. Security issues: `SECURITY.md`.

Fixes ship in the next release through the guarded pipeline; a hotfix patch follows `docs/releases/RELEASE_RUNBOOK.md` §10 and does not back-port to unsupported Angular or Node versions.
