# Spec: <feature name>

> Copy this file to `docs/ai/specs/<feature>.md`. Never edit the template itself.
> Fill every section; write "N/A" explicitly rather than deleting a section.

- **Status:** Draft | Approved | In progress | Done
- **Branch:** feature/<topic>
- **Date:** YYYY-MM-DD
- **Related:** links to issues / PRs / other specs

## 1. Problem

What is missing or broken, from the consumer's point of view? 2–4 sentences.

## 2. Goal / non-goals

- Goal: the single outcome this spec delivers.
- Non-goals: what we are explicitly NOT doing (prevents scope creep).

## 3. Public API (design this FIRST)

The exact exports a consumer will use. Signatures, not prose:

```ts
// directives / services / types to be exported from public-api.ts
```

Include: selector names (`qz-*` / `qzCamelCase`), config interface +
`DEFAULT_<NAME>_CONFIG` values, template usage example.

## 4. Behaviour

Numbered, testable statements. Each one becomes at least one test.

1. When <trigger>, then <observable result>.
2. …

### Keyboard & ARIA (mandatory for primitives)

| Key / attribute | Behaviour |
| --------------- | --------- |

### SSR behaviour

What happens when there is no `window`? (Default answer: no-op, no DOM created.)

## 5. Files to create / modify

| File                                | Action | Purpose               |
| ----------------------------------- | ------ | --------------------- |
| `packages/quartz/src/lib/<x>/…`     | create | …                     |
| `packages/quartz/src/public-api.ts` | edit   | export new API        |
| `cli/registry.js`                   | edit   | register files + deps |
| `src/app/pages/(docs)/<x>.page.ts`  | create | demo                  |

## 6. Test plan

- Unit: list the test cases (mirror §4 numbering).
- E2E: user flow(s) if any, or N/A.

## 7. Definition of done

- [ ] All §4 behaviours implemented and tested
- [ ] WORKFLOW.md checklist for this task type completed
- [ ] `pnpm lint && pnpm typecheck && pnpm test` green
- [ ] `docs/ai/STATE.md` updated

## 8. Open questions

Things needing a user decision. Resolve before Status → Approved.
