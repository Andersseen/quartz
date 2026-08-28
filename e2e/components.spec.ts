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
});
