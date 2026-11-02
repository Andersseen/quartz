#!/usr/bin/env node
/**
 * Production-style static server for the prerendered documentation site.
 *
 * Mimics the Cloudflare Pages behaviours the site relies on: `<dir>/index.html` for directory
 * URLs, the `_redirects` file (301/302 rules and `:splat`), and a
 * real 404 for unknown paths. No SPA fallback. Usage: node scripts/preview-static.mjs <dir> [port]
 *
 * Reliability contract (0.21):
 *  - a bad request can never take the process down: malformed percent-encoding is a 400, any
 *    handler failure is a 500, and `clientError`/stream errors are contained;
 *  - keep-alive sockets outlive the browsers' idle timeouts, so a connection a browser reuses is
 *    never closed underneath it (Node's 5 s default races with Playwright's reused sockets);
 *  - files are streamed with an exact `content-length` (no whole-file reads on the event loop);
 *  - SIGTERM/SIGINT drain and close the listener, then exit 0;
 *  - with `E2E_SERVER_LOG=<file>` every response >= 400, every error and the lifecycle are appended
 *    as JSON lines (successful requests are not logged), for attaching to failed E2E runs.
 */
import { createServer } from 'node:http';
import { appendFileSync, createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist/analog/public');
const port = Number(process.argv[3] ?? process.env.E2E_PORT ?? 4173);
const logFile = process.env.E2E_SERVER_LOG;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.pf_meta': 'application/octet-stream',
  '.pf_fragment': 'application/octet-stream',
  '.pf_index': 'application/octet-stream',
  '.pagefind': 'application/octet-stream',
};

function log(event, details = {}) {
  if (!logFile) return;
  try {
    appendFileSync(
      logFile,
      `${JSON.stringify({ t: new Date().toISOString(), event, ...details })}\n`,
    );
  } catch {
    // Logging must never affect serving.
  }
}

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

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/** Resolves a URL path to a file under `root`, or null. Throws URIError on malformed encoding. */
function resolveFile(pathname) {
  const target = normalize(join(root, decodeURIComponent(pathname)));
  if (target !== root && !target.startsWith(root + sep)) return null;
  if (isFile(target)) return target;
  const index = join(target, 'index.html');
  return isFile(index) ? index : null;
}

function send(response, status, headers, body) {
  response.writeHead(status, headers);
  response.end(body);
}

function handle(request, response) {
  const method = request.method ?? 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    return send(response, 405, { allow: 'GET, HEAD' });
  }
  const url = new URL(request.url ?? '/', 'http://localhost');
  const redirect = matchRedirect(url.pathname);
  if (redirect && redirect.status >= 300 && redirect.status < 400) {
    return send(response, redirect.status, { location: redirect.to + url.search });
  }
  const file = resolveFile(url.pathname);
  if (!file) {
    const notFound = join(root, '404.html');
    const body = isFile(notFound) ? readFileSync(notFound) : 'Not found';
    return send(
      response,
      404,
      { 'content-type': TYPES['.html'] },
      method === 'HEAD' ? undefined : body,
    );
  }
  const headers = {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    'content-length': statSync(file).size,
    'cache-control': 'no-cache',
  };
  response.writeHead(200, headers);
  if (method === 'HEAD') return response.end();
  const stream = createReadStream(file);
  stream.on('error', (error) => {
    log('stream-error', { url: request.url, message: error.message });
    response.destroy(error);
  });
  response.on('close', () => stream.destroy());
  stream.pipe(response);
}

const server = createServer((request, response) => {
  const started = Date.now();
  response.on('finish', () => {
    if (response.statusCode >= 400) {
      log('response', {
        status: response.statusCode,
        method: request.method,
        url: request.url,
        ms: Date.now() - started,
      });
    }
  });
  try {
    handle(request, response);
  } catch (error) {
    const malformed = error instanceof URIError;
    log('request-error', { url: request.url, malformed, message: String(error?.message ?? error) });
    if (!response.headersSent) {
      send(
        response,
        malformed ? 400 : 500,
        { 'content-type': 'text/plain; charset=utf-8' },
        malformed ? 'Bad request' : 'Internal error',
      );
    } else {
      response.destroy();
    }
  }
});

// Idle keep-alive sockets must outlive every browser's own idle timeout (Node defaults to 5 s, which
// races with browsers reusing a socket the server is just closing). `headersTimeout` must exceed it.
server.keepAliveTimeout = 120_000;
server.headersTimeout = 125_000;
server.requestTimeout = 0;
server.on('clientError', (error, socket) => {
  log('client-error', { message: error.message, code: error.code });
  if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\nconnection: close\r\n\r\n');
  else socket.destroy();
});

let stopping = false;
function stop(signal) {
  if (stopping) return;
  stopping = true;
  log('stopping', { signal });
  server.close(() => process.exit(0));
  server.closeAllConnections();
  setTimeout(() => process.exit(0), 2000).unref();
}
process.on('SIGTERM', () => stop('SIGTERM'));
process.on('SIGINT', () => stop('SIGINT'));
process.on('uncaughtException', (error) => {
  log('uncaught-exception', { message: error.message, stack: error.stack });
  console.error(error);
  process.exit(1);
});

server.listen(port, '127.0.0.1', () => {
  log('listening', { root, port, pid: process.pid, node: process.version });
  console.log(`Serving ${root} at http://127.0.0.1:${port}`);
});
