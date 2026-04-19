import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display Quartz UI branding', async ({ page }) => {
    await expect(page.locator('text=Quartz UI')).toBeVisible();
    await expect(page.locator('text=Headless Components')).toBeVisible();
  });

  test('should display hero section with CTA buttons', async ({ page }) => {
    await expect(page.locator('text=Build with Precision')).toBeVisible();
    await expect(page.locator('text=Get Started')).toBeVisible();
    await expect(page.locator('text=Explore Components')).toBeVisible();
  });

  test('should display features section', async ({ page }) => {
    await expect(page.locator('text=Headless')).toBeVisible();
    await expect(page.locator('text=Accessible')).toBeVisible();
    await expect(page.locator('text=Themable')).toBeVisible();
  });

  test('should have correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Quartz UI/);
  });

  test('should navigate to docs page', async ({ page }) => {
    await page.click('text=Docs');
    await expect(page).toHaveURL(/\/docs/);
  });
});
