#!/usr/bin/env node
/**
 * Genuine browser-autofill verification (0.19) — docs/releases/0.19-autofill-verification.md.
 *
 * Drives the REAL Google Chrome (Playwright `channel: 'chrome'`, NOT the bundled Chromium, which
 * lacks the DevTools `Autofill` domain) in a fresh, throwaway, empty profile. A synthetic address is
 * registered with `Autofill.setAddresses` and Chrome's own autofill engine is asked to fill the
 * form with `Autofill.trigger`. The page's fields are therefore filled by the browser (setting
 * `:-webkit-autofill`), not by test JavaScript. Nothing here touches a personal browser profile or
 * real credentials, and the data is obviously fake.
 *
 * Limit: the fill is initiated through the DevTools protocol, not by a person choosing a suggestion
 * from the autofill popup, and it only covers Chrome. Firefox and Safari/WebKit expose no automation
 * hook for this; see the procedure document.
 *
 * Usage: node scripts/consumer/autofill-real-browser.mjs --url http://localhost:<port> [--out file.json]
 *        (serve the consumer first: pnpm review:manual, or run.mjs --stage serve)
 */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const opt = (name) =>
  args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : undefined;
const base = (opt('url') ?? '').replace(/\/$/, '');
if (!base) {
  console.error('✗ --url is required (the served consumer app, e.g. http://localhost:4690)');
  process.exit(2);
}

const ADDRESS = [
  { name: 'NAME_FULL', value: 'Ada Example' },
  { name: 'EMAIL_ADDRESS', value: 'ada@example.test' },
  { name: 'PHONE_HOME_WHOLE_NUMBER', value: '+15555550100' },
  { name: 'ADDRESS_HOME_LINE1', value: '1 Test Street' },
  { name: 'ADDRESS_HOME_ZIP', value: '00000' },
  { name: 'ADDRESS_HOME_COUNTRY', value: 'US' },
];
const FIELDS = ['name', 'email', 'tel', 'street', 'postal'];

let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: false });
} catch (error) {
  console.error(
    `✗ real Google Chrome is required (channel "chrome"): ${error.message.split('\n')[0]}`,
  );
  process.exit(3);
}
const evidence = { engine: 'chrome', version: browser.version(), url: base, checks: {} };
const check = (name, ok, detail) => {
  evidence.checks[name] = { ok, ...(detail === undefined ? {} : { detail }) };
  console.log(
    `${ok ? '✓' : '✗'} ${name}${detail === undefined ? '' : ` — ${JSON.stringify(detail)}`}`,
  );
  return ok;
};

