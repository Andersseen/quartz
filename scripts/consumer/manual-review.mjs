#!/usr/bin/env node
/**
 * Manual assistive-technology review tooling (0.19).
 *
 * `consumer/manual-review/scenarios.json` holds the machine-readable form of the fourteen rows in
 * docs/releases/0.17-manual-a11y.md (which stays the record of outcomes). From it this module
 *   - builds a static, accessible review index (steps, keys, expected focus/announcement, evidence
 *     capture, and a results recorder that downloads JSON / Markdown rows), and
 *   - checks that the scenarios and the Markdown matrix still describe the same rows.
 *
 * Outcomes always start as PENDING. Nothing here executes a screen reader or records a result on
 * anyone's behalf.
 *
 * Usage: node scripts/consumer/manual-review.mjs --check
 *        node scripts/consumer/manual-review.mjs --html <out.html> [--base http://localhost:4300]
 * `scripts/consumer/run.mjs --stage serve` imports this module and serves the index next to the app.
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const SCENARIOS_FILE = join(ROOT, 'consumer/manual-review/scenarios.json');
export const MATRIX_FILE = join(ROOT, 'docs/releases/0.17-manual-a11y.md');
export const OUTCOMES = ['PENDING', 'PASS', 'FAIL'];

export function loadScenarios(file = SCENARIOS_FILE) {
  return JSON.parse(readFileSync(file, 'utf8')).scenarios;
}

/** Rows of the Markdown matrix: `{ id, page, outcome }`. */
export function parseMatrix(markdown) {
  return [
    ...markdown.matchAll(
      /^\| (\d+)\s+\|[^|]*\|\s*`(\/[a-z]+)`[^|]*\|.*\|\s*(PENDING|PASS|FAIL)\s*\|/gm,
    ),
  ].map((m) => ({ id: Number(m[1]), page: m[2], outcome: m[3] }));
}

/** Returns a list of problems; empty when scenarios and matrix agree. */
export function checkAgainstMatrix(scenarios, markdown) {
  const problems = [];
  const rows = parseMatrix(markdown);
  const ids = scenarios.map((s) => s.id);
  if (new Set(ids).size !== ids.length) problems.push('duplicate scenario ids');
  for (const s of scenarios) {
    for (const key of ['title', 'page', 'control', 'keys', 'expectedFocus', 'expectedAnnouncement'])
      if (!s[key]) problems.push(`scenario ${s.id}: missing ${key}`);
    if (!Array.isArray(s.steps) || s.steps.length === 0)
      problems.push(`scenario ${s.id}: no steps`);
    const row = rows.find((r) => r.id === s.id);
    if (!row) problems.push(`scenario ${s.id} has no row in the Markdown matrix`);
    else if (row.page !== s.page)
      problems.push(`scenario ${s.id}: page ${s.page} differs from matrix ${row.page}`);
  }
  for (const r of rows)
    if (!ids.includes(r.id)) problems.push(`matrix row ${r.id} has no scenario`);
  return problems;
}

const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

/**
 * @param {object} options
 * @param {Array} options.scenarios
 * @param {string} options.baseUrl base URL of the served consumer app
 * @param {object} [options.run] { fixture, versions, tarballs, source } printed so a result names the exact build
 */
