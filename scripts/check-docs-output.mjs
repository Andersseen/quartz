#!/usr/bin/env node
/**
 * Static integrity check of the prerendered documentation site (run after `pnpm build:demo`):
 *
 *  - every internal link/asset in every HTML page resolves to a file, a directory index or a
 *    `_redirects` rule, and `#fragment` links point to an existing id in the target page;
 *  - every page has one <title>, one meta description, and docs pages exactly one <h1>;
 *  - no page declares more than one canonical URL, and no two pages share a canonical URL;
 *  - every `_redirects` target exists (no redirect to a 404, no redirect loops).
 *
 * Usage: node scripts/check-docs-output.mjs [siteDir]
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist/analog/public');
const errors = [];
const fail = (message) => errors.push(message);

const redirects = new Map();
const redirectsFile = join(root, '_redirects');
if (existsSync(redirectsFile)) {
  for (const line of readFileSync(redirectsFile, 'utf8').split('\n')) {
    const text = line.trim();
    if (!text || text.startsWith('#')) continue;
    const [from, to] = text.split(/\s+/);
    redirects.set(from.replace(/\/$/, '') || '/', to);
  }
}

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...htmlFiles(path));
    else if (name.endsWith('.html')) out.push(path);
  }
  return out;
}

const fileFor = (pathname) => {
  const clean = decodeURIComponent(pathname).replace(/\/$/, '');
  for (const candidate of [join(root, clean), join(root, clean, 'index.html')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
};

const pages = htmlFiles(root).filter((file) => !file.includes(`${join(root, 'pagefind')}`));
const idsCache = new Map();
const idsOf = (file) => {
  if (!idsCache.has(file)) {
    idsCache.set(
      file,
      new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])),
    );
  }
  return idsCache.get(file);
};

const canonicals = new Map();
for (const page of pages) {
  const rel = `/${relative(root, page)}`;
  const html = readFileSync(page, 'utf8');
  const isDoc = rel.startsWith('/docs/') && !rel.startsWith('/docs/index/');

  if ((html.match(/<title>/g) ?? []).length !== 1) fail(`${rel}: expected exactly one <title>`);
  if ((html.match(/<meta name="description"/g) ?? []).length !== 1)
    fail(`${rel}: expected exactly one meta description`);
  if (isDoc && (html.match(/<h1[\s>]/g) ?? []).length !== 1)
    fail(`${rel}: expected exactly one <h1>`);

  const canon = [...html.matchAll(/<link[^>]+rel="canonical"[^>]*href="([^"]+)"/g)].map(
    (m) => m[1],
  );
  if (canon.length > 1) fail(`${rel}: ${canon.length} canonical links`);
  for (const url of canon) {
    if (canonicals.has(url)) fail(`${rel}: canonical ${url} also used by ${canonicals.get(url)}`);
    canonicals.set(url, rel);
  }

  for (const match of html.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)) {
    const target = match[1];
    if (target.startsWith('//')) continue;
    const [pathAndQuery, hash] = target.split('#');
    const pathname = pathAndQuery.split('?')[0] || rel.replace(/index\.html$/, '');
    if (pathname === '/') continue;
    const redirected = redirects.get(pathname.replace(/\/$/, ''));
    if (redirected) {
      fail(
        `${rel}: links to ${pathname}, which only redirects to ${redirected} (link the canonical URL)`,
      );
      continue;
    }
    const file = fileFor(pathname);
    if (!file) {
      fail(`${rel}: broken link ${target}`);
      continue;
    }
    if (hash && file.endsWith('.html') && !idsOf(file).has(decodeURIComponent(hash))) {
      fail(`${rel}: ${target} — no element with id "${hash}"`);
    }
  }
}

for (const [from, to] of redirects) {
  if (to === from) fail(`_redirects: ${from} redirects to itself`);
  if (redirects.has(to.replace(/\/$/, '')))
    fail(`_redirects: ${from} → ${to} chains into another redirect`);
  if (!fileFor(to)) fail(`_redirects: ${from} → ${to} target does not exist`);
}

if (errors.length) {
  console.error(
    `✗ docs output check failed (${errors.length}):\n${errors
      .slice(0, 60)
      .map((e) => `  - ${e}`)
      .join('\n')}`,
  );
  process.exit(1);
}
console.log(
  `✓ docs output check passed: ${pages.length} pages, ${redirects.size} redirects, ${canonicals.size} canonicals`,
);
