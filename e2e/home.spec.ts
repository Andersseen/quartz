import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { test, expect, type Page } from './support/test';
import { gotoReady } from './support/readiness';

/** Navigate, wait for hydration, and let entrance transitions finish so axe sees final colours. */
const go = async (page: Page, url: string) => {
  await gotoReady(page, url);
  await settled(page);
};

const settled = (page: Page) =>
  page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'));

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

const noOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test.describe('Home page content', () => {
  test.beforeEach(async ({ page }) => {
    await go(page, '/');
  });

  test('shows branding, the headline and the primary actions', async ({ page }) => {
    await expect(
      page.getByRole('banner').getByRole('link', { name: /Quartz Headless/ }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Behaviour for the interfaces you own.',
    );
    await expect(page.getByRole('link', { name: /Start building/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse the catalogue' })).toBeVisible();
  });

  test('states the verified Angular support and the published npm version', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).toContainText('Angular 21.2+ and 22');
    await expect(body).toContainText('npm 0.16.0');
    for (const unpublished of ['0.17.0', '0.18.0', '0.19.0', '0.20.0']) {
      await expect(body).not.toContainText(unpublished);
    }
    // The previous copy claimed plain "Angular 21".
    await expect(page.getByText(/Angular 21(?!\.)/)).toHaveCount(0);
  });

  test('has no stale primitive counts and derives counts from the catalogue', async ({ page }) => {
    const text = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    for (const stale of ['17 controls', '17 Primitives', '20 primitives', '36 ']) {
      expect(text).not.toContain(stale);
    }
    expect(text).toContain('10 Core APIs');
    expect(text).toMatch(/34 primitive families/);
  });

  test('has a single h1 and a sensible heading outline', async ({ page }) => {
    await expect(page.locator('h1')).toHaveCount(1);
    const levels = await page
      .locator('main h1, main h2, main h3')
      .evaluateAll((nodes) => nodes.map((node) => Number(node.tagName[1])));
    for (let i = 1; i < levels.length; i++)
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
  });

  test('footer shows the current year and real project links', async ({ page }) => {
    const footer = page.getByRole('contentinfo');
    await expect(footer).toContainText(`© ${new Date().getFullYear()} Andersseen`);
    await expect(footer).not.toContainText('2024 Quartz');
    await expect(footer.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/Andersseen/quartz',
    );
  });

  test('use-case and DX links all resolve to documentation pages', async ({ page, request }) => {
    const hrefs = await page
      .locator('main a[href^="/docs"], main a[href^="/components"]')
      .evaluateAll((links) => [...new Set(links.map((a) => a.getAttribute('href') as string))]);
    expect(hrefs.length).toBeGreaterThan(15);
    for (const href of hrefs) {
      const response = await request.get(href);
      expect(response.status(), href).toBe(200);
    }
  });
});

test.describe('Hero demo', () => {
  test.beforeEach(async ({ page }) => {
    await go(page, '/');
  });

  test('the slider responds to the keyboard and exposes ARIA', async ({ page }) => {
    const thumb = page.getByRole('slider', { name: 'Volume' });
    await expect(thumb).toHaveAttribute('aria-valuenow', '40');
    await expect(thumb).toHaveAttribute('aria-valuetext', '40 percent');
    await thumb.focus();
    await page.keyboard.press('ArrowRight');
    await expect(thumb).toHaveAttribute('aria-valuenow', '41');
    await page.keyboard.press('End');
    await expect(thumb).toHaveAttribute('aria-valuenow', '100');
    await expect(page.getByTestId('volume-readout')).toHaveText('100%');
  });

  test('the slider responds to pointer input', async ({ page }) => {
    const thumb = page.getByRole('slider', { name: 'Volume' });
    const track = page.locator('app-volume-demo [qzSliderTrack]');
    const box = (await track.boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.9, box.y + box.height / 2);
    await expect
      .poll(async () => Number(await thumb.getAttribute('aria-valuenow')))
      .toBeGreaterThan(80);
  });

  test('the switch mutes and disables the slider (controlled state)', async ({ page }) => {
    const mute = page.getByRole('switch', { name: 'Mute' });
    await expect(mute).toHaveAttribute('aria-checked', 'false');
    await mute.focus();
    await page.keyboard.press('Space');
    await expect(mute).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('volume-readout')).toHaveText('Muted');
    await expect(page.getByRole('slider', { name: 'Volume' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  test('Preview and Code are a keyboard-operable tab pair showing the same component', async ({
    page,
  }) => {
    const preview = page.getByRole('tab', { name: 'Preview' }).first();
    const code = page.getByRole('tab', { name: 'Code' }).first();
    await expect(preview).toHaveAttribute('aria-selected', 'true');
    await preview.focus();
    await page.keyboard.press('ArrowRight');
    await expect(code).toHaveAttribute('aria-selected', 'true');
    const source = page.getByRole('tabpanel', { name: /Code|Preview/ }).first();
    void source;
    const pre = page.getByLabel('Volume control source code');
    await expect(pre).toBeVisible();
    await expect(pre).toContainText('qzSlider');
    await expect(pre).toContainText('qzSwitch');
    await expect(pre).toContainText("from '@quartz-headless/primitives'");
  });

  test('displayed code is the real component source and imports only public entry points', async () => {
    for (const file of [
      'src/app/pages/home/demos/volume-demo.component.ts',
      'src/app/pages/home/demos/settings-dialog-demo.component.ts',
    ]) {
      const source = readFileSync(file, 'utf8');
      const quartzImports = [...source.matchAll(/from '(@quartz-headless[^']*)'/g)].map(
        (m) => m[1],
      );
      expect(quartzImports.length).toBeGreaterThan(0);
      for (const specifier of quartzImports) {
        expect(specifier).toMatch(/^@quartz-headless\/(core|primitives)(\/forms)?$/);
      }
      expect(source).not.toMatch(/packages\/|\/src\/|dist\//);
    }
  });
});

test.describe('Composition demo (Dialog + Select)', () => {
  test('opens, selects, applies and restores focus; Escape closes only the top layer', async ({
    page,
  }) => {
    await go(page, '/');
    const opener = page.getByRole('button', { name: 'Export settings…' });
    await opener.scrollIntoViewIfNeeded();
    await expect(opener).toBeVisible();
    // Keyboard open: Safari does not focus a button on mouse click, so there would be nothing
    // for the focus restorer to return to.
    await opener.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog', { name: 'Export format' });
    await expect(dialog).toBeVisible();
    const trigger = dialog.getByRole('button', { name: /^Format/ });
    await trigger.click();
    await expect(page.getByRole('listbox')).toBeVisible();

    // Escape closes the popup first, the dialog stays.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toBeHidden();
    await expect(dialog).toBeVisible();

    await trigger.click();
    await page.getByRole('option', { name: 'JSON' }).click();
    await dialog.getByRole('button', { name: 'Apply' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId('export-format-readout')).toContainText('JSON');
    await expect(opener).toBeFocused();
  });

  test('Escape closes the dialog and focus returns to the opener', async ({ page }) => {
    await go(page, '/');
    const opener = page.getByRole('button', { name: 'Export settings…' });
    await opener.scrollIntoViewIfNeeded();
    await opener.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Export format' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  test('the dialog passes axe while open', async ({ page }) => {
    await go(page, '/');
    const opener = page.getByRole('button', { name: 'Export settings…' });
    await opener.scrollIntoViewIfNeeded();
    await opener.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await settled(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});

test.describe('Install section', () => {
  test('offers distinct Core-only and Core + Primitives commands for npm and pnpm', async ({
    page,
  }) => {
    await go(page, '/');
    const install = page.locator('#install');
    await expect(install).toContainText('npm install @quartz-headless/core');
    await expect(install).toContainText(
      'npm install @quartz-headless/core @quartz-headless/primitives',
    );
    await install.getByRole('tab', { name: 'pnpm' }).click();
    await expect(install).toContainText(
      'pnpm add @quartz-headless/core @quartz-headless/primitives',
    );
    await expect(install).not.toContainText('bun ');
  });

  test('a successful copy is reported only after the clipboard resolves', async ({
    page,
    browserName,
  }) => {
    await go(page, '/');
    type Probe = { __copied: string[]; __release?: () => void };
    // The write stays pending until the test releases it, so "not reported before it resolves" is
    // asserted against a deterministic state instead of racing a timer (a slow click must not be
    // able to let the write finish, and the 2 s "Copied" window pass, before the first assertion).
    await page.evaluate(() => {
      const probe = window as unknown as Probe;
      probe.__copied = [];
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: (text: string) =>
            new Promise<void>((resolve) => {
              probe.__release = () => {
                probe.__copied.push(text);
                resolve();
              };
            }),
        },
      });
    });
    void browserName;
    const button = page.getByRole('button', {
      name: 'Copy Core + Primitives npm command',
    });
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await expect
      .poll(() => page.evaluate(() => typeof (window as unknown as Probe).__release))
      .toBe('function'); // the clipboard write has started and is pending
    await expect(button).toHaveText('Copy');
    await expect(page.getByTestId('copy-status')).not.toContainText('copied');
    await page.evaluate(() => (window as unknown as Probe).__release?.());
    await expect(button).toHaveText('Copied');
    await expect(page.getByTestId('copy-status')).toContainText('copied');
    expect(await page.evaluate(() => (window as unknown as Probe).__copied)).toEqual([
      'npm install @quartz-headless/core @quartz-headless/primitives',
    ]);
  });

  test('a rejected clipboard write is reported as a failure, never as copied', async ({ page }) => {
    await go(page, '/');
    await page.evaluate(() =>
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: () => Promise.reject(new DOMException('denied', 'NotAllowedError')) },
      }),
    );
    const button = page.getByRole('button', { name: 'Copy Core only npm command' });
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await expect(button).toHaveText('Copy failed');
    await expect(page.getByTestId('copy-status')).toContainText('blocked');
    await expect(page.getByText('Copied', { exact: true })).toHaveCount(0);
  });

  test('a missing Clipboard API is reported as unavailable', async ({ page }) => {
    await go(page, '/');
    await page.evaluate(() =>
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }),
    );
    const button = page.getByRole('button', { name: 'Copy Core only npm command' });
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await expect(page.getByTestId('copy-status')).toContainText('not available');
  });
});

test.describe('Header and mobile navigation', () => {
  test('desktop: marks the current route', async ({ page }) => {
    await go(page, '/components');
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await expect(nav.getByRole('link', { name: 'Components' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(nav.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test.describe('mobile', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('closed menu links are not focusable; toggle reports aria-expanded', async ({ page }) => {
      await go(page, '/');
      const toggle = page.getByRole('button', { name: 'Toggle navigation menu' });
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toHaveCount(0);
      // Tab through the header: only logo, toggle and GitHub are reachable, never menu links.
      await page.keyboard.press('Tab'); // skip link
      await page.keyboard.press('Tab');
      const reached: string[] = [];
      for (let i = 0; i < 4; i++) {
        reached.push(
          await page.evaluate(
            () =>
              document.activeElement?.getAttribute('aria-label') ??
              document.activeElement?.textContent?.trim() ??
              '',
          ),
        );
        await page.keyboard.press('Tab');
      }
      expect(reached.join('|')).not.toContain('Components');
    });

    test('opens, closes with Escape and restores focus to the toggle', async ({ page }) => {
      await go(page, '/');
      const toggle = page.getByRole('button', { name: 'Toggle navigation menu' });
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      const mobile = page.getByRole('navigation', { name: 'Mobile navigation' });
      await expect(mobile.getByRole('link', { name: 'Home' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      await mobile.getByRole('link', { name: 'Docs' }).focus();
      await page.keyboard.press('Escape');
      await expect(mobile).toHaveCount(0);
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(toggle).toBeFocused();
    });

    test('dismisses on outside press and on navigation', async ({ page }) => {
      await go(page, '/');
      const toggle = page.getByRole('button', { name: 'Toggle navigation menu' });
      await toggle.click();
      await page.getByTestId('mobile-nav-backdrop').click({ position: { x: 20, y: 600 } });
      await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toHaveCount(0);

      await toggle.click();
      await page
        .getByRole('navigation', { name: 'Mobile navigation' })
        .getByRole('link', { name: 'Components' })
        .click();
      await expect(page).toHaveURL(/\/components/);
      await expect(page.getByRole('button', { name: 'Toggle navigation menu' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });

    test('open menu passes axe', async ({ page }) => {
      await go(page, '/');
      await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
      await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
      await settled(page);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations.map((v) => v.id)).toEqual([]);
    });
  });
});

test.describe('Responsive layout', () => {
  for (const width of [320, 375, 768, 1024, 1440]) {
    test(`home has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await go(page, '/');
      expect(await noOverflow(page)).toBe(true);
      // Code view stays inside its frame and scrolls internally.
      await page.getByRole('tab', { name: 'Code' }).first().click();
      expect(await noOverflow(page)).toBe(true);
      const pre = page.getByLabel('Volume control source code');
      await expect(pre).toBeVisible();
      const box = (await pre.boundingBox())!;
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    });
  }

  test('touch targets in the header and hero are at least 40px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await go(page, '/');
    for (const locator of [
      page.getByRole('button', { name: 'Toggle navigation menu' }),
      page.getByRole('link', { name: /Start building/ }),
      page.getByRole('link', { name: 'Browse the catalogue' }),
    ]) {
      const box = (await locator.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(40);
      expect(box.width).toBeGreaterThanOrEqual(40);
    }
  });
});

test.describe('Metadata and quality', () => {
  test('prerendered HTML carries route-specific metadata', async ({ request }) => {
    const home = await (await request.get('/')).text();
    expect(home).toContain(
      '<title>Quartz Headless: unstyled, accessible Angular primitives</title>',
    );
    expect(home).toContain('<link rel="canonical" href="https://quartz-headless.pages.dev/"');
    expect(home).toContain('property="og:url" content="https://quartz-headless.pages.dev/"');
    expect(home).toContain('name="twitter:card"');
    expect(home).toContain('property="og:site_name"');

    const catalogue = await (await request.get('/components')).text();
    expect(catalogue).toContain('<title>Component catalogue · Quartz Headless</title>');
    expect(catalogue).toContain('href="https://quartz-headless.pages.dev/components"');
    expect(catalogue.match(/rel="canonical"/g)).toHaveLength(1);
  });

  test('robots.txt and sitemap.xml are published for the production origin', async ({
    request,
  }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Sitemap: https://quartz-headless.pages.dev/sitemap.xml');
    expect(robots).toContain('Disallow: /e2e-');
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('<loc>https://quartz-headless.pages.dev/</loc>');
    expect(sitemap).toContain('<loc>https://quartz-headless.pages.dev/components</loc>');
    expect(sitemap).toContain(
      '<loc>https://quartz-headless.pages.dev/docs/primitives/select</loc>',
    );
    expect(sitemap).not.toContain('e2e-');
  });

  test('client navigation from home to a doc page does not leave site metadata behind', async ({
    page,
  }) => {
    await go(page, '/');
    await page.getByRole('banner').getByRole('link', { name: 'Docs' }).click();
    await expect(page).toHaveURL(/\/docs\/?$/);
    await expect(page.locator('link[rel="canonical"][data-site-canonical]')).toHaveCount(0);
    await expect(page).not.toHaveTitle(/unstyled, accessible Angular primitives$/);
  });

  test('loads without console errors, warnings or hydration errors', async ({ page }) => {
    const problems = trackConsole(page);
    await go(page, '/');
    await page.getByRole('tab', { name: 'Code' }).first().click();
    await page.getByRole('button', { name: 'Export settings…' }).scrollIntoViewIfNeeded();
    expect(problems).toEqual([]);
  });

  test('passes axe in preview and code states', async ({ page }) => {
    await go(page, '/');
    let results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(',')}`),
    ).toEqual([]);
    await page.getByRole('tab', { name: 'Code' }).first().click();
    results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  test('respects prefers-reduced-motion: content is visible and the menu does not animate', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      reducedMotion: 'reduce',
      viewport: { width: 375, height: 667 },
    });
    const page = await context.newPage();
    await go(page, '/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
    const animation = await page
      .getByRole('navigation', { name: 'Mobile navigation' })
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(animation).toBe('none');
    await context.close();
  });
});
