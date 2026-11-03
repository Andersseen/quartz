import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from './support/test';
import { gotoReady } from './support/readiness';

/**
 * 0.22: the generated usage code of a playground must be real Angular template source, identical on
 * the documentation page and on the standalone component page, in sync with the controls, and copy
 * exactly what is on screen.
 */

const PAGES = [
  { id: 'quartz-slider', slug: 'slider', docs: '/docs/primitives/slider' },
  { id: 'quartz-range-slider', slug: 'range-slider', docs: '/docs/primitives/range-slider' },
  { id: 'quartz-select', slug: 'select', docs: '/docs/primitives/select' },
  { id: 'quartz-toolbar', slug: 'toolbar', docs: '/docs/primitives/toolbar' },
  { id: 'quartz-toggle-group', slug: 'toggle-group', docs: '/docs/primitives/toggle-group' },
] as const;

const playgroundOf = (page: Page, id: string) => page.locator(`[data-doq-playground="${id}"]`);
const templateCode = (page: Page, id: string) =>
  playgroundOf(page, id).locator('.doq-pg-panel pre code').first();

/** Records what the page asks the clipboard to write; `reject` simulates a denied permission. */
async function stubClipboard(page: Page, reject = false) {
  await page.addInitScript((rejectWrites) => {
    const writes: string[] = [];
    (window as unknown as { __copied: string[] }).__copied = writes;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => {
          if (rejectWrites) return Promise.reject(new DOMException('denied', 'NotAllowedError'));
          writes.push(text);
          return Promise.resolve();
        },
      },
    });
  }, reject);
}
const copied = (page: Page) =>
  page.evaluate(() => (window as unknown as { __copied: string[] }).__copied);

function watchProblems(page: Page) {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(message.text());
  });
  return problems;
}

