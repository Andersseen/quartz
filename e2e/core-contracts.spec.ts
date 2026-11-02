import { expect, test, type Page } from './support/test';

/**
 * Real-browser checks for the Core 0.7 contracts: layer ownership, focus scope, overlay geometry
 * and Collection recovery. Runs against the dedicated fixture at /e2e-layers.
 */

// WebKit does not focus a button on mouse click, so openers are activated from the keyboard to
// make "restore focus to the opener" meaningful in all three engines.
async function activate(page: Page, selector: string) {
  await page.locator(selector).focus();
  await page.keyboard.press('Enter');
}

async function gotoLayers(page: Page) {
  await page.goto('/e2e-layers', { waitUntil: 'commit' });
  await expect(page.locator('main[data-ready]')).toBeVisible();
}

const activeId = (page: Page) => page.evaluate(() => document.activeElement?.id ?? '');

test.describe('nested layers', () => {
  test.beforeEach(async ({ page }) => {
    await gotoLayers(page);
    await activate(page, '#open-a');
    await expect(page.locator('#dialog-a-content')).toBeVisible();
  });

  test('Tab stays inside the topmost dialog and the lower dialog does not compete', async ({
    page,
  }) => {
    await activate(page, '#open-b');
    await expect(page.locator('#dialog-b-content')).toBeVisible();
    await expect.poll(() => activeId(page)).toBe('b-first');

    // Walk more steps than there are controls in both dialogs.
    const visited = new Set<string>();
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      visited.add(await activeId(page));
    }
    expect([...visited].every((id) => id.startsWith('b-') || id === 'popup-trigger')).toBe(true);
    expect(visited.has('a-first')).toBe(false);

    await page.keyboard.press('Shift+Tab');
    expect(
      (await activeId(page)).startsWith('b-') || (await activeId(page)) === 'popup-trigger',
    ).toBe(true);
  });

  test('Escape closes only the topmost dialog and focus returns into A, then to the opener', async ({
    page,
  }) => {
    await activate(page, '#open-b');
    await expect(page.locator('#dialog-b-content')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#dialog-b-content')).toHaveCount(0);
    await expect(page.locator('#dialog-a-content')).toBeVisible();
    await expect.poll(() => activeId(page)).toBe('open-b');
    await expect(page.locator('#dialog-log')).toHaveText('B-closed;');

    await page.keyboard.press('Escape');
    await expect(page.locator('#dialog-a-content')).toHaveCount(0);
    await expect.poll(() => activeId(page)).toBe('open-a');
    await expect(page.locator('#dialog-log')).toHaveText('B-closed;A-closed;');
  });

  test('a popup opened from B closes first on Escape; B and A stay open', async ({ page }) => {
    await activate(page, '#open-b');
    await page.locator('#popup-trigger').click();
    await expect(page.locator('#popup-content')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#popup-content')).toHaveCount(0);
    await expect(page.locator('#dialog-b-content')).toBeVisible();
    await expect(page.locator('#dialog-a-content')).toBeVisible();
    await expect(page.locator('#dialog-log')).toHaveText('');
  });

  test('clicking inside B while its popup is open closes only the popup', async ({ page }) => {
    await activate(page, '#open-b');
    await page.locator('#popup-trigger').click();
    await expect(page.locator('#popup-content')).toBeVisible();

    await page.locator('#b-last').click();
    await expect(page.locator('#popup-content')).toHaveCount(0);
    await expect(page.locator('#dialog-b-content')).toBeVisible();
    await expect(page.locator('#dialog-a-content')).toBeVisible();
    await expect(page.locator('#dialog-log')).toHaveText('');
  });

  test('scroll lock is held until the last dialog closes', async ({ page }) => {
    await activate(page, '#open-b');
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  });
});

test.describe('overlay geometry', () => {
  const box = (page: Page, selector: string) => page.locator(selector).boundingBox();

  test('follows the anchor when it resizes, without an explicit updatePosition() call', async ({
    page,
  }) => {
    await gotoLayers(page);
    await page.locator('#geo-anchor').click();
    await expect(page.locator('#geo-content')).toBeVisible();

    // bottom-end: the overlay's right edge tracks the anchor's right edge.
    const rightEdges = async () => {
      const a = (await box(page, '#geo-anchor'))!;
      const o = (await box(page, '#geo-content'))!;
      return [Math.round(a.x + a.width), Math.round(o.x + o.width)];
    };
    await expect.poll(async () => (await rightEdges())[0] === (await rightEdges())[1]).toBe(true);
    const before = (await rightEdges())[0];

    await page.locator('#geo-grow').dispatchEvent('click');
    await expect.poll(async () => (await rightEdges())[0]).toBeGreaterThan(before);
    await expect.poll(async () => (await rightEdges())[0] === (await rightEdges())[1]).toBe(true);
    await expect(page.locator('#geo-content')).toBeVisible();
  });

  test('keeps aligned with the anchor after scrolling when closeOnScroll is false', async ({
    page,
  }) => {
    await gotoLayers(page);
    await page.locator('#geo-anchor').click();
    await expect(page.locator('#geo-content')).toBeVisible();
    await page.mouse.wheel(0, 120);
    await expect
      .poll(async () => {
        const a = (await box(page, '#geo-anchor'))!;
        const o = (await box(page, '#geo-content'))!;
        return Math.abs(o.y - (a.y + a.height)) < 8;
      })
      .toBe(true);
    await expect(page.locator('#geo-content')).toBeVisible();
  });

  test('clamps inside a narrow viewport after a resize', async ({ page }) => {
    await gotoLayers(page);
    await page.locator('#geo-anchor').click();
    await expect(page.locator('#geo-content')).toBeVisible();
    await page.setViewportSize({ width: 200, height: 600 });
    await expect
      .poll(async () => {
        const o = (await box(page, '#geo-content'))!;
        return o.x >= 0 && o.x + o.width <= 200;
      })
      .toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#geo-content')).toHaveCount(0);
  });

  test('closes when the anchor leaves the document, and destroying an open trigger closes it once', async ({
    page,
  }) => {
    await gotoLayers(page);
    await page.locator('#doomed-anchor').click();
    await expect(page.locator('#geo-content')).toBeVisible();
    await page.locator('#geo-remove-anchor').dispatchEvent('click');
    await expect(page.locator('#geo-content')).toHaveCount(0);
    await expect(page.locator('[data-qz-overlay-container] > *')).toHaveCount(0);
    // Host teardown destroys the overlay view first, so `closed` emits exactly once.
    await expect(page.locator('#doomed-closed')).toHaveText('1');
  });
});

test.describe('viewport', () => {
  test('height-only resizes are observed', async ({ page }) => {
    await gotoLayers(page);
    await page.setViewportSize({ width: 900, height: 500 });
    await expect(page.locator('#viewport-size')).toHaveText('900x500');
    await page.setViewportSize({ width: 900, height: 420 });
    await expect(page.locator('#viewport-size')).toHaveText('900x420');
  });
});

test.describe('collection recovery', () => {
  test('removing the active item activates its neighbour and keeps keyboard navigation working', async ({
    page,
  }) => {
    await gotoLayers(page);
    await page.locator('#col-one').focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#col-active')).toHaveText('two');

    await page.locator('#col-remove-active').dispatchEvent('click');
    await expect(page.locator('#col-active')).toHaveText('three');
    await expect(page.locator('#col-three')).toHaveAttribute('tabindex', '0');
    await expect(page.locator('#col-one')).toHaveAttribute('tabindex', '-1');

    await page.locator('#col-three').focus();
    await page.keyboard.press('End');
    await expect(page.locator('#col-active')).toHaveText('four');
    await page.locator('#col-remove-active').dispatchEvent('click');
    await expect(page.locator('#col-active')).toHaveText('three');
  });
});
