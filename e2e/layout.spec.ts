import { test, expect } from '@playwright/test';

test.describe('Layout', () => {
  test('should show sidebar toggle on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/overlay');
    const menuButton = page.locator('button[aria-label="Toggle navigation"]').first();
    await expect(menuButton).toBeVisible();
  });

  test('should toggle sidebar on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/overlay');
    const menuButton = page.locator('button[aria-label="Toggle navigation"]').first();
    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('complementary')).toBeVisible();
  });

  test('should keep the component sidebar sticky while scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/overlay');

    await page.evaluate(() => window.scrollTo(0, 1200));
    await expect
      .poll(() =>
        page.locator('app-sidebar').evaluate((element) => element.getBoundingClientRect().top),
      )
      .toBe(0);
  });

  test('should have working header on all pages', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Quartz Headless' })).toBeVisible();
    await page.goto('/docs');
    await expect(page.getByRole('link', { name: 'Quartz Headless' })).toBeVisible();
  });
});
