import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display Quartz UI branding', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Quartz Headless' })).toBeVisible();
    await expect(
      page.locator('text=A collection of unstyled, accessible, and composable Angular components'),
    ).toBeVisible();
  });

  test('should display hero section with CTA buttons', async ({ page }) => {
    await expect(page.locator('text=Build with Precision')).toBeVisible();
    await expect(page.locator('text=Get Started')).toBeVisible();
    await expect(page.locator('text=Explore Components')).toBeVisible();
  });

  test('should display features section', async ({ page }) => {
    await expect(page.getByText('Headless', { exact: true })).toBeVisible();
    await expect(page.getByText('Accessible', { exact: true })).toBeVisible();
    await expect(page.getByText('Themable', { exact: true })).toBeVisible();
  });

  test('should have correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Quartz Headless/);
  });

  test('should navigate to docs page', async ({ page }) => {
    await page.click('text=Docs');
    await expect(page).toHaveURL(/\/docs/);
  });
});
