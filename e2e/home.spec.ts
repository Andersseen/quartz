import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display Quartz Headless branding', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Quartz Headless' })).toBeVisible();
    await expect(
      page.getByText('Behaviour for the interfaces you own.', { exact: true }),
    ).toBeVisible();
  });

  test('should display hero section with CTA buttons', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Start building/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse primitives' })).toBeVisible();
  });

  test('should keep the home layout within a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.getByRole('link', { name: /Start building/ })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
  });

  test('should display features section', async ({ page }) => {
    await expect(page.getByText('Headless by default', { exact: true })).toBeVisible();
    await expect(page.getByText('Accessible behaviour', { exact: true })).toBeVisible();
    await expect(page.getByText('Composes cleanly', { exact: true })).toBeVisible();
  });

  test('should have correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Quartz Headless/);
  });

  test('should navigate to docs page', async ({ page }) => {
    await page.click('text=Docs');
    await expect(page).toHaveURL(/\/docs/);
  });
});
