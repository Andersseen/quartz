#!/usr/bin/env node
/**
 * Keeps per-symbol API reference pages out of the Pagefind index (before `doq-search index`).
 *
 * Doqs indexes every document body and has no per-document opt-out, so ~240 generated pages with
 * "Overview / Definition" sections outrank the hand-written guides for queries such as
 * "combobox". The three API index pages (which list every symbol with its summary) stay indexed.
 * The pages themselves remain public and linked.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist/analog/public');
const apiRoot = join(root, 'docs/reference/api');
let stripped = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name === 'index.html') {
      const rel = relative(apiRoot, dir).split('/').filter(Boolean);
      // <package>/index.html is the symbol list; <package>/<symbol>/index.html is a symbol page.
      if (rel.length < 2) continue;
      const html = readFileSync(path, 'utf8');
      const next = html.replace(' data-pagefind-body=""', '').replace(' data-pagefind-body', '');
      if (next !== html) {
        writeFileSync(path, next);
        stripped++;
      }
    }
  }
}

walk(apiRoot);
console.log(`prepare-search: ${stripped} API symbol pages excluded from the search index`);
