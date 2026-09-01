import { test, expect } from '@playwright/test';

test.describe('Components Pages', () => {
  const components = [
    { path: '/overlay', title: 'Overlay' },
    { path: '/directionality', title: 'Directionality' },
    { path: '/dialog', title: 'Dialog & Drawer' },
    { path: '/tooltip', title: 'Tooltip' },
    { path: '/splitter', title: 'Splitter' },
    { path: '/toast', title: 'Toast' },
    { path: '/drag-drop', title: 'Drag & Drop' },
    { path: '/listbox', title: 'Listbox' },
    { path: '/menu', title: 'Menu' },
    { path: '/popover', title: 'Popover' },
    { path: '/combobox', title: 'Combobox' },
    { path: '/scroll-lock', title: 'Scroll Lock' },
    { path: '/select', title: 'Select' },
    { path: '/tabs', title: 'Tabs' },
    { path: '/accordion', title: 'Accordion' },
    { path: '/switch', title: 'Switch' },
    { path: '/checkbox', title: 'Checkbox' },
    { path: '/radio-group', title: 'RadioGroup' },
    { path: '/toggle', title: 'Toggle' },
    { path: '/toggle-group', title: 'ToggleGroup' },
    { path: '/slider', title: 'Slider' },
  ];

  for (const component of components) {
    test(`should render ${component.title} page`, async ({ page }) => {
      await page.goto(component.path);
      await expect(page).toHaveURL(component.path);
      await expect(page.locator('body')).toContainText(component.title);
    });
  }

  test('should navigate from sidebar', async ({ page }) => {
    await page.goto('/overlay');
    await page.click('text=Dialog');
    await expect(page).toHaveURL('/dialog');
  });

  test('should show the full catalogue on /components', async ({ page }) => {
    await page.goto('/components');
    await expect(page.getByText('10 APIs', { exact: true })).toBeVisible();
    await expect(page.getByText('20 primitives', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Accordion/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /ToggleGroup/ })).toBeVisible();
  });
});