test.describe('Playground usage code', () => {
  for (const { id, slug, docs } of PAGES) {
    test(`${slug}: real markup, no escaped entities, docs and component page agree`, async ({
      page,
    }) => {
      const problems = watchProblems(page);
      await gotoReady(page, docs);
      const fromDocs = await templateCode(page, id).innerText();
      await gotoReady(page, `/components/${slug}`);
      const fromComponent = await templateCode(page, id).innerText();

      expect(fromComponent).toBe(fromDocs);
      expect(fromDocs).not.toMatch(/&lt;|&gt;|&quot;|&amp;/);
      expect(fromDocs).toMatch(/^<[a-z]/);
      expect(fromDocs).not.toContain('…');
      expect(problems).toEqual([]);
    });
  }

  test('slider: controls change the code and the preview, on both pages', async ({ page }) => {
    for (const path of ['/docs/primitives/slider', '/components/slider']) {
      await gotoReady(page, path);
      const playground = playgroundOf(page, 'quartz-slider');
      const code = templateCode(page, 'quartz-slider');
      await expect(code).toContainText('<div qzSliderTrack>');
      await expect(code).toContainText('<button qzSliderThumb aria-label="Volume"></button>');
      await expect(code).not.toContainText('orientation');

      await playground.getByLabel('Orientation').selectOption({ label: 'Vertical' });
      await playground.getByLabel('Disabled').check();
      await playground.getByLabel('Max', { exact: true }).fill('50');
      await expect(code).toContainText('orientation="vertical"');
      await expect(code).toContainText('disabled');
      await expect(code).toContainText('[max]="50"');
      await expect(playground.getByRole('slider').first()).toHaveAttribute(
        'aria-orientation',
        'vertical',
      );
      await expect(playground.getByRole('slider').first()).toHaveAttribute('aria-valuemax', '50');
    }
  });

  test('range slider and select track their controls', async ({ page }) => {
    await gotoReady(page, '/components/range-slider');
    const range = playgroundOf(page, 'quartz-range-slider');
    await range.getByLabel('Min distance').fill('10');
    await expect(templateCode(page, 'quartz-range-slider')).toContainText('[minDistance]="10"');

    await gotoReady(page, '/components/select');
    const select = playgroundOf(page, 'quartz-select');
    const code = templateCode(page, 'quartz-select');
    await expect(code).toContainText('[(value)]="fruit"');
    await select.getByLabel('Multiple').check();
    await expect(code).toContainText('[(values)]="fruits"');
    await select.getByLabel('Groups').uncheck();
    await expect(code).not.toContainText('qzSelectGroup');
  });

  test('toolbar and toggle group reflect orientation, RTL and single/multiple', async ({
    page,
  }) => {
    await gotoReady(page, '/components/toolbar');
    const toolbar = playgroundOf(page, 'quartz-toolbar');
    await toolbar.getByLabel('Orientation').selectOption({ label: 'Vertical' });
    await toolbar.getByLabel('RTL').check();
    const toolbarCode = templateCode(page, 'quartz-toolbar');
    await expect(toolbarCode).toContainText('orientation="vertical"');
    await expect(toolbarCode).toContainText('dir="rtl"');

    await gotoReady(page, '/components/toggle-group');
    const group = playgroundOf(page, 'quartz-toggle-group');
    await group.getByLabel('Type').selectOption({ label: 'Multiple' });
    const groupCode = templateCode(page, 'quartz-toggle-group');
    await expect(groupCode).toContainText('type="multiple"');
    await expect(groupCode).toContainText('<button qzToggleItem="bold">Bold</button>');
  });

  test('copy writes exactly the visible source, with newlines and indentation', async ({
    page,
  }) => {
    await stubClipboard(page);
    await gotoReady(page, '/components/slider');
    const playground = playgroundOf(page, 'quartz-slider');
    await playground.getByLabel('Disabled').check();
    await expect(templateCode(page, 'quartz-slider')).toContainText('disabled');
    const visible = await templateCode(page, 'quartz-slider').innerText();

    const button = playground.locator('.doq-pg-panel').first().locator('.doq-pg-copy');
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(playground.getByRole('status')).toHaveText(
      'Template (unstyled) code copied to the clipboard.',
    );
    const [text] = await copied(page);
    expect(text).toBe(visible);
    expect(text).toContain('\n  <div qzSliderTrack>\n    <div qzSliderRange></div>');
    expect(text).not.toMatch(/&lt;|&gt;|&quot;/);
    // Keyboard activation keeps focus on the control.
    await expect(button).toBeFocused();
  });

  test('a rejected clipboard write is reported, not swallowed', async ({ page }) => {
    await stubClipboard(page, true);
    await gotoReady(page, '/components/toolbar');
    const playground = playgroundOf(page, 'quartz-toolbar');
    await playground.locator('.doq-pg-copy').first().click();
    await expect(playground.getByRole('status')).toHaveText('Clipboard access is unavailable.');
  });

  test('navigating between component and docs pages never keeps a stale snippet', async ({
    page,
  }) => {
    const problems = watchProblems(page);
    await gotoReady(page, '/components/slider');
    await playgroundOf(page, 'quartz-slider').getByLabel('Disabled').check();
    await page.getByRole('link', { name: 'Documentation', exact: true }).click();
    await expect(page).toHaveURL('/docs/primitives/slider');
    const code = templateCode(page, 'quartz-slider');
    await expect(code).toContainText('<div qzSliderTrack>');
    await expect(code).not.toContainText('disabled');

    await gotoReady(page, '/components/range-slider');
    await expect(templateCode(page, 'quartz-range-slider')).toContainText('qzRangeSliderThumb');
    const nav = page.getByRole('navigation', { name: 'Components', exact: true });
    await nav.getByRole('link', { name: 'Slider', exact: true }).click();
    await expect(page).toHaveURL('/components/slider');
    await expect(templateCode(page, 'quartz-slider')).not.toContainText('disabled');
    expect(problems).toEqual([]);
  });

  test('controls keep focus while the code updates and the page passes axe on mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await gotoReady(page, '/components/slider');
    const playground = playgroundOf(page, 'quartz-slider');
    const disabled = playground.getByLabel('Disabled');
    await disabled.focus();
    await page.keyboard.press('Space');
    await expect(disabled).toBeChecked();
    await expect(disabled).toBeFocused();
    await expect(templateCode(page, 'quartz-slider')).toContainText('disabled');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.waitForFunction(() =>
      document.getAnimations().every((a) => a.playState !== 'running'),
    );
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