try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const missing = [];
  page.on('response', (r) => r.status() >= 400 && missing.push(`${r.status()} ${r.url()}`));
  page.on(
    'console',
    (m) => m.type() === 'error' && !/status of 404/.test(m.text()) && errors.push(m.text()),
  );
  const cdp = await context.newCDPSession(page);
  await cdp.send('Autofill.enable');
  await cdp.send('Autofill.setAddresses', { addresses: [{ fields: ADDRESS }] });

  const open = async () => {
    await page.goto(`${base}/autofill`);
    await page.waitForFunction(() =>
      document.querySelector('app-root')?.hasAttribute('ng-version'),
    );
    await page.waitForLoadState('networkidle');
  };
  const field = (n) => page.getByTestId(`lab-${n}`);
  const state = () =>
    page.evaluate(
      (fields) => ({
        count: Number(document.querySelector('[data-testid=lab-count]').textContent),
        log: [...document.querySelectorAll('[data-testid=lab-log] li')].map((li) =>
          li.textContent.trim(),
        ),
        form: JSON.parse(document.querySelector('[data-testid=lab-form-value]').textContent),
        live: Number(document.querySelector('[data-testid=lab-live]').textContent),
        marked: fields.filter((n) =>
          document.querySelector(`[data-testid=lab-${n}]`)?.hasAttribute('data-autofilled'),
        ),
        values: Object.fromEntries(
          fields.map((n) => [n, document.querySelector(`[data-testid=lab-${n}]`)?.value]),
        ),
      }),
      FIELDS,
    );
  const trigger = async (name) => {
    await field(name).focus();
    const { root } = await cdp.send('DOM.getDocument');
    const { nodeId } = await cdp.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector: `[data-testid=lab-${name}]`,
    });
    const { node } = await cdp.send('DOM.describeNode', { nodeId });
    const { frameTree } = await cdp.send('Page.getFrameTree');
    await cdp.send('Autofill.trigger', {
      fieldId: node.backendNodeId,
      frameId: frameTree.frame.id,
      address: { fields: ADDRESS },
    });
  };

  await open();
  const before = await state();
  check(
    '1 precondition: empty form, no autofill state',
    before.count === 0 && before.marked.length === 0,
  );

  await trigger('name');
  await page.waitForFunction(
    () => document.querySelector('[data-testid=lab-count]').textContent !== '0',
  );
  await page.waitForTimeout(1500); // allow any duplicate emission to appear
  const filled = await state();
  check(
    '1 the browser filled the fields',
    FIELDS.every(
      (n) =>
        filled.values[n] ===
        {
          name: 'Ada Example',
          email: 'ada@example.test',
          tel: '+15555550100',
          street: '1 Test Street',
          postal: '00000',
        }[n],
    ),
    filled.values,
  );
  check(
    '2+3 Quartz detected it: data-autofilled on every filled field',
    filled.marked.length === FIELDS.length,
    filled.marked,
  );
  check(
    '4 autofilledChange emitted exactly once per field (true)',
    filled.count === FIELDS.length && filled.log.every((l) => l.endsWith('→ true')),
    filled.log,
  );
  check(
    '5 Angular Forms received the browser-written values',
    FIELDS.every((n) => filled.form[n] === filled.values[n]),
    filled.form,
  );
  check('6 no live region was introduced by the directive', filled.live === 0, filled.live);

  // Re-filling the same values must not produce more emissions (already in the autofilled state).
  await trigger('name');
  await page.waitForTimeout(1500);
  const again = await state();
  check(
    '6 re-triggering the same autofill emits no duplicate',
    again.count === filled.count,
    again.count,
  );

  // Reset: the form model is cleared programmatically.
  await page.getByTestId('lab-reset').click();
  await page.waitForTimeout(1500);
  const reset = await state();
  check(
    '7 reset clears the Forms values and DOM values',
    FIELDS.every((n) => reset.form[n] === '' && reset.values[n] === ''),
    reset.values,
  );
  evidence.afterReset = { marked: reset.marked, count: reset.count, log: reset.log };
  console.log(
    '  after reset: data-autofilled on',
    JSON.stringify(reset.marked),
    '| emissions',
    reset.count,
  );

  // User clears one field by typing.
  await trigger('name');
  await page.waitForTimeout(1500);
  await field('email').fill('');
  await page.waitForTimeout(1500);
  const cleared = await state();
  evidence.afterUserClear = { marked: cleared.marked, count: cleared.count };
  console.log(
    '  after user clearing "email": data-autofilled on',
    JSON.stringify(cleared.marked),
    '| emissions',
    cleared.count,
  );

  // Destroy and recreate the fields while autofilled.
  await page.getByTestId('lab-toggle').click();
  await field('name').waitFor({ state: 'detached' });
  await page.getByTestId('lab-toggle').click();
  await field('name').waitFor();
  const recreated = await state();
  check('8 destroy/recreate starts clean', recreated.marked.length === 0, recreated.marked);

  // Route navigation away and back.
  await page.getByRole('link', { name: 'Navigate to another route' }).click();
  await page.waitForURL('**/forms');
  await page.goBack();
  await field('name').waitFor();
  const back = await state();
  check(
    '8 navigating away and back starts clean',
    back.marked.length === 0 && back.count === 0,
    back,
  );
  // The consumer fixture ships no favicon; any OTHER failed request is a real problem.
  const unexpected = missing.filter((m) => !m.endsWith('/favicon.ico'));
  check(
    'no console or page errors, no failed requests',
    errors.length === 0 && unexpected.length === 0,
    { errors, unexpected },
  );
  evidence.ok = Object.values(evidence.checks).every((c) => c.ok);
} finally {
  await browser?.close();
}
evidence.recordedAt = new Date().toISOString();
if (opt('out')) writeFileSync(opt('out'), JSON.stringify(evidence, null, 2) + '\n');
console.log(evidence.ok ? '\n✓ genuine Chrome autofill verified' : '\n✗ some checks failed');
process.exit(evidence.ok ? 0 : 1);
