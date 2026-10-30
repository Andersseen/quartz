import { expect, test } from '@playwright/test';
import { boot, expectHealthy, replacedNodes } from './helpers';

const routes = ['/forms', '/overlays', '/navigation', '/parity'];
const idsOf = (html: string) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);

for (const route of routes) {
  test.describe(`hydration ${route}`, () => {
    test('hydrates the server DOM without errors, replacement or id drift', async ({
      page,
      request,
    }) => {
      const serverIds = idsOf(await (await request.get(route)).text());
      const health = await boot(page, route);
      expect(await replacedNodes(page), 'server nodes replaced by hydration').toEqual([]);
      await expectHealthy(page, health);
      const clientIds = await page.evaluate(() =>
        Array.from(document.querySelectorAll('[id]')).map((e) => e.id),
      );
      // Every id the server rendered must still exist after hydration (stable server/client ids).
      expect(serverIds.filter((id) => !clientIds.includes(id))).toEqual([]);
    });

    test('hydrates with a mobile viewport (responsive controls settle)', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 800 });
      const health = await boot(page, route);
      expect(await replacedNodes(page)).toEqual([]);
      await expectHealthy(page, health);
    });
  });
}

test('client navigation between hydrated routes keeps the app healthy', async ({ page }) => {
  const health = await boot(page, '/forms');
  await page.getByRole('link', { name: 'Overlays' }).click();
  await expect(page.getByRole('heading', { name: 'Overlays' })).toBeVisible();
  await page.getByRole('link', { name: 'Navigation' }).click();
  await expect(page.getByRole('heading', { name: 'Navigation' })).toBeVisible();
  await page.getByRole('link', { name: 'Forms', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Forms' })).toBeVisible();
  await expectHealthy(page, health);
});
