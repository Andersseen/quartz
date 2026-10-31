import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';

const go = async (page: Page, url: string) => {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
};

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
});

test.describe('Catalogue (/components)', () => {
  const entryLinks = (page: Page) => page.locator('main [data-entry] h3 a');

  test('lists every documented Core and Primitives page exactly once', async ({ page }) => {
    await go(page, '/components');
    const documented = ['core', 'primitives'].flatMap((group) =>
      readdirSync(`src/content/docs/${group}`)
        .filter((file) => file.endsWith('.md'))
        .map((file) => `/docs/${group}/${file.replace(/\.md$/, '')}`),
    );
    const listed = await entryLinks(page).evaluateAll((links) =>
      links.map((a) => a.getAttribute('href')),
    );
    expect([...listed].sort()).toEqual([...documented].sort());
  });

  test('shows honest counts and labels aliases and recipes', async ({ page }) => {
    await go(page, '/components');
    const intro = (await page.locator('main header').innerText()).replace(/\s+/g, ' ');
    expect(intro).toContain('10 Core APIs and 34 primitive families');
    for (const stale of ['20 primitives', '17 controls', '10 APIs']) {
      await expect(page.locator('body')).not.toContainText(stale);
    }
    const resizable = page.locator('[data-entry="/docs/primitives/resizable"]');
    await expect(resizable).toContainText('Alias');
    await expect(resizable).toContainText('Core Splitter');
    await expect(page.locator('[data-entry="/docs/primitives/search-composition"]')).toContainText(
      'Recipe',
    );
    // The newer patterns that the old catalogue omitted are discoverable.
    for (const name of [
      'Drawer',
      'Sidebar',
      'NavigationMenu',
      'Pagination',
      'InputOTP',
      'FileUpload',
      'RangeSlider',
      'DateRangePicker',
    ]) {
      await expect(entryLinks(page).filter({ hasText: new RegExp(`^${name}$`) })).toHaveCount(1);
    }
  });

  test('every catalogue link resolves and Core links reach their own pages', async ({
    page,
    request,
  }) => {
    await go(page, '/components');
    const hrefs = (await entryLinks(page).evaluateAll((links) =>
      links.map((a) => a.getAttribute('href') as string),
    )) as string[];
    expect(hrefs).not.toContain('/docs');
    for (const href of hrefs) {
      const response = await request.get(href);
      expect(response.status(), href).toBe(200);
    }
    await page.locator('[data-entry="/docs/core/dismiss"] h3 a').click();
    await expect(page).toHaveURL('/docs/core/dismiss');
  });

  test('search matches names, keywords and exports, and Clear restores the list', async ({
    page,
  }) => {
    await go(page, '/components');
    const total = await entryLinks(page).count();
    const search = page.getByLabel('Search the catalogue');

    await search.fill('autocomplete');
    await expect(entryLinks(page).filter({ hasText: /^Combobox$/ })).toHaveCount(1);
    await expect(page.getByTestId('catalogue-count')).toContainText('of');

    await search.fill('createFocusTrap');
    await expect(entryLinks(page)).toHaveText(['Focus']);

    await search.fill('zzzz-nothing');
    await expect(page.getByTestId('catalogue-empty')).toBeVisible();

    await page.getByRole('button', { name: 'Show everything' }).click();
    await expect(search).toBeFocused();
    await expect(search).toHaveValue('');
    await expect(entryLinks(page)).toHaveCount(total);

    await search.fill('slider');
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(entryLinks(page)).toHaveCount(total);
  });

  test('category and package filters are keyboard operable and announce results', async ({
    page,
  }) => {
    await go(page, '/components');
    const total = await entryLinks(page).count();
    const category = page.getByRole('group', { name: 'Category' });
    const feedback = category.getByRole('button', { name: 'Data & feedback' });
    await feedback.focus();
    await page.keyboard.press('Enter');
    await expect(feedback).toHaveAttribute('aria-pressed', 'true');
    const count = await entryLinks(page).count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(total);
    await expect(page.getByTestId('catalogue-count')).toContainText(`Showing ${count} of ${total}`);

    await page
      .getByRole('group', { name: 'Package' })
      .getByRole('button', { name: 'Core' })
      .click();
    await expect(entryLinks(page)).toHaveText(['VirtualScroll']);

    await category.getByRole('button', { name: 'All categories' }).click();
    await page
      .getByRole('group', { name: 'Package' })
      .getByRole('button', { name: 'Both packages' })
      .click();
    await expect(entryLinks(page)).toHaveCount(total);
  });

  test('filters round-trip through the URL (?layer=core from the home page)', async ({ page }) => {
    await go(page, '/components?layer=core&q=scroll');
    await expect(page.getByLabel('Search the catalogue')).toHaveValue('scroll');
    await expect(entryLinks(page)).toHaveText(['Dismiss', 'ScrollLock', 'VirtualScroll']);
  });

  test('passes axe, with and without results, and has no horizontal overflow', async ({ page }) => {
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      await go(page, '/components');
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${width}px`,
      ).toBe(true);
    }
    await page.setViewportSize({ width: 1024, height: 800 });
    let results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(',')}`),
    ).toEqual([]);
    await page.getByLabel('Search the catalogue').fill('zzzz-nothing');
    results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  test('loads without console errors or warnings', async ({ page }) => {
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text());
    });
    await go(page, '/components?category=floating');
    await page.getByLabel('Search the catalogue').fill('menu');
    expect(problems).toEqual([]);
  });
});
