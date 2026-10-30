#!/usr/bin/env node
/**
 * Generates docs/api/API_INVENTORY.md from docs/api/snapshots/*.json — the single machine-checked
 * export registry (written by `node scripts/api-guard.js --update` from the BUILT declarations).
 * There is deliberately no second hand-maintained list: this file is a readable projection of the
 * snapshots, and `--check` fails if it is stale.
 *
 *   node scripts/api-inventory.mjs           write
 *   node scripts/api-inventory.mjs --check   verify (CI)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs/api/API_INVENTORY.md');
const ENTRY_POINTS = [
  ['core', '@quartz-headless/core'],
  ['primitives', '@quartz-headless/primitives'],
  ['primitives-forms', '@quartz-headless/primitives/forms'],
];

const load = (name) => JSON.parse(readFileSync(join(ROOT, 'docs/api/snapshots', `${name}.json`), 'utf8'));
const esc = (s) => String(s).replace(/\|/g, '\\|');
const code = (s) => `\`${esc(s)}\``;

/** `{ "alias": "x"; "required": true; ... }` -> { alias, required } */
function parseInput(text) {
  return {
    alias: /"alias":\s*"([^"]+)"/.exec(text)?.[1],
    required: /"required":\s*true/.test(text),
  };
}

function bindings(angular) {
  const inputs = Object.entries(angular.inputs).map(([prop, text]) => {
    const { alias, required } = parseInput(text);
    const name = alias && alias !== prop ? `${alias} (${prop})` : prop;
    return required ? `${name}*` : name;
  });
  // A `model()` surfaces as an input `x` plus an output `xChange`.
  const outputNames = Object.keys(angular.outputs);
  const models = Object.keys(angular.inputs).filter((i) => outputNames.includes(`${i}Change`));
  const outputs = outputNames.filter((o) => !models.some((m) => `${m}Change` === o));
  return { inputs, outputs, models };
}

function section(name, title, snap) {
  const entries = Object.entries(snap.exports);
  const byKind = (k) => entries.filter(([, v]) => v.kind === k);
  const withMeta = entries.filter(([, v]) => v.angular);
  const services = byKind('class').filter(([, v]) => !v.angular);
  const lines = [`## ${title}`, ''];
  const labels = {
    class: 'classes',
    function: 'functions',
    interface: 'interfaces',
    type: 'type aliases',
    const: 'constants',
    enum: 'enums',
  };
  const counts = Object.entries(labels)
    .map(([k, label]) => `${byKind(k).length} ${label}`)
    .join(' · ');
  lines.push(`${entries.length} exports — ${counts}. ${withMeta.length} are directives or components.`, '');

  lines.push('### Directives and components', '');
  lines.push('| Class | Selector | exportAs | Inputs (`*` required) | Models | Outputs |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const [cls, v] of withMeta) {
    const b = bindings(v.angular);
    const list = (xs) => (xs.length ? xs.map(code).join(', ') : '—');
    const exportAs = v.angular.exportAs ? code(v.angular.exportAs.replace(/[[\]"]/g, '')) : '—';
    lines.push(
      `| ${code(cls)} | ${code(v.angular.selector)} | ${exportAs} | ${list(b.inputs.filter((i) => !b.models.includes(i)))} | ${list(b.models)} | ${list(b.outputs)} |`,
    );
  }
  lines.push('');

  if (services.length) {
    lines.push('### Services and other classes', '');
    lines.push('| Class | Public members |');
    lines.push('| --- | --- |');
    for (const [cls, v] of services) {
      const members = Object.keys(v.members ?? {});
      lines.push(`| ${code(cls)} | ${members.length ? members.map(code).join(', ') : '—'} |`);
    }
    lines.push('');
  }

  const fns = byKind('function');
  if (fns.length) {
    lines.push('### Functions', '');
    for (const [fn, v] of fns) for (const sig of v.signatures) lines.push(`- ${code(`${fn}${sig}`)}`);
    lines.push('');
  }

  const names = (kind) => byKind(kind).map(([n]) => code(n)).join(', ');
  for (const [kind, heading] of [
    ['interface', 'Interfaces'],
    ['type', 'Type aliases'],
    ['enum', 'Enums'],
    ['const', 'Constants'],
  ])
    if (byKind(kind).length) lines.push(`### ${heading}`, '', names(kind), '');

  const defaults = Object.entries(snap.defaults);
  if (defaults.length) {
    lines.push('### Documented defaults (values read from the built ESM)', '');
    lines.push('Changing any of these values is a behavior change and fails the API guard.', '');
    for (const [k, v] of defaults) lines.push(`- ${code(k)} = ${code(JSON.stringify(v))}`);
    lines.push('');
  }
  return lines.join('\n');
}

export function render() {
  const head = [
    '# Public API inventory (freeze candidate)',
    '',
    '> **Generated** by `node scripts/api-inventory.mjs` from `docs/api/snapshots/*.json`, which are written by',
    '> `node scripts/api-guard.js --update` from the **built** `.d.ts` and ESM of each package. Do not edit by hand;',
    '> `pnpm api:inventory:check` fails when this file is stale. It is the readable projection of the one machine-checked',
    '> export registry — behavior, focus and ARIA contracts live in `docs/api/public-surface.md` and the per-primitive',
    '> docs, and DOM hooks (`data-qz-*`) are documented there as well.',
    '',
    '## What is public',
    '',
    '- Everything exported from the three entry points below **is** the supported API. Anything else — deep imports into',
    '  `dist/`, `ɵ`-prefixed members, `private`/`protected` members and `#private` fields — is internal.',
    '- Public means: export names, directive selectors and `exportAs`, input/model/output names (including `alias`),',
    '  public method and property types, documented `DEFAULT_*` values, and the secondary entry point split.',
    '- `@quartz-headless/primitives/forms` is the only module that may import `@angular/forms`; the main entry must not.',
    '- Peer ranges: Angular `^21.2.0 || ^22.0.0`; Primitives requires `@quartz-headless/core` at the same version',
    '  (`^X.Y.Z` for stable releases, the exact version for `-beta.N` / `-rc.N`).',
    '',
  ].join('\n');
  const parts = ENTRY_POINTS.map(([snap, title]) => section(snap, `\`${title}\``, load(snap)));
  return `${head}\n${parts.join('\n')}`;
}

async function format(markdown) {
  const config = (await prettier.resolveConfig(OUT)) ?? {};
  return prettier.format(markdown, { ...config, filepath: OUT });
}

const formatted = await format(render());
if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(OUT, 'utf8');
  } catch {
    /* missing */
  }
  if (current !== formatted) {
    console.error('✗ docs/api/API_INVENTORY.md is stale — run `pnpm api:inventory` and commit the result');
    process.exit(1);
  }
  console.log('✓ docs/api/API_INVENTORY.md matches the API snapshots');
} else {
  writeFileSync(OUT, formatted);
  console.log(`✓ wrote ${OUT}`);
}
