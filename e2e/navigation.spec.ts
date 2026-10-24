import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to overlay page', async ({ page }) => {
    await page.goto('/docs/core/overlay');
    await expect(page.getByRole('heading', { name: 'Overlay', level: 1 })).toBeVisible();
    await expect(page.locator('text=Portal-based positioning system')).toBeVisible();
  });

  test('should navigate to directionality page', async ({ page }) => {
    await page.goto('/docs/core/directionality');
    await expect(page.getByRole('heading', { name: 'Directionality', level: 1 })).toBeVisible();
    await expect(page.locator('text=Resolves LTR/RTL once')).toBeVisible();
  });

  test('should navigate to dialog page', async ({ page }) => {
    await page.goto('/docs/primitives/dialog');
    await expect(page.getByRole('heading', { name: 'Dialog & Drawer', level: 1 })).toBeVisible();
    await expect(page.locator('text=Open Modal')).toBeVisible();
  });

  test('should navigate to tooltip page', async ({ page }) => {
    await page.goto('/docs/primitives/tooltip');
    await expect(page.getByRole('heading', { name: 'Tooltip', level: 1 })).toBeVisible();
    await expect(page.locator('text=hover/focus tooltip')).toBeVisible();
  });

  test('should navigate to splitter page', async ({ page }) => {
    await page.goto('/docs/core/splitter');
    await expect(page.getByRole('heading', { name: 'Splitter', level: 1 })).toBeVisible();
    await expect(page.locator('text=Resizable panel system')).toBeVisible();
  });

  test('should navigate to toast page', async ({ page }) => {
    await page.goto('/docs/primitives/toast');
    await expect(page.getByRole('heading', { name: 'Toast', level: 1 })).toBeVisible();
    await expect(page.locator('text=Notification system')).toBeVisible();
  });

  test('should navigate to drag-drop page', async ({ page }) => {
    await page.goto('/docs/core/drag-drop');
    await expect(page.getByRole('heading', { name: 'Drag & Drop', level: 1 })).toBeVisible();
  });

  test('should navigate to listbox page and select with the keyboard', async ({ page }) => {
    await page.goto('/docs/primitives/listbox');
    await expect(page.getByRole('heading', { name: 'Listbox', level: 1 })).toBeVisible();
    const listbox = page.locator('[data-doq-demo="listbox"]').getByRole('listbox').first();
    await listbox.press('ArrowDown');
    await listbox.press('ArrowDown');
    await listbox.press('Enter');
    await expect(
      page.locator('[data-doq-demo="listbox"]').locator('text=Selected:').first(),
    ).toContainText('enterprise');
  });

  test('should navigate to menu page', async ({ page }) => {
    await page.goto('/docs/primitives/menu');
    await expect(page.getByRole('heading', { name: 'Menu', level: 1 })).toBeVisible();
    await expect(page.getByText('Nested', { exact: true })).toBeVisible();
  });

  test('should navigate to popover page', async ({ page }) => {
    await page.goto('/docs/primitives/popover');
    await expect(page.getByRole('heading', { name: 'Popover', level: 1 })).toBeVisible();
    await expect(page.getByText('Non Modal', { exact: true })).toBeVisible();
  });

  test('should navigate to 0.2.0 pages', async ({ page }) => {
    for (const [path, title] of [
      ['/docs/core/scroll-lock', 'Scroll Lock'],
      ['/docs/primitives/select', 'Select'],
      ['/docs/primitives/tabs', 'Tabs'],
      ['/docs/primitives/accordion', 'Accordion'],
      ['/docs/primitives/switch', 'Switch'],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
    }
  });

  test('should navigate to 0.3.0 control pages', async ({ page }) => {
    for (const [path, title] of [
      ['/docs/primitives/checkbox', 'Checkbox'],
      ['/docs/primitives/radio-group', 'RadioGroup'],
      ['/docs/primitives/toggle', 'Toggle'],
      ['/docs/primitives/toggle-group', 'ToggleGroup'],
      ['/docs/primitives/slider', 'Slider'],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
    }
  });

  test('should navigate to 0.4.0 navigation and layout pages', async ({ page }) => {
    for (const [path, title] of [
      ['/docs/primitives/sidebar', 'Sidebar'],
      ['/docs/primitives/navbar', 'Navbar'],
      ['/docs/primitives/stepper', 'Stepper'],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
    }
  });

  test('should render the components catalogue', async ({ page }) => {
    await page.goto('/components');
    await expect(
      page.getByRole('heading', { name: 'Two packages. Everything Quartz ships.' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /Accordion/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Slider/ })).toBeVisible();
  });

  test('should have sidebar navigation on component pages', async ({ page }) => {
    await page.goto('/docs/primitives/select');
    await page.waitForLoadState('networkidle');
    const nav = page.getByRole('navigation', { name: 'Quartz Headless docs' });
    for (const name of [
      'Dialog & Drawer',
      'Tooltip',
      'Menu',
      'Popover',
      'Select',
      'Listbox',
      'Combobox',
      'Sidebar',
      'Navbar',
      'Stepper',
      'Tabs',
      'Accordion',
      'Switch',
      'Checkbox',
      'RadioGroup',
      'ToggleGroup',
      'Slider',
    ]) {
      await expect(nav.getByRole('link', { name, exact: true })).toBeAttached();
    }
    await page.goto('/docs/core/overlay');
    await page.waitForLoadState('networkidle');
    for (const name of [
      'Overlay',
      'Splitter',
      'Directionality',
      'Collection',
      'Focus',
      'Dismiss',
    ]) {
      await expect(nav.getByRole('link', { name, exact: true })).toBeAttached();
    }
  });

  test("should keep the reader's place in the docs sidebar while navigating between pages", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 700 });
    await page.goto('/docs/primitives/dialog');
    await page.waitForLoadState('networkidle');

    const nav = page.getByRole('navigation', { name: 'Quartz Headless docs' });
    const slider = nav.getByRole('link', { name: 'Slider', exact: true });
    await slider.scrollIntoViewIfNeeded();
    const scrollTop = () =>
      page.evaluate(() => document.querySelector('nav.doq-sidebar')?.scrollTop ?? -1);
    await expect.poll(scrollTop).toBeGreaterThan(0);
    const before = await scrollTop();

    await slider.click();
    await expect(page).toHaveURL('/docs/primitives/slider');
    await expect(page.getByRole('heading', { name: 'Slider', level: 1 })).toBeVisible();
    await expect.poll(async () => Math.abs((await scrollTop()) - before)).toBeLessThanOrEqual(2);
  });
});
