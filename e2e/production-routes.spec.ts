import { expect, test } from '@playwright/test';

/**
 * Regression for the 0.16 intermittent "JIT compiler unavailable" failure.
 *
 * Root cause: `@analogjs/vite-plugin-nitro` builds the client and SSR environments in parallel and
 * both share one `@analogjs/vite-plugin-angular` instance whose AOT output map is cleared by the
 * first environment's `buildEnd`; lazily transformed modules (the home page, the components
 * catalogue) then shipped as raw decorators. `vite.config.ts` now serialises the environment builds,
 * and `scripts/check-docs-output.mjs` fails the build if any shipped chunk still contains an
 * un-compiled `app-*` component. These browser checks prove the shipped routes really boot.
 */
const routes = ['/', '/components', '/e2e-forms', '/e2e-navigation', '/docs/primitives/dialog'];

for (const route of routes) {
  test(`production route ${route} boots without runtime compilation errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error' || /JIT|NG0\d+/.test(m.text())) errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(route);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible();
    expect(errors, `console errors on ${route}`).toEqual([]);
  });
}

test('client-side navigation activates lazily loaded route components', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('link', { name: 'Browse primitives' }).click();
  await expect(page).toHaveURL(/\/components$/);
  await expect(page.locator('h1').first()).toBeVisible();
  expect(errors).toEqual([]);
});
