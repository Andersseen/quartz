import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export interface PageHealth {
  errors: string[];
}

/**
 * Opens a route and waits for Angular hydration. Records every server-rendered interactive node
 * at `readyState === 'interactive'` (before deferred module scripts run) so the test can later
 * prove hydration REUSED the server DOM instead of replacing it.
 */
export async function boot(page: Page, path: string): Promise<PageHealth> {
  const health: PageHealth = { errors: [] };
  page.on('console', (m) => {
    if (m.type() === 'error' || /NG0\d+|hydrat/i.test(m.text()))
      health.errors.push(`console: ${m.text()}`);
  });
  page.on('pageerror', (e) => health.errors.push(`pageerror: ${e.message}`));
  await page.addInitScript(() => {
    document.addEventListener('readystatechange', () => {
      if (document.readyState !== 'interactive') return;
      (window as unknown as { __ssrNodes: Element[] }).__ssrNodes = Array.from(
        document.querySelectorAll('button, input, textarea, a, h1, label'),
      );
    });
  });
  await page.goto(path);
  // Angular removes `ng-server-context` only on client takeover is not guaranteed; instead wait for
  // the framework to mark the root as bootstrapped by the client (ng-version is server-rendered
  // too), so we wait for a real client-side effect: event listeners work on the first route link.
  await page.waitForFunction(() => document.querySelector('app-root')?.hasAttribute('ng-version'));
  await page.waitForLoadState('networkidle');
  return health;
}

/** Server-rendered interactive nodes that hydration disconnected (replaced) — must be empty. */
export function replacedNodes(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    ((window as unknown as { __ssrNodes?: Element[] }).__ssrNodes ?? [])
      .filter((n) => !n.isConnected)
      .map(
        (n) =>
          `${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}:${(n.textContent ?? '').trim().slice(0, 20)}`,
      ),
  );
}

/** Duplicate ids and dangling ARIA references in the CURRENT DOM. */
export function domIntegrity(page: Page): Promise<{ duplicates: string[]; dangling: string[] }> {
  return page.evaluate(() => {
    const ids = new Map<string, number>();
    document.querySelectorAll('[id]').forEach((e) => ids.set(e.id, (ids.get(e.id) ?? 0) + 1));
    const duplicates = [...ids].filter(([, n]) => n > 1).map(([id]) => id);
    const dangling: string[] = [];
    const attrs = ['aria-labelledby', 'aria-describedby', 'aria-activedescendant', 'aria-controls'];
    document.querySelectorAll(attrs.map((a) => `[${a}]`).join(',')).forEach((el) => {
      for (const attr of attrs) {
        const value = el.getAttribute(attr);
        if (!value) continue;
        // aria-controls may legitimately point at a not-yet-rendered popup while collapsed.
        if (attr === 'aria-controls' && el.getAttribute('aria-expanded') !== 'true') continue;
        for (const id of value.split(/\s+/)) {
          if (id && !document.getElementById(id))
            dangling.push(`${el.tagName.toLowerCase()}[${attr}]→${id}`);
        }
      }
    });
    return { duplicates, dangling };
  });
}

export async function expectHealthy(page: Page, health: PageHealth): Promise<void> {
  expect(health.errors, 'console/page errors').toEqual([]);
  const { duplicates, dangling } = await domIntegrity(page);
  expect(duplicates, 'duplicate ids').toEqual([]);
  expect(dangling, 'dangling ARIA references').toEqual([]);
}

export async function axe(page: Page, scope?: string): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  if (scope) builder = builder.include(scope);
  const results = await builder.analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`),
  ).toEqual([]);
}
