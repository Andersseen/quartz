import { test, expect } from '@playwright/test';

test.describe('Components Pages', () => {
  const components = [
    { path: '/docs/core/overlay', title: 'Overlay' },
    { path: '/docs/core/directionality', title: 'Directionality' },
    { path: '/docs/primitives/dialog', title: 'Dialog & Drawer' },
    { path: '/docs/primitives/tooltip', title: 'Tooltip' },
    { path: '/docs/core/splitter', title: 'Splitter' },
    { path: '/docs/primitives/toast', title: 'Toast' },
    { path: '/docs/core/drag-drop', title: 'Drag & Drop' },
    { path: '/docs/primitives/listbox', title: 'Listbox' },
    { path: '/docs/primitives/menu', title: 'Menu' },
    { path: '/docs/primitives/popover', title: 'Popover' },
    { path: '/docs/primitives/combobox', title: 'Combobox' },
    { path: '/docs/core/scroll-lock', title: 'Scroll Lock' },
    { path: '/docs/primitives/select', title: 'Select' },
    { path: '/docs/primitives/tabs', title: 'Tabs' },
    { path: '/docs/primitives/accordion', title: 'Accordion' },
    { path: '/docs/primitives/switch', title: 'Switch' },
    { path: '/docs/primitives/checkbox', title: 'Checkbox' },
    { path: '/docs/primitives/radio-group', title: 'RadioGroup' },
    { path: '/docs/primitives/toggle', title: 'Toggle' },
    { path: '/docs/primitives/toggle-group', title: 'ToggleGroup' },
    { path: '/docs/primitives/slider', title: 'Slider' },
  ];

  for (const component of components) {
    test(`should render ${component.title} page`, async ({ page }) => {
      await page.goto(component.path);
      await expect(page).toHaveURL(component.path);
      await expect(page.locator('body')).toContainText(component.title);
    });
  }

  test('should navigate from sidebar', async ({ page }) => {
    await page.goto('/docs/primitives/select');
    await page.waitForLoadState('networkidle');
    await page
      .getByRole('navigation', { name: 'Quartz Headless docs' })
      .getByRole('link', { name: 'Dialog & Drawer' })
      .click();
    await expect(page).toHaveURL('/docs/primitives/dialog');
  });

  test('should show the full catalogue on /components', async ({ page }) => {
    await page.goto('/components');
    await expect(page.getByText('10 APIs', { exact: true })).toBeVisible();
    await expect(page.getByText('20 primitives', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Accordion/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /ToggleGroup/ })).toBeVisible();
  });
});
