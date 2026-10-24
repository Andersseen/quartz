#!/usr/bin/env node
/**
 * Production-style static server for the prerendered documentation site.
 *
 * Mimics the Cloudflare Pages behaviours the site relies on: `<dir>/index.html` for directory
 * URLs, the `_redirects` file (301/302 rules and `:splat`), and a
 * real 404 for unknown paths. No SPA fallback. Usage: node scripts/preview-static.mjs <dir> [port]
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist/analog/public');
const port = Number(process.argv[3] ?? process.env.E2E_PORT ?? 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.pf_meta': 'application/octet-stream',
  '.pf_fragment': 'application/octet-stream',
  '.pf_index': 'application/octet-stream',
  '.pagefind': 'application/octet-stream',
};

const redirects = [];
const redirectsFile = join(root, '_redirects');
if (existsSync(redirectsFile)) {
  for (const line of readFileSync(redirectsFile, 'utf8').split('\n')) {
    const text = line.trim();
    if (!text || text.startsWith('#')) continue;
    const [from, to, status = '302'] = text.split(/\s+/);
    redirects.push({ from, to, status: Number(status) });
  }
}

function matchRedirect(pathname) {
  for (const rule of redirects) {
    if (rule.from.endsWith('*')) {
      const prefix = rule.from.slice(0, -1);
      if (pathname.startsWith(prefix)) {
        return { ...rule, to: rule.to.replace(':splat', pathname.slice(prefix.length)) };
      }
    } else if (pathname === rule.from || pathname === `${rule.from}/`) {
      return rule;
    }
  }
  return null;
}

function resolveFile(pathname) {
  const target = normalize(join(root, decodeURIComponent(pathname)));
  if (!target.startsWith(root)) return null;
  if (existsSync(target) && statSync(target).isFile()) return target;
  const index = join(target, 'index.html');
  if (existsSync(index)) return index;
  return null;
}

createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const redirect = matchRedirect(url.pathname);
  if (redirect && redirect.status >= 300 && redirect.status < 400) {
    response.writeHead(redirect.status, { location: redirect.to + url.search });
    response.end();
    return;
  }
  const file = resolveFile(url.pathname);
  if (!file) {
    const notFound = join(root, '404.html');
    response.writeHead(404, { 'content-type': TYPES['.html'] });
    response.end(existsSync(notFound) ? readFileSync(notFound) : 'Not found');
    return;
  }
  response.writeHead(200, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    'cache-control': 'no-cache',
  });
  response.end(readFileSync(file));
}).listen(port, '127.0.0.1', () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}`);
});
