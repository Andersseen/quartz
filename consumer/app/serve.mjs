// Minimal production server for the built consumer: static browser assets + the Angular SSR
// request handler. Deliberately dependency-free (no express) so the fixture only needs Angular.
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(process.argv[2] ?? 'dist');
const port = Number(process.env['PORT'] ?? 4000);
const { reqHandler } = await import(pathToFileURL(join(root, 'server/server.mjs')).href);

const types = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.map': 'application/json',
};
const browser = join(root, 'browser');

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const file = normalize(join(browser, decodeURIComponent(url.pathname)));
  if (file.startsWith(browser) && extname(file) && existsSync(file) && statSync(file).isFile()) {
    res.setHeader('content-type', types[extname(file)] ?? 'application/octet-stream');
    res.setHeader('cache-control', 'public, max-age=31536000, immutable');
    createReadStream(file).pipe(res);
    return;
  }
  reqHandler(req, res, (error) => {
    res.statusCode = error ? 500 : 404;
    res.end(error ? String(error) : 'Not found');
  });
}).listen(port, () => console.log(`consumer listening on ${port}`));
