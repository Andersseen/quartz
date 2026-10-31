#!/usr/bin/env node
/**
 * Writes `robots.txt` and `sitemap.xml` into the prerendered site (run after `vite build`).
 * The sitemap lists every prerendered public page, derived from the HTML files actually emitted;
 * Playwright fixtures (`/e2e-*`) are excluded and disallowed in robots.txt.
 *
 * Usage: node scripts/generate-sitemap.mjs [siteDir]
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ORIGIN = 'https://quartz-headless.pages.dev';
const root = resolve(process.argv[2] ?? 'dist/analog/public');

function pages(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...pages(path));
    else if (name === 'index.html') out.push(path);
  }
  return out;
}

const paths = pages(root)
  .map((file) => `/${relative(root, join(file, '..'))}`.replace(/\/\.$/, '/').replace(/^\/$/, '/'))
  .map((path) => (path === '' ? '/' : path))
  .filter((path) => !path.startsWith('/e2e-') && !path.startsWith('/assets'))
  .sort();

const urls = paths.map((path) => `  <url><loc>${ORIGIN}${path}</loc></url>`).join('\n');
writeFileSync(
  join(root, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
);
writeFileSync(
  join(root, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /e2e-\n\nSitemap: ${ORIGIN}/sitemap.xml\n`,
);
console.log(`sitemap: ${paths.length} URLs, robots.txt written to ${root}`);
