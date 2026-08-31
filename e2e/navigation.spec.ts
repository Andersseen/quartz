import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to overlay page', async ({ page }) => {
    await page.goto('/overlay');
    await expect(page.getByRole('heading', { name: 'Overlay', level: 1 })).toBeVisible();
    await expect(page.locator('text=Portal-based positioning system')).toBeVisible();
  });

  test('should navigate to directionality page', async ({ page }) => {
    await page.goto('/directionality');
    await expect(page.getByRole('heading', { name: 'Directionality', level: 1 })).toBeVisible();
    await expect(page.locator('text=Resolves LTR/RTL once')).toBeVisible();
  });

  test('should navigate to dialog page', async ({ page }) => {
    await page.goto('/dialog');
    await expect(page.getByRole('heading', { name: 'Dialog & Drawer', level: 1 })).toBeVisible();
    await expect(page.locator('text=Open Modal')).toBeVisible();
  });

  test('should navigate to tooltip page', async ({ page }) => {
    await page.goto('/tooltip');
    await expect(page.getByRole('heading', { name: 'Tooltip', level: 1 })).toBeVisible();
    await expect(page.locator('text=hover/focus tooltip')).toBeVisible();
  });

  test('should navigate to splitter page', async ({ page }) => {
    await page.goto('/splitter');
    await expect(page.getByRole('heading', { name: 'Splitter', level: 1 })).toBeVisible();
    await expect(page.locator('text=Resizable panel system')).toBeVisible();
  });

  test('should navigate to toast page', async ({ page }) => {
    await page.goto('/toast');
    await expect(page.getByRole('heading', { name: 'Toast', level: 1 })).toBeVisible();
    await expect(page.locator('text=Notification system')).toBeVisible();
  });

  test('should navigate to drag-drop page', async ({ page }) => {
    await page.goto('/drag-drop');
    await expect(page.getByRole('heading', { name: 'Drag & Drop', level: 1 })).toBeVisible();
  });

  test('should navigate to listbox page and select with the keyboard', async ({ page }) => {
    await page.goto('/listbox');
    await expect(page.getByRole('heading', { name: 'Listbox', level: 1 })).toBeVisible();
    const listbox = page.getByRole('listbox').first();
    await listbox.press('ArrowDown');
    await listbox.press('ArrowDown');
    await listbox.press('Enter');
    await expect(page.locator('text=Selected:').first()).toContainText('enterprise');
  });

  test('should navigate to menu page', async ({ page }) => {
    await page.goto('/menu');
    await expect(page.getByRole('heading', { name: 'Menu', level: 1 })).toBeVisible();
    await expect(page.getByText('Nested', { exact: true })).toBeVisible();
  });

  test('should navigate to popover page', async ({ page }) => {
    await page.goto('/popover');
    await expect(page.getByRole('heading', { name: 'Popover', level: 1 })).toBeVisible();
    await expect(page.getByText('Non Modal', { exact: true })).toBeVisible();
  });

  test('should navigate to 0.2.0 pages', async ({ page }) => {
    for (const [path, title] of [
      ['/scroll-lock', 'Scroll Lock'],
      ['/select', 'Select'],
      ['/tabs', 'Tabs'],
      ['/accordion', 'Accordion'],
      ['/switch', 'Switch'],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
    }
  });

  test('should redirect /components to /overlay', async ({ page }) => {
    await page.goto('/components');
    await expect(page).toHaveURL(/\/overlay/);
  });

  test('should have sidebar navigation on component pages', async ({ page }) => {
    await page.goto('/overlay');
    await expect(page.locator('text=Overlay').first()).toBeVisible();
    await expect(page.locator('text=Dialog').first()).toBeVisible();
    await expect(page.locator('text=Tooltip').first()).toBeVisible();
    await expect(page.locator('text=Splitter').first()).toBeVisible();
    await expect(page.locator('text=Menu').first()).toBeVisible();
    await expect(page.locator('text=Popover').first()).toBeVisible();
    await expect(page.locator('text=Select').first()).toBeVisible();
    await expect(page.locator('text=Tabs').first()).toBeVisible();
    await expect(page.locator('text=Accordion').first()).toBeVisible();
    await expect(page.locator('text=Switch').first()).toBeVisible();
  });
});