export function buildReviewHtml({ scenarios, baseUrl, run = {} }) {
  const base = baseUrl.replace(/\/$/, '');
  const versions = Object.entries(run.versions ?? {})
    .map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`)
    .join('');
  const tarballs = Object.entries(run.tarballs ?? {})
    .map(
      ([k, v]) =>
        `<tr><th scope="row">${esc(k)}</th><td>${esc(v.file)}</td><td><code>${esc(v.sha256)}</code></td></tr>`,
    )
    .join('');
  const toc = scenarios
    .map(
      (s) =>
        `<li><a href="#s${s.id}">${s.id}. ${esc(s.title)}</a> — <code>${esc(s.page)}</code></li>`,
    )
    .join('');
  const sections = scenarios
    .map(
      (s) => `<section id="s${s.id}" class="scenario" data-id="${s.id}" aria-labelledby="h${s.id}">
  <h2 id="h${s.id}">${s.id}. ${esc(s.title)}</h2>
  <p><a href="${esc(base + s.page)}" target="_blank" rel="noopener">Open ${esc(s.page)}</a> · control: <strong>${esc(s.control)}</strong></p>
  <h3>Keyboard</h3><p>${esc(s.keys)}</p>
  <h3>Steps</h3><ol>${s.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
  <h3>Expected focus</h3><p>${esc(s.expectedFocus)}</p>
  <h3>Expected announcement</h3><p>${esc(s.expectedAnnouncement)}</p>
  ${s.reviewTarget ? `<p class="target"><strong>Review target (not a confirmed defect):</strong> ${esc(s.reviewTarget)}</p>` : ''}
  <fieldset>
    <legend>Result for scenario ${s.id}</legend>
    <p><label for="o${s.id}">Outcome</label>
      <select id="o${s.id}" data-field="outcome">${OUTCOMES.map((o) => `<option>${o}</option>`).join('')}</select></p>
    <p><label for="a${s.id}">Actual announcements and focus (verbatim)</label>
      <textarea id="a${s.id}" data-field="actual" rows="3"></textarea></p>
    <p><label for="e${s.id}">Evidence (recording, transcript or speech-viewer screenshot path/link) or reason it is PENDING</label>
      <input id="e${s.id}" data-field="evidence" type="text"></p>
  </fieldset>
</section>`,
    )
    .join('\n');

  const data = JSON.stringify({
    scenarios: scenarios.map((s) => ({ id: s.id, title: s.title, page: s.page })),
    run,
  }).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Quartz manual assistive-technology review</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; max-width: 62rem; margin: 0 auto; padding: 1rem; color: #111; background: #fff; }
  a { color: #0b4fb3; }
  .skip { position: absolute; left: -999px; } .skip:focus { left: 1rem; top: 1rem; background: #fff; padding: .5rem; z-index: 2; }
  .scenario { border-top: 2px solid #333; margin-top: 2rem; padding-top: .5rem; }
  .target { background: #fff3cd; padding: .5rem; border-radius: 4px; }
  table { border-collapse: collapse; } th, td { border: 1px solid #888; padding: .25rem .5rem; text-align: left; }
  textarea, input[type=text] { width: 100%; max-width: 100%; box-sizing: border-box; font: inherit; }
  fieldset { border: 1px solid #555; }
  :focus-visible { outline: 3px solid #0b4fb3; outline-offset: 2px; }
</style>
</head>
<body>
<a class="skip" href="#main">Skip to scenarios</a>
<header>
  <h1>Quartz manual assistive-technology review</h1>
  <p>This page runs no screen reader and records nothing automatically. Outcomes start as <strong>PENDING</strong>; set PASS or FAIL only after you ran the scenario, and attach evidence for either. A scenario you could not run stays PENDING with the reason. Automated axe results are not a substitute.</p>
  <p>The record of outcomes is <code>docs/releases/0.17-manual-a11y.md</code>; use <em>Download results</em> and copy the Markdown rows into it.</p>
</header>
<main id="main">
<h2>Environment (record once)</h2>
<p><label for="env-os">Operating system and version</label><input id="env-os" type="text" data-env="os"></p>
<p><label for="env-browser">Browser and exact version</label><input id="env-browser" type="text" data-env="browser"></p>
<p><label for="env-sr">Screen reader and exact version</label><input id="env-sr" type="text" data-env="screenReader"></p>
<p><label for="env-operator">Operator (name or handle)</label><input id="env-operator" type="text" data-env="operator"></p>
<h2>Tested build</h2>
<p>Fixture <strong>${esc(run.fixture ?? 'unknown')}</strong> · tarball source <strong>${esc(run.source ?? 'unknown')}</strong> · app at <code>${esc(base)}</code></p>
<table><caption>Installed versions</caption><tbody>${versions}</tbody></table>
<table><caption>Tarballs (sha256)</caption><tbody>${tarballs}</tbody></table>
<h2>Capturing evidence</h2>
<ul>
  <li>macOS VoiceOver: enable <em>Caption Panel</em> (VO+Cmd+F10 shows the speech text) and screenshot it, or screen-record with audio.</li>
  <li>NVDA: <em>Tools → Speech Viewer</em> and save a screenshot, or log with <em>Tools → Log viewer</em>.</li>
  <li>Name files <code>row-&lt;id&gt;-&lt;browser&gt;-&lt;sr&gt;.png|mp4</code> and note the path in the Evidence field.</li>
  <li>Reload each page fresh before a scenario so hydration is exercised.</li>
</ul>
<h2>Scenarios</h2>
<nav aria-label="Scenarios"><ol>${toc}</ol></nav>
${sections}
<h2>Results</h2>
<p><button type="button" id="download">Download results (JSON)</button> <button type="button" id="copy">Copy Markdown rows</button> <span id="status" role="status"></span></p>
</main>
<script>
(() => {
  const DATA = ${data};
  const KEY = 'quartz-manual-review:' + (DATA.run.fixture || '') + ':' + location.port;
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
  const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage unavailable */ } };
  const state = read();
  const fields = [...document.querySelectorAll('[data-field],[data-env]')];
  for (const el of fields) {
    const k = el.id; if (state[k] != null) el.value = state[k];
    el.addEventListener('input', () => { const s = read(); s[k] = el.value; write(s); });
  }
  const collect = () => ({
    recordedAt: new Date().toISOString(),
    environment: Object.fromEntries([...document.querySelectorAll('[data-env]')].map((e) => [e.dataset.env, e.value])),
    build: DATA.run,
    results: DATA.scenarios.map((s) => ({
      id: s.id, page: s.page, title: s.title,
      outcome: document.getElementById('o' + s.id).value,
      actual: document.getElementById('a' + s.id).value,
      evidence: document.getElementById('e' + s.id).value,
    })),
  });
  const say = (m) => { document.getElementById('status').textContent = m; };
  document.getElementById('download').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(collect(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'manual-a11y-results.json'; a.click();
    say('Results downloaded.');
  });
  document.getElementById('copy').addEventListener('click', async () => {
    const c = collect();
    const env = [c.environment.browser, c.environment.screenReader].filter(Boolean).join(' / ');
    const rows = c.results.map((r) => '| ' + r.id + ' | ' + env + ' | ' + r.title + ' (' + r.page + ') | ' + r.outcome + ' | ' + (r.actual || '').replace(/\\|/g, '/').replace(/\\n/g, ' ') + ' | ' + (r.evidence || '').replace(/\\|/g, '/') + ' |').join('\\n');
    try { await navigator.clipboard.writeText(rows); say('Markdown rows copied.'); } catch { say('Clipboard unavailable; use Download results.'); }
  });
})();
</script>
</body>
</html>
`;
}

/** Serves the review index (and nothing else) on `port`. Returns the http server. */
export function startReviewServer({ port, scenarios, baseUrl, run }) {
  const html = buildReviewHtml({ scenarios, baseUrl, run });
  const server = createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(html);
    } else {
      res.writeHead(404).end('not found');
    }
  });
  server.listen(port);
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const scenarios = loadScenarios();
  if (args.includes('--check')) {
    const problems = checkAgainstMatrix(scenarios, readFileSync(MATRIX_FILE, 'utf8'));
    if (problems.length) {
      console.error(
        '✗ manual review scenarios disagree with the matrix:\n  ' + problems.join('\n  '),
      );
      process.exit(1);
    }
    console.log(
      `✓ ${scenarios.length} manual review scenarios match docs/releases/0.17-manual-a11y.md`,
    );
  }
  const out = args[args.indexOf('--html') + 1];
  if (args.includes('--html') && out) {
    const base = args.includes('--base')
      ? args[args.indexOf('--base') + 1]
      : 'http://localhost:4300';
    writeFileSync(out, buildReviewHtml({ scenarios, baseUrl: base }));
    console.log(`✓ wrote ${out}`);
  }
}
