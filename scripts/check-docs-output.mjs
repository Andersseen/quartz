#!/usr/bin/env node
/**
 * Static integrity check of the prerendered documentation site (run after `pnpm build:demo`):
 *
 *  - every internal link/asset in every HTML page resolves to a file, a directory index or a
 *    `_redirects` rule, and `#fragment` links point to an existing id in the target page;
 *  - every page has one <title>, one meta description, and docs pages exactly one <h1>;
 *  - no page declares more than one canonical URL, and no two pages share a canonical URL;
 *  - every `_redirects` target exists (no redirect to a 404, no redirect loops);
 *  - no shipped JavaScript contains an application component that skipped AOT compilation (a raw
 *    `selector:`/`template:` decorator). Such a component only fails at runtime with "JIT compiler
 *    unavailable"; this is the deterministic guard for the 0.16 intermittent home-route failure.
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

// AOT output defines components with `selectors:[[...]]`; a component left as a decorator literal still
// has the singular `selector:` next to its `template:`. Our own selectors all start with app-.
function jsFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...jsFiles(path));
    else if (name.endsWith('.js') || name.endsWith('.mjs')) out.push(path);
  }
  return out;
}
// A literal `@Component({` immediately before it is source text shown on the website (the demos
// render their own `?raw` source in a Code tab), not an executable decorator.
const JIT_COMPONENT = /(?<!@Component\(\{\s*)\bselector:\s*[`'"]app-[a-z0-9-]+[`'"]/;
for (const file of jsFiles(root)) {
  if (file.includes(`${join(root, 'pagefind')}`)) continue;
  if (JIT_COMPONENT.test(readFileSync(file, 'utf8'))) {
    fail(
      `${relative(root, file)}: contains a component that was not AOT-compiled (would throw "JIT compiler unavailable")`,
    );
  }
}

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

// Landing and catalogue: route-specific metadata, social defaults, robots and sitemap.
const ORIGIN = 'https://quartz-headless.pages.dev';
for (const [path, file] of [
  ['/', 'index.html'],
  ['/components', 'components/index.html'],
]) {
  const html = existsSync(join(root, file)) ? readFileSync(join(root, file), 'utf8') : '';
  const expectedUrl = `${ORIGIN}${path}`;
  if (!html.includes(`rel="canonical" href="${expectedUrl}"`))
    fail(`${path}: missing canonical ${expectedUrl}`);
  if (!html.includes(`property="og:url" content="${expectedUrl}"`))
    fail(`${path}: missing og:url ${expectedUrl}`);
  for (const needle of ['property="og:title"', 'property="og:description"', 'name="twitter:card"'])
    if (!html.includes(needle)) fail(`${path}: missing ${needle}`);
  if (!/<h1[\s>]/.test(html)) fail(`${path}: missing <h1>`);
  if (!html.includes('<main')) fail(`${path}: missing <main> landmark`);
}
const robotsFile = join(root, 'robots.txt');
const sitemapFile = join(root, 'sitemap.xml');
if (!existsSync(robotsFile) || !readFileSync(robotsFile, 'utf8').includes(`${ORIGIN}/sitemap.xml`))
  fail('robots.txt: missing or does not reference the sitemap');
if (!existsSync(sitemapFile)) fail('sitemap.xml: missing');
else {
  const locs = [...readFileSync(sitemapFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (m) => m[1],
  );
  if (new Set(locs).size !== locs.length) fail('sitemap.xml: duplicate URLs');
  for (const loc of locs) {
    if (!loc.startsWith(ORIGIN)) fail(`sitemap.xml: ${loc} is not on ${ORIGIN}`);
    else if (!fileFor(loc.slice(ORIGIN.length) || '/')) fail(`sitemap.xml: ${loc} does not exist`);
    if (loc.includes('/e2e-')) fail(`sitemap.xml: fixture page listed: ${loc}`);
  }
  for (const required of ['/', '/components', '/docs', '/docs/primitives/select'])
    if (!locs.includes(`${ORIGIN}${required}`)) fail(`sitemap.xml: missing ${required}`);
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
