#!/usr/bin/env node
/**
 * Generates (or verifies) the API reference pages with `doq-api` for each public entry point.
 *
 *   node scripts/docs-api.mjs generate   # pnpm docs:api
 *   node scripts/docs-api.mjs check      # pnpm docs:api:check (exit 1 when stale; writes nothing)
 *
 * One output directory per entry point (src/content/docs/reference/api/<id>/) keeps symbol names
 * from colliding across packages (e.g. a name exported by both Core and Primitives).
 */
import { spawnSync } from 'node:child_process';

const mode = process.argv[2];
if (mode !== 'generate' && mode !== 'check') {
  console.error('Usage: docs-api.mjs <generate|check>');
  process.exit(2);
}

const SOURCE_URL = 'https://github.com/Andersseen/quartz/blob/main/{path}#L{line}';
const ENTRIES = [
  {
    id: 'core',
    dir: 'packages/core',
    title: 'Core API reference',
    group: 'API: Core',
    order: 1000,
  },
  {
    id: 'primitives',
    dir: 'packages/primitives',
    title: 'Primitives API reference',
    group: 'API: Primitives',
    order: 1100,
  },
  {
    id: 'forms',
    dir: 'packages/primitives/forms',
    title: 'Forms API reference',
    group: 'API: Forms',
    order: 1500,
  },
];

let failed = false;
for (const entry of ENTRIES) {
  const args = [
    'exec',
    'doq-api',
    mode,
    '--project',
    `${entry.dir}/tsconfig.lib.json`,
    '--entry',
    `${entry.dir}/src/public-api.ts`,
    '--out',
    `src/content/docs/reference/api/${entry.id}`,
    '--group',
    entry.group,
    '--title',
    entry.title,
    '--order-start',
    String(entry.order),
    '--source-url',
    SOURCE_URL,
  ];
  console.log(`→ doq-api ${mode} ${entry.id}`);
  const result = spawnSync('pnpm', args, { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
