import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to overlay page', async ({ page }) => {
    await page.goto('/overlay');
    await expect(page.locator('text=Overlay')).toBeVisible();
    await expect(page.locator('text=Portal-based positioning system')).toBeVisible();
  });

  test('should navigate to dialog page', async ({ page }) => {
    await page.goto('/dialog');
    await expect(page.locator('text=Dialog')).toBeVisible();
    await expect(page.locator('text=Modal')).toBeVisible();
  });

  test('should navigate to splitter page', async ({ page }) => {
    await page.goto('/splitter');
    await expect(page.locator('text=Splitter')).toBeVisible();
    await expect(page.locator('text=Resizeable panel layouts')).toBeVisible();
  });

  test('should navigate to toast page', async ({ page }) => {
    await page.goto('/toast');
    await expect(page.locator('text=Toast')).toBeVisible();
    await expect(page.locator('text=Non-blocking notifications')).toBeVisible();
  });

  test('should navigate to drag-drop page', async ({ page }) => {
    await page.goto('/drag-drop');
    await expect(page.locator('text=Drag & Drop')).toBeVisible();
  });

  test('should redirect /components to /overlay', async ({ page }) => {
    await page.goto('/components');
    await expect(page).toHaveURL(/\/overlay/);
  });

  test('should have sidebar navigation on component pages', async ({ page }) => {
    await page.goto('/overlay');
    await expect(page.locator('text=Overlay').first()).toBeVisible();
    await expect(page.locator('text=Dialog').first()).toBeVisible();
    await expect(page.locator('text=Splitter').first()).toBeVisible();
  });
});
