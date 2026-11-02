import { expect, type Page } from '@playwright/test';

/**
 * Readiness contract for the docs-site E2E suites.
 *
 * `networkidle` is not a readiness signal for this application: it only means "no request for
 * 500 ms", which says nothing about Angular (a quiet network is reached before, after or without
 * hydration, and an engine that is busy never reaches it at all). A route is READY when:
 *
 *  1. the document is served by the Angular app (`app-root[ng-version]`) and the URL is the one
 *     requested (no unexpected redirect);
 *  2. hydration has claimed the server-rendered markup: Angular removes each component host's
 *     `ngh` attribute when the client takes the host over, so none must be left (the raw
 *     prerendered HTML always carries them, which `readiness.spec.ts` proves);
 *  3. the route rendered its expected content (heading), and for routes with lazy demos each
 *     `@defer` slot shows either the demo or its explicit error fallback.
 *
 * Nothing here sleeps or widens a timeout; every wait is a web-first condition that retries until
 * the (unchanged) expect timeout.
 */

export interface ReadyOptions {
  /** Accessible name (string = exact, RegExp = pattern) of the expected level-1 heading. */
  heading?: string | RegExp;
  /** Expected final pathname; defaults to the requested one (redirects must be asserted). */
  path?: string | RegExp;
}

/** Resolves once Angular has claimed every server-rendered component host on the current page. */
export async function waitForHydration(page: Page): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(() => ({
          bootstrapped: document.querySelector('app-root[ng-version]') !== null,
          pending: document.querySelectorAll('[ngh]').length,
        })),
      { message: 'Angular did not hydrate the page (app-root missing or [ngh] hosts left)' },
    )
    .toEqual({ bootstrapped: true, pending: 0 });
}

/** Every `@defer` demo slot on the page is settled: rendered, or showing its error fallback. */
export async function waitForDemos(page: Page): Promise<void> {
  await expect(page.locator('.qz-demo-placeholder[aria-busy="true"]')).toHaveCount(0);
}

/** Navigate and wait for the readiness contract above. */
export async function gotoReady(
  page: Page,
  url: string,
  options: ReadyOptions = {},
): Promise<void> {
  // `domcontentloaded`: the readiness conditions below are the contract, not the load event.
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  expect(response?.status(), `HTTP status for ${url}`).toBeLessThan(400);
  const expected = options.path ?? new URL(url, 'http://localhost').pathname;
  await expect
    .poll(() => new URL(page.url()).pathname)
    .toMatch(typeof expected === 'string' ? new RegExp(`^${escapeRegExp(expected)}$`) : expected);
  await waitForHydration(page);
  if (options.heading !== undefined) {
    await expect(
      page.getByRole('heading', { level: 1, name: options.heading }).first(),
    ).toBeVisible();
  } else {
    await expect(page.locator('h1').first()).toBeVisible();
  }
}

/** Wait for the hydration of an in-page (client-side) navigation that ended on `path`. */
export async function expectRoute(
  page: Page,
  path: string | RegExp,
  heading?: string | RegExp,
): Promise<void> {
  await expect(page).toHaveURL(
    typeof path === 'string' ? new RegExp(`${escapeRegExp(path)}/?$`) : path,
  );
  if (heading !== undefined) {
    await expect(page.getByRole('heading', { level: 1, name: heading }).first()).toBeVisible();
  }
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
