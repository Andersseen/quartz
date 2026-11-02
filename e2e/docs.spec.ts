import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from './support/test';
import { gotoReady, waitForDemos } from './support/readiness';

/**
 * Official documentation (Doqs) against the production build: prerendered HTML served like
 * Cloudflare Pages (directory indexes, `_redirects`, real 404s). Covers navigation, deep links,
 * search, TOC, copy, mobile drawer, live demos, playgrounds, generated API pages, legacy
 * redirects, console cleanliness and automated accessibility scans.
 */

/**
 * Navigate and wait for the readiness contract (hydrated app, rendered heading — see
 * support/readiness.ts), so early clicks are not lost to event replay races. Redirecting URLs are
 * allowed here; the tests that care assert the final URL themselves.
 */
const go = (page: Page, url: string) => gotoReady(page, url, { path: /^\// });

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

  test('0.16 demos hydrate and work: Drawer, Resizable, Tooltip arrow, Popover arrow, Menu groups', async ({
    page,
  }) => {
    const problems = trackConsole(page);

    await go(page, '/docs/primitives/drawer');
    const demo = page.locator('app-drawer-demo');
    await expect(demo).toBeVisible();
    await demo.getByRole('button', { name: 'left', exact: true }).focus();
    await page.keyboard.press('Enter');
    const drawer = page.locator('[data-qz-drawer]');
    await expect(drawer).toHaveAttribute('data-side', 'left');
    await expect(drawer).toHaveAttribute('role', 'dialog');
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);

    await go(page, '/docs/primitives/resizable');
    const handle = page.getByRole('separator', { name: 'Resize navigator' });
    await handle.focus();
    await page.keyboard.press('ArrowRight');
    await expect(handle).toHaveAttribute('aria-valuenow', '50');
    await expect(page.locator('app-resizable-demo output').first()).toContainText('50 %');

    await go(page, '/docs/primitives/tooltip');
    const tipButton = page.locator('app-tooltip-arrow-demo button', { hasText: 'Arrow above' });
    // Scroll first: a scroll while open dismisses overlays.
    await tipButton.scrollIntoViewIfNeeded();
    await tipButton.focus();
    await expect(page.locator('.qz-tooltip[data-side]')).toBeVisible();
    await page.keyboard.press('Escape');

    await go(page, '/docs/primitives/popover');
    const popButton = page.locator('app-popover-arrow-demo button', { hasText: 'Arrow below' });
    await expect(popButton).toHaveAttribute('aria-expanded', 'false');
    await popButton.scrollIntoViewIfNeeded();
    await expect(async () => {
      if ((await popButton.getAttribute('aria-expanded')) !== 'true') {
        await popButton.focus();
        await page.keyboard.press('Enter');
      }
      await expect(popButton).toHaveAttribute('aria-expanded', 'true', { timeout: 1000 });
      await expect(page.locator('[data-qz-popover][data-side]')).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 10000 });
    await page.keyboard.press('Escape');
    await expect(popButton).toHaveAttribute('aria-expanded', 'false');

    await go(page, '/docs/primitives/menu');
    const menuButton = page.locator('app-menu-groups-demo').getByRole('button', {
      name: 'Workspace',
    });
    // aria-expanded is written by the hydrated directive: wait for it before interacting.
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await menuButton.scrollIntoViewIfNeeded();
    // Late layout shifts while the docs page settles can scroll-dismiss a just-opened overlay:
    // re-open until the menu is stably visible.
    await expect(async () => {
      if ((await menuButton.getAttribute('aria-expanded')) !== 'true') {
        await menuButton.focus();
        await page.keyboard.press('Enter');
      }
      await expect(page.getByRole('group', { name: 'Account' })).toBeVisible({ timeout: 1000 });
      await expect(page.getByRole('group', { name: 'Density' })).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 10000 });
    await page.keyboard.press('Escape');

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

test.describe('0.11 range and toggle playgrounds', () => {
  test('the RangeSlider playground drives the real primitive without competing bindings', async ({
    page,
  }) => {
    const problems = trackConsole(page);
    await go(page, '/docs/primitives/range-slider');
    const playground = page.locator('[data-doq-playground="quartz-range-slider"]');
    await expect(playground.getByText('Range: 20 – 70')).toBeVisible();

    const low = playground.getByRole('slider', { name: 'Minimum', exact: true });
    await low.focus();
    await page.keyboard.press('End'); // stops at the high thumb
    await expect(playground.getByText('Range: 70 – 70')).toBeVisible();
    await expect(playground.locator('.doq-pg-events')).toContainText(/low[^0-9]+70/);

    // A control change re-applies the invariants: high wins, low is pulled back.
    await playground.getByLabel('Min distance').fill('10');
    await expect(playground.getByText('Range: 60 – 70')).toBeVisible();
    await expect(low).toHaveAttribute('aria-valuemax', '60');
    await playground.getByLabel('Disabled').check();
    await expect(low).toHaveAttribute('aria-disabled', 'true');
    expect(problems).toEqual([]);
  });

  test('the Slider, Toggle and ToggleGroup playgrounds respond to controls and user input', async ({
    page,
  }) => {
    await go(page, '/docs/primitives/slider');
    const slider = page.locator('[data-doq-playground="quartz-slider"]');
    await slider.getByLabel('Value', { exact: true }).fill('80');
    await expect(slider.getByText('Value: 80')).toBeVisible();
    await slider.getByRole('slider', { name: 'Volume' }).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(slider.getByText('Value: 75')).toBeVisible();
    await expect(slider.locator('.doq-pg-events')).toContainText('75');

    await go(page, '/docs/primitives/toggle');
    const toggle = page.locator('[data-doq-playground="quartz-toggle"]');
    await toggle.getByLabel('Pressed').check();
    await expect(toggle.getByRole('button', { name: 'Bold: on' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await toggle.getByRole('button', { name: 'Bold: on' }).click();
    await expect(toggle.getByRole('button', { name: 'Bold: off' })).toBeVisible();
    await expect(toggle.locator('.doq-pg-events')).toContainText('false');

    await go(page, '/docs/primitives/toggle-group');
    const group = page.locator('[data-doq-playground="quartz-toggle-group"]');
    await group.getByLabel('Allow deselection').uncheck();
    const bold = group.getByRole('button', { name: 'bold' });
    await bold.click();
    await bold.click();
    await expect(bold).toHaveAttribute('aria-pressed', 'true');
    await group.getByRole('button', { name: 'italic' }).click();
    await expect(bold).toHaveAttribute('aria-pressed', 'false');
  });

  test('search finds the new RangeSlider guide', async ({ page }) => {
    await go(page, '/docs/guides/accessibility');
    await page.getByRole('button', { name: 'Search' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('searchbox').fill('RangeSlider');
    const links = dialog.getByRole('list', { name: 'Search results' }).getByRole('link');
    await expect(links.first()).toBeVisible();
    const hrefs = await links.evaluateAll((all) => all.map((link) => link.getAttribute('href')));
    expect(hrefs.some((href) => href?.startsWith('/docs/primitives/range-slider'))).toBe(true);
  });

  test('the generated API reference lists the new symbols', async ({ page }) => {
    await go(page, '/docs/reference/api/primitives/range-slider-directive');
    await expect(
      page.getByRole('heading', { name: 'RangeSliderDirective', level: 1 }),
    ).toBeVisible();
    await go(page, '/docs/reference/api/forms/range-slider-control-directive');
    await expect(
      page.getByRole('heading', { name: 'RangeSliderControlDirective', level: 1 }),
    ).toBeVisible();
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
    '/docs/primitives/drawer',
    '/docs/primitives/resizable',
    '/docs/primitives/tooltip',
    '/docs/primitives/popover',
    '/docs/primitives/menu',
    '/docs/primitives/slider',
    '/docs/primitives/range-slider',
    '/docs/primitives/toggle',
    '/docs/primitives/toggle-group',
    '/docs/migration/upgrading-to-0-11',
    '/docs/core/overlay',
    '/docs/reference/api/core',
  ];

  test('no console errors, warnings or hydration mismatches', async ({ page }) => {
    // Visits 20 routes in sequence (~19 s alone in Firefox), so the default 30 s budget is exhausted under parallel load.
    test.slow();
    const problems = trackConsole(page);
    for (const route of routes) {
      await go(page, route);
      // Deferred demos either render or show their explicit fallback; both are final states.
      await waitForDemos(page);
    }
    expect(problems).toEqual([]);
  });

  test('a demo chunk that fails to load shows a fallback instead of an unhandled NG0750 error', async ({
    page,
  }) => {
    // Reproduces the cause of the intermittent Firefox "ERROR Error": aborting the lazy chunk of a
    // `@defer (on idle)` demo (what happens when a navigation interrupts it) rejects the dynamic import.
    await page.route(/\/assets\/select\.demo-[^/]+\.js$/, (route) => route.abort('failed'));
    const problems = trackConsole(page);
    await go(page, '/docs/primitives/select');
    await expect(page.getByText('This demo could not be loaded').first()).toBeVisible();
    expect(problems.filter((problem) => /NG0750|^error: ERROR/.test(problem))).toEqual([]);
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

test.describe('discovery journey', () => {
  test('catalogue → documentation → live demo → API reference → install path', async ({ page }) => {
    const problems = trackConsole(page);
    await go(page, '/components');
    await page.getByLabel('Search the catalogue').fill('slider');
    const card = page.locator('[data-entry="/docs/primitives/slider"]');
    await expect(card.getByRole('link', { name: 'Slider API reference' })).toHaveAttribute(
      'href',
      '/docs/reference/api/primitives/slider-directive',
    );
    await card.locator('h3 a').click();
    await expect(page).toHaveURL('/docs/primitives/slider');
    await expect(page.getByRole('heading', { name: 'Slider', level: 1 })).toBeVisible();
    // Live demo (lazy, hydrated) works.
    await expect(page.getByRole('slider', { name: 'Volume' }).first()).toBeVisible();
    // The install/copy-source path is on the page; the API page is one catalogue click away.
    await expect(page.getByRole('main')).toContainText('quartz add slider');
    expect(problems).toEqual([]);
    const api = await page.request.get('/docs/reference/api/primitives/slider-directive');
    expect(api.status()).toBe(200);
  });

  test('a Core entry reaches its own page, not the documentation index', async ({ page }) => {
    await go(page, '/components?layer=core');
    await page.locator('[data-entry="/docs/core/focus"] h3 a').click();
    await expect(page).toHaveURL('/docs/core/focus');
    await expect(page.getByRole('heading', { name: 'Focus', level: 1 })).toBeVisible();
  });

  test('documentation pages keep Doqs metadata after visiting the landing page', async ({
    page,
  }) => {
    await go(page, '/');
    await page.getByRole('banner').getByRole('link', { name: 'Docs' }).click();
    await page.locator('main a[href="/docs/primitives/select"]').click();
    await expect(page).toHaveTitle('Select · Quartz Headless');
    await expect(page.locator('link[rel="canonical"][data-site-canonical]')).toHaveCount(0);
    await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  });
});
