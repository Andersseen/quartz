import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from './support/test';
import { gotoReady } from './support/readiness';

const settled = (page: Page) =>
  page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'));

test.describe('Component pages (/components/:slug)', () => {
  test('a primitive page has a playground, live examples, install and links to its docs', async ({
    page,
  }) => {
    const problems: string[] = [];
    page.on('pageerror', (error) => problems.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') problems.push(message.text());
    });
    await gotoReady(page, '/components/slider');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Slider');
    await expect(page).toHaveTitle('Slider · Components · Quartz Headless');

    const playground = page.locator('[data-doq-playground="quartz-slider"]');
    await expect(playground).toBeVisible();
    await expect(playground.getByRole('slider').first()).toBeVisible();

    const examples = page.getByRole('region', { name: 'Example' });
    await expect(examples.getByRole('slider').first()).toBeVisible();

    await expect(page.getByLabel('Install and import')).toContainText(
      "import { SliderDirective } from '@quartz-headless/primitives';",
    );
    await expect(page.getByRole('link', { name: 'Documentation', exact: true })).toHaveAttribute(
      'href',
      '/docs/primitives/slider',
    );
    expect(problems).toEqual([]);
  });

  test('a Core API without visual output explains itself instead of showing an empty stage', async ({
    page,
  }) => {
    await gotoReady(page, '/components/focus');
    await expect(
      page.getByRole('heading', { name: 'Infrastructure, not interface' }),
    ).toBeVisible();
    await expect(page.locator('doq-playground')).toHaveCount(0);
    await expect(page.getByLabel('Install and import')).toContainText(
      "from '@quartz-headless/core';",
    );
  });

  test('the alias installs and imports what actually backs it', async ({ page }) => {
    await gotoReady(page, '/components/resizable');
    const install = page.getByLabel('Install and import');
    await expect(install).toContainText('npm install @quartz-headless/core');
    await expect(install).not.toContainText('@quartz-headless/primitives');
    await expect(install).toContainText('backed by');
  });

  test('the sidebar moves between components and updates the metadata', async ({ page }) => {
    await gotoReady(page, '/components/slider');
    const nav = page.getByRole('navigation', { name: 'Components', exact: true });
    await expect(nav.getByRole('link', { name: 'Slider', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await nav.getByRole('link', { name: 'Tabs', exact: true }).click();
    await expect(page).toHaveURL('/components/tabs');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tabs');
    await expect(page).toHaveTitle('Tabs · Components · Quartz Headless');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://quartz-headless.pages.dev/components/tabs',
    );
    await expect(page.locator('[data-doq-playground="quartz-tabs"]')).toBeVisible();
  });

  test('prerendered HTML carries the component metadata', async ({ request }) => {
    const html = await (await request.get('/components/dialog')).text();
    expect(html).toContain('<title>Dialog · Components · Quartz Headless</title>');
    expect(html).toContain('href="https://quartz-headless.pages.dev/components/dialog"');
  });

  test('passes axe and has no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await gotoReady(page, '/components/tabs');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await settled(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
