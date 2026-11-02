import { expect, test } from './support/test';
import { expectRoute, gotoReady, waitForDemos, waitForHydration } from './support/readiness';

/**
 * Regression coverage for the 0.21 readiness contract (see support/readiness.ts). These tests
 * prove the contract itself, so a flaky suite cannot be blamed on "the network was not idle".
 */

const FIXTURES = [
  '/e2e-navigation',
  '/e2e-forms',
  '/e2e-floating',
  '/e2e-selection',
  '/e2e-range',
  '/e2e-layers',
  '/e2e-feedback',
];

test.describe('prerendered HTML is never reported as ready', () => {
  for (const route of FIXTURES) {
    test(`${route} ships no readiness marker before the client takes over`, async ({ request }) => {
      const html = await (await request.get(route)).text();
      // A marker present in the static HTML would let a test interact with an inert page; fixtures
      // must set it from the browser only (regression: e2e-navigation used a static `data-ready`).
      expect(html).not.toMatch(/\sdata-ready(\s|=|>)/);
    });
  }

  test('docs pages ship server hydration annotations that the client consumes', async ({
    request,
    page,
  }) => {
    const html = await (await request.get('/docs/primitives/select')).text();
    expect(html.match(/\sngh="/g)?.length ?? 0).toBeGreaterThan(0);
    await gotoReady(page, '/docs/primitives/select');
    await expect(page.locator('[ngh]')).toHaveCount(0);
  });
});

test.describe('readiness holds under rapid navigation', () => {
  const ROUTES: [string, string | RegExp][] = [
    ['/', /./],
    ['/components', /./],
    ['/docs', 'Quartz Headless documentation'],
    ['/docs/primitives/select', 'Select'],
    ['/docs/primitives/dialog', 'Dialog & Drawer'],
    ['/docs/primitives/slider', 'Slider'],
    ['/docs/core/overlay', /Overlay/],
    ['/docs/primitives/form-field', /./],
  ];

  test('back-to-back full navigations are each ready, error-free and hydrated', async ({
    page,
    diagnostics,
  }) => {
    test.slow();
    // Three laps over the route set, with no pause between a ready page and the next navigation.
    for (let lap = 0; lap < 3; lap++) {
      for (const [route, heading] of ROUTES) {
        await gotoReady(page, route, { heading });
      }
    }
    await waitForDemos(page);
    // Navigating away cancels in-flight lazy demo chunks (NS_BINDING_ABORTED / ERR_ABORTED): that is
    // expected and must stay silent (no console/page errors — the 0.19 NG0750 regression). Anything
    // else — a refused/reset connection or an HTTP error — is a real failure.
    expect(diagnostics.problems()).toEqual([]);
    expect(diagnostics.badResponses).toEqual([]);
    expect(
      diagnostics.failedRequests.filter((request) => !/ABORTED|cancel/i.test(request.failure)),
    ).toEqual([]);
  });

  test('client-side navigation right after hydration lands on the clicked route', async ({
    page,
    diagnostics,
  }) => {
    await gotoReady(page, '/docs/primitives/select');
    const nav = page.getByRole('navigation', { name: 'Quartz Headless docs' });
    for (const [name, path] of [
      ['Dialog & Drawer', '/docs/primitives/dialog'],
      ['Select', '/docs/primitives/select'],
      ['Dialog & Drawer', '/docs/primitives/dialog'],
    ] as const) {
      await nav.getByRole('link', { name }).click();
      await expectRoute(page, path, name);
      await waitForHydration(page);
    }
    expect(diagnostics.problems()).toEqual([]);
  });
});

test.describe('Toolbar interaction waits for a live app', () => {
  test('with a slow application boot, readiness appears only after hydration and keyboard roving then works', async ({
    page,
  }) => {
    // Delay every script so the prerendered (inert) page is observable for a while: this is the
    // window in which the old static `data-ready` let tests focus and press keys on dead markup.
    await page.route(/\/assets\/.*\.js(\?.*)?$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await route.continue();
    });
    await page.goto('/e2e-navigation', { waitUntil: 'commit' });
    await expect(page.locator('#toolbar-one')).toBeAttached(); // prerendered markup is there…
    await expect(page.locator('#app[data-ready]')).toHaveCount(0); // …but not ready.

    await expect(page.locator('#app[data-ready]')).toBeAttached(); // ready only once live
    await page.locator('#toolbar-one').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#toolbar-three')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(page.locator('#toolbar-one')).toBeFocused();
  });
});

test.describe('preview server', () => {
  test('a malformed URL gets a 400 and does not take the server down', async ({ request }) => {
    const bad = await request.get('/%E0%A4%A');
    expect(bad.status()).toBe(400);
    expect((await request.get('/')).status()).toBe(200);
  });

  test('keeps real 404 and redirect semantics (no SPA fallback)', async ({ request }) => {
    expect((await request.get('/docs/does-not-exist')).status()).toBe(404);
    const redirect = await request.get('/toggle-group', { maxRedirects: 0 });
    expect([301, 302]).toContain(redirect.status());
    expect(redirect.headers()['location']).toMatch(/^\/docs\//);
  });
});
