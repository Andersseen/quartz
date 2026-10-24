import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Official documentation (Doqs) against the production build: prerendered HTML served like
 * Cloudflare Pages (directory indexes, `_redirects`, real 404s). Covers navigation, deep links,
 * search, TOC, copy, mobile drawer, live demos, playgrounds, generated API pages, legacy
 * redirects, console cleanliness and automated accessibility scans.
 */

/** Navigate and wait for hydration/idle so early clicks are not lost to event replay races. */
const go = async (page: Page, url: string) => {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
};

const docsNav = (page: Page) => page.getByRole('navigation', { name: 'Quartz Headless docs' });

function trackConsole(page: Page) {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(`${message.type()}: ${message.text()}`);
    }
  });
  return problems;
}

test.describe('navigation', () => {
  test('landing links to the documentation index', async ({ page }) => {
    await go(page, '/');
    await page.getByRole('banner').getByRole('link', { name: 'Docs' }).click();
    await expect(page).toHaveURL(/\/docs\/?$/);
    await expect(
      page.getByRole('heading', { name: 'Quartz Headless documentation', level: 1 }),
    ).toBeVisible();
  });

  test('the index lists documents from every group', async ({ page }) => {
    await go(page, '/docs');
    for (const href of [
      '/docs/getting-started/installation',
      '/docs/guides/angular-forms',
      '/docs/core/overlay',
      '/docs/primitives/combobox',
      '/docs/reference/packages-and-versions',
      '/docs/migration/upgrading-to-0-10',
    ]) {
      await expect(page.locator(`main a[href="${href}"]`)).toBeVisible();
    }
  });

  test('sidebar navigation reaches nested routes and marks the active page', async ({ page }) => {
    await go(page, '/docs/primitives/select');
    await docsNav(page).getByRole('link', { name: 'Dialog & Drawer' }).click();
    await expect(page).toHaveURL('/docs/primitives/dialog');
    await expect(page.getByRole('heading', { name: 'Dialog & Drawer', level: 1 })).toBeVisible();
    await expect(docsNav(page).getByRole('link', { name: 'Dialog & Drawer' })).toHaveClass(
      /is-active/,
    );
    await expect(
      docsNav(page).getByRole('link', { name: 'Select', exact: true }),
    ).not.toHaveAttribute('aria-current', 'page');
  });

  test('deep links, refresh and back/forward work', async ({ page }) => {
    await go(page, '/docs/guides/angular-forms');
    await expect(
      page.getByRole('heading', { name: 'Angular Forms adapters', level: 1 }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Angular Forms adapters', level: 1 }),
    ).toBeVisible();

    await docsNav(page).getByRole('link', { name: 'Accessibility contracts' }).click();
    await expect(page).toHaveURL('/docs/guides/accessibility');
    await page.goBack();
    await expect(page).toHaveURL('/docs/guides/angular-forms');
    await expect(
      page.getByRole('heading', { name: 'Angular Forms adapters', level: 1 }),
    ).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL('/docs/guides/accessibility');
  });

  test('previous/next links follow the sidebar order', async ({ page }) => {
    await go(page, '/docs/getting-started/installation');
    await page
      .getByRole('navigation', { name: 'Page navigation' })
      .getByRole('link', { name: /Next/ })
      .click();
    await expect(page).toHaveURL('/docs/getting-started/quick-start');
  });

  test('the table of contents lists and scrolls to headings', async ({ page }) => {
    await go(page, '/docs/primitives/select');
    const toc = page.getByRole('complementary', { name: 'On this page' });
    await toc.getByRole('link', { name: 'Keyboard' }).click();
    await expect(page).toHaveURL(/#keyboard$/);
    await expect(page.locator('#keyboard')).toBeInViewport();
  });

  test('copy buttons confirm after copying a code block', async ({
    page,
    context,
    browserName,
  }) => {
    if (browserName === 'chromium')
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await go(page, '/docs/getting-started/quick-start');
    const copy = page.locator('.doq-code-copy').first();
    await copy.click();
    await expect(copy).toHaveText(/Copied/i);
    if (browserName === 'chromium') {
      expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('qzSelect');
    }
  });

  test('legacy root URLs permanently redirect to the canonical documentation URLs', async ({
    page,
    request,
  }) => {
    for (const [from, to] of [
      ['/select', '/docs/primitives/select'],
      ['/dialog', '/docs/primitives/dialog'],
      ['/overlay', '/docs/core/overlay'],
      ['/docs/index', '/docs'],
    ] as const) {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status(), from).toBe(301);
      expect(response.headers()['location'], from).toMatch(new RegExp(`${to}$`));
    }
    await go(page, '/toggle-group');
    await expect(page).toHaveURL('/docs/primitives/toggle-group');
    await go(page, '/docs/primitives/select');
    await expect(page).toHaveURL('/docs/primitives/select'); // no redirect loop
  });

  test('unknown paths are real 404s (no SPA fallback)', async ({ request }) => {
    expect((await request.get('/docs/does-not-exist')).status()).toBe(404);
  });
});

test.describe('search', () => {
  test('opens with the button and Ctrl/Cmd+K, finds pages and links to valid routes', async ({
    page,
  }) => {
    await go(page, '/docs/guides/accessibility');
    await page.getByRole('button', { name: 'Search' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('searchbox').fill('combobox');
    const first = dialog.getByRole('list', { name: 'Search results' }).getByRole('link').first();
    await expect(first).toBeVisible();
    const hrefs = await dialog
      .getByRole('list', { name: 'Search results' })
      .getByRole('link')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    expect(hrefs.some((href) => href?.startsWith('/docs/primitives/combobox'))).toBe(true);
    for (const href of hrefs) {
      const response = await page.request.get(href!.split('#')[0]);
      expect(response.status(), href!).toBe(200);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('API symbol pages are not in the search index', async ({ page }) => {
    await go(page, '/docs/guides/accessibility');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByRole('searchbox').fill('SelectGroupLabelDirective');
    await expect(page.getByRole('status')).toContainText(/\d+ results?|No results/i);
    const hrefs = await page
      .getByRole('list', { name: 'Search results' })
      .getByRole('link')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
    expect(hrefs.filter((href) => /reference\/api\/[a-z]+\/[a-z-]+#/.test(href))).toEqual([]);
  });
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 700 } });

  test('the documentation drawer opens, navigates and closes; no horizontal overflow', async ({
    page,
  }) => {
    await go(page, '/docs/primitives/select');
    const menu = page.getByRole('button', { name: 'Quartz Headless docs menu' });
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await docsNav(page).getByRole('link', { name: 'Tooltip' }).click();
    await expect(page).toHaveURL('/docs/primitives/tooltip');
    await expect(page.getByRole('heading', { name: 'Tooltip', level: 1 })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
  });

  test('the site header menu exposes the top-level links', async ({ page }) => {
    await go(page, '/docs');
    await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
    await expect(
      page
        .getByRole('navigation', { name: 'Mobile navigation' })
        .getByRole('link', { name: 'Docs' }),
    ).toBeVisible();
  });
});

test.describe('prerendered output', () => {
  test('is meaningful HTML with unique metadata and no duplicate canonicals', async ({
    request,
  }) => {
    for (const path of ['/docs/primitives/select', '/docs/guides/angular-forms', '/docs']) {
      const html = await (await request.get(path)).text();
      expect(html, path).toMatch(/<h1[^>]*>[^<]+/);
      expect(html.match(/<title>/g)?.length, path).toBe(1);
      expect(html.match(/<meta name="description"/g)?.length, path).toBe(1);
      expect(html.match(/rel="canonical"/g)?.length ?? 0, path).toBeLessThanOrEqual(1);
    }
    const select = await (await request.get('/docs/primitives/select')).text();
    expect(select).toContain('<title>Select · Quartz Headless</title>');
    expect(select).toContain('Multiple selection and groups');
    // Live examples are created in the browser, never executed during prerendering.
    expect(select).not.toContain('app-select-demo ');
  });
});

test.describe('live demos and playgrounds', () => {
  test('an embedded Quartz demo works after hydration', async ({ page }) => {
    const problems = trackConsole(page);
    await go(page, '/docs/primitives/select');
    const trigger = page.getByTestId('select-basic-trigger');
    await expect(trigger).toBeVisible();
    await trigger.click();
    await page.getByTestId('select-basic-option').filter({ hasText: 'Germany' }).click();
    await expect(page.getByText('Value: de')).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('the Select playground drives the real primitive and reports outputs', async ({ page }) => {
    await go(page, '/docs/primitives/select');
    const playground = page.locator('[data-doq-playground="quartz-select"]');
    await playground.getByLabel('Multiple').check();
    await playground.getByRole('button', { name: 'Fruit' }).click();
    const listbox = page.getByRole('listbox', { name: 'Fruit' });
    await expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    await expect(page.getByRole('group', { name: 'Citrus' })).toBeVisible();
    await page.getByRole('option', { name: 'Lemon' }).click();
    await page.getByRole('option', { name: 'Orange' }).click();
    await expect(listbox).toBeVisible(); // toggles keep the popup open
    await expect(playground.getByTestId('select-playground-value')).toContainText(
      'blueberry, lemon, orange',
    );
    await expect(playground.locator('.doq-pg-events')).toContainText(/orange/);
    await page.keyboard.press('Escape');
    await playground.getByLabel('Disabled').check();
    await expect(playground.getByRole('button', { name: 'Fruit' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  test('the Combobox playground separates the query from the value', async ({ page }) => {
    await go(page, '/docs/primitives/combobox');
    const playground = page.locator('[data-doq-playground="quartz-combobox"]');
    const input = playground.getByRole('combobox', { name: 'City' });
    await input.fill('pra');
    await page.getByRole('option', { name: 'Prague' }).click();
    await expect(input).toHaveValue('Prague');
    await expect(playground.getByText('Value: Prague')).toBeVisible();
    await expect(playground.locator('.doq-pg-events')).toContainText(/Query/);
  });
});

test.describe('generated API reference', () => {
  test('is linked from the reference index and documents the 0.10 additions', async ({ page }) => {
    await go(page, '/docs/reference/packages-and-versions');
    await page
      .getByRole('link', { name: '@quartz-headless/primitives', exact: true })
      .first()
      .click();
    await expect(page).toHaveURL('/docs/reference/api/primitives');
    await page.getByRole('link', { name: 'SelectDirective' }).first().click();
    await expect(page).toHaveURL('/docs/reference/api/primitives/select-directive');
    await expect(page.getByRole('cell', { name: 'multiple', exact: true }).first()).toBeVisible();
  });
});

test.describe('health', () => {
  const routes = [
    '/',
    '/components',
    '/docs',
    '/docs/getting-started/quick-start',
    '/docs/primitives/select',
    '/docs/primitives/combobox',
    '/docs/primitives/listbox',
    '/docs/primitives/dialog',
    '/docs/core/overlay',
    '/docs/reference/api/core',
  ];

  test('no console errors, warnings or hydration mismatches', async ({ page }) => {
    const problems = trackConsole(page);
    for (const route of routes) {
      await go(page, route);
      await page.waitForLoadState('networkidle');
    }
    expect(problems).toEqual([]);
  });

  test('every internal link on key pages resolves', async ({ page, request }) => {
    const seen = new Set<string>();
    for (const route of ['/docs', '/docs/primitives/select', '/components', '/']) {
      await go(page, route);
      const hrefs = await page
        .locator('a[href^="/"]')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
      for (const href of hrefs) seen.add(href.split('#')[0] || '/');
    }
    for (const href of seen) {
      const response = await request.get(href, { maxRedirects: 5 });
      expect(response.status(), href).toBe(200);
    }
  });

  test('reduced motion does not break the documentation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const problems = trackConsole(page);
    await go(page, '/docs/primitives/select');
    await expect(page.getByRole('heading', { name: 'Select', level: 1 })).toBeVisible();
    expect(problems).toEqual([]);
  });
});

test.describe('accessibility (axe)', () => {
  const scan = async (page: Page, selector?: string) => {
    let builder = new AxeBuilder({ page });
    if (selector) builder = builder.include(selector);
    const { violations } = await builder.analyze();
    expect(
      violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`),
    ).toEqual([]);
  };

  test('guide page', async ({ page }) => {
    await go(page, '/docs/guides/angular-forms');
    await scan(page);
  });

  test('component page with live demo and a single h1', async ({ page }) => {
    await go(page, '/docs/primitives/select');
    await expect(page.getByTestId('select-basic-trigger')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await scan(page);
  });

  test('search dialog', async ({ page }) => {
    await go(page, '/docs/guides/accessibility');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByRole('searchbox').fill('select');
    await expect(page.getByRole('list', { name: 'Search results' })).toBeVisible();
    await scan(page, 'dialog');
  });

  test('open playground select (active popup)', async ({ page }) => {
    await go(page, '/docs/primitives/select');
    const playground = page.locator('[data-doq-playground="quartz-select"]');
    await playground.getByRole('button', { name: 'Fruit' }).click();
    await expect(page.getByRole('listbox', { name: 'Fruit' })).toBeVisible();
    await scan(page, '[data-qz-overlay-container]');
  });

  test('mobile docs drawer open', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await go(page, '/docs/primitives/select');
    await page.getByRole('button', { name: 'Quartz Headless docs menu' }).click();
    await scan(page, 'nav[aria-label="Quartz Headless docs"]');
  });
});
