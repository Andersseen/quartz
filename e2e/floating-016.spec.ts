import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Real-browser checks for Quartz 0.16: Drawer, Resizable (Core Splitter), Tooltip / Popover arrow
 * geometry and Menu groups. Runs against /e2e-floating-016 with real pointer and keyboard input.
 */

// WebKit does not focus a button on mouse click, so controls are activated from the keyboard to
// keep "restore focus to the opener" meaningful in all three engines.
async function activate(page: Page, selector: string) {
  await page.locator(selector).focus();
  await page.keyboard.press('Enter');
}

const activeId = (page: Page) => page.evaluate(() => document.activeElement?.id ?? '');
const activeText = (page: Page) =>
  page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');
const residue = (page: Page) =>
  page.evaluate(() => ({
    backdrops: document.querySelectorAll('[data-qz-dialog-backdrop]').length,
    wrappers: document.querySelectorAll('[data-qz-dialog-wrapper]').length,
    inert: document.querySelectorAll('[inert]').length,
    overflow: document.body.style.overflow,
  }));

// A user's OS-level reduced-motion setting must not change what these tests observe.
test.use({ reducedMotion: 'no-preference' });

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e-floating-016', { waitUntil: 'commit' });
  await expect(page.locator('main[data-ready]')).toBeVisible();
});

test.describe('drawer', () => {
  for (const [side, expected] of [
    ['left', 'left'],
    ['right', 'right'],
    ['top', 'top'],
    ['bottom', 'bottom'],
  ] as const) {
    test(`anchors to the ${side} edge`, async ({ page }) => {
      await activate(page, `#open-${side}`);
      const drawer = page.locator('[data-qz-drawer]');
      await expect(drawer).toHaveAttribute('data-side', expected);
      await expect(drawer).toHaveAttribute('data-state', 'open');
      const box = (await drawer.boundingBox())!;
      const viewport = page.viewportSize()!;
      if (side === 'left') expect(Math.round(box.x)).toBe(0);
      if (side === 'right') expect(Math.round(box.x + box.width)).toBe(viewport.width);
      if (side === 'top') expect(Math.round(box.y)).toBe(0);
      if (side === 'bottom') expect(Math.round(box.y + box.height)).toBe(viewport.height);
    });
  }

  for (const [dir, start, end] of [
    ['ltr', 'left', 'right'],
    ['rtl', 'right', 'left'],
  ] as const) {
    test(`resolves inline-start/inline-end in ${dir}`, async ({ page }) => {
      if (dir === 'rtl') await page.locator('#toggle-dir').click();
      if (dir === 'rtl') await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      await activate(page, '#open-inline-start');
      await expect(page.locator('[data-qz-drawer]')).toHaveAttribute('data-side', start);
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-qz-drawer]')).toHaveCount(0);
      await activate(page, '#open-inline-end');
      await expect(page.locator('[data-qz-drawer]')).toHaveAttribute('data-side', end);
    });
  }

  test('is a labelled modal that traps Tab, closes on Escape and returns focus', async ({
    page,
  }) => {
    await activate(page, '#open-right');
    const drawer = page.locator('[data-qz-drawer]');
    await expect(drawer).toHaveAttribute('role', 'dialog');
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
    await expect(drawer).toHaveAttribute('aria-labelledby', /.+/);
    await expect
      .poll(() => page.evaluate(() => !!document.activeElement?.closest('[data-qz-drawer]')))
      .toBe(true);
    // Walk more steps than the drawer has controls: focus never leaves it.
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => !!document.activeElement?.closest('[data-qz-drawer]'))).toBe(
        true,
      );
    }
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
    await expect.poll(() => activeId(page)).toBe('open-right');
    expect(await residue(page)).toEqual({ backdrops: 0, wrappers: 0, inert: 0, overflow: '' });
  });

  test('keeps the background inert and scroll locked while open', async ({ page }) => {
    await activate(page, '#open-left');
    await expect(page.locator('[data-qz-drawer]')).toBeVisible();
    expect((await residue(page)).overflow).toBe('hidden');
    expect(
      await page.evaluate(() => !!document.getElementById('bg-input')?.closest('[inert]')),
    ).toBe(true);
  });

  test('honors closeOnEscape=false and closeOnBackdropClick=false', async ({ page }) => {
    await activate(page, '#open-no-esc');
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-qz-drawer]')).toBeVisible();
    await page.locator('#drawer-close').click();
    await expect(page.locator('[data-qz-drawer]')).toHaveCount(0);

    await activate(page, '#open-no-backdrop');
    await page.mouse.click(5, 5);
    await expect(page.locator('[data-qz-drawer]')).toBeVisible();
    await page.locator('#drawer-close').click();
  });

  test('backdrop click dismisses by default', async ({ page }) => {
    await activate(page, '#open-right');
    await expect(page.locator('[data-qz-drawer]')).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(page.locator('[data-qz-drawer]')).toHaveCount(0);
  });

  test('stays mounted as closing during the exit transition, then cleans up once', async ({
    page,
  }) => {
    await activate(page, '#open-slow');
    const drawer = page.locator('[data-qz-drawer]');
    await expect(drawer).toHaveAttribute('data-state', 'open');
    await page.locator('#drawer-close').click();
    await expect(drawer).toHaveAttribute('data-state', 'closing');
    // Locked and inert until the transition ended.
    expect((await residue(page)).overflow).toBe('hidden');
    await expect(drawer).toHaveCount(0);
    expect(await residue(page)).toEqual({ backdrops: 0, wrappers: 0, inert: 0, overflow: '' });
    await expect(page.locator('#drawer-log')).toHaveText('open:left;closed;');
  });

  test('prefers-reduced-motion removes it immediately, with no closing state', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await activate(page, '#open-slow');
    const drawer = page.locator('[data-qz-drawer]');
    await expect(drawer).toBeVisible();
    await page.locator('#drawer-close').click();
    await expect(drawer).toHaveCount(0);
    expect(await residue(page)).toEqual({ backdrops: 0, wrappers: 0, inert: 0, overflow: '' });
  });

  test('Escape in a nested popover closes only the popover, then the drawer', async ({ page }) => {
    await activate(page, '#open-right');
    await activate(page, '#drawer-pop-trigger');
    await expect(page.locator('#drawer-pop-content')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#drawer-pop-content')).toHaveCount(0);
    await expect(page.locator('[data-qz-drawer]')).toBeVisible();
    await expect.poll(() => activeId(page)).toBe('drawer-pop-trigger');
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-qz-drawer]')).toHaveCount(0);
  });

  test('destroying the host view while open tears everything down', async ({ page }) => {
    await activate(page, '#open-on-host');
    await expect(page.locator('[data-qz-drawer]')).toBeVisible();
    // The background is inert, so drive the host teardown programmatically.
    await page.evaluate(() => document.getElementById('kill-host')!.click());
    await expect(page.locator('[data-qz-drawer]')).toHaveCount(0);
    expect(await residue(page)).toEqual({ backdrops: 0, wrappers: 0, inert: 0, overflow: '' });
    await expect(page.locator('#drawer-log')).toHaveText('closed;');
  });

  test('has no axe violations while open', async ({ page }) => {
    await activate(page, '#open-right');
    await expect(page.locator('[data-qz-drawer]')).toHaveAttribute('data-state', 'open');
    const results = await new AxeBuilder({ page }).include('[data-qz-drawer]').analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('resizable', () => {
  const size = async (page: Page, sel: string) => (await page.locator(sel).boundingBox())!;

  test('horizontal: pointer drag moves the handle and the panels, clamped to bounds', async ({
    page,
  }) => {
    const handle = page.locator('#rz-h-handle');
    await expect(handle).toHaveAttribute('role', 'separator');
    await expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    await expect(handle).toHaveAttribute('aria-valuenow', '50');
    const box = (await size(page, '#rz-h'))!;
    const h = (await handle.boundingBox())!;
    await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
    await page.mouse.down();
    await expect(page.locator('#rz-h')).toHaveAttribute('data-qz-resizing', '');
    await page.mouse.move(box.x + box.width * 0.7, h.y + 5, { steps: 5 });
    await expect(handle).toHaveAttribute('aria-valuenow', '70');
    expect((await size(page, '#rz-h-a')).width).toBeCloseTo(box.width * 0.7, -1);
    await page.mouse.move(box.x + box.width * 0.99, h.y + 5, { steps: 5 });
    await expect(handle).toHaveAttribute('aria-valuenow', '80');
    await page.mouse.up();
    await expect(page.locator('#rz-h')).not.toHaveAttribute('data-qz-resizing', /.*/);
    // No stale drag: moving without a button down changes nothing.
    await page.mouse.move(box.x + 10, h.y + 5);
    await expect(handle).toHaveAttribute('aria-valuenow', '80');
  });

  test('horizontal: keyboard arrows, Home and End', async ({ page }) => {
    const handle = page.locator('#rz-h-handle');
    await handle.focus();
    await page.keyboard.press('ArrowRight');
    await expect(handle).toHaveAttribute('aria-valuenow', '60');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(handle).toHaveAttribute('aria-valuenow', '40');
    await page.keyboard.press('End');
    await expect(handle).toHaveAttribute('aria-valuenow', '80');
    await page.keyboard.press('ArrowRight');
    await expect(handle).toHaveAttribute('aria-valuenow', '80');
    await page.keyboard.press('Home');
    await expect(handle).toHaveAttribute('aria-valuenow', '20');
    const box = await size(page, '#rz-h');
    expect((await size(page, '#rz-h-a')).width).toBeCloseTo(box.width * 0.2, -1);
  });

  test('the handle stays in the Tab order', async ({ page }) => {
    await page.locator('#toggle-dir').focus();
    let reached = false;
    for (let i = 0; i < 12 && !reached; i++) {
      await page.keyboard.press('Tab');
      reached = (await activeId(page)) === 'rz-h-handle';
    }
    expect(reached).toBe(true);
  });

  test('vertical: arrows map to Up/Down and aria-orientation is horizontal', async ({ page }) => {
    const handle = page.locator('#rz-v-handle');
    await expect(handle).toHaveAttribute('aria-orientation', 'horizontal');
    await handle.focus();
    await page.keyboard.press('ArrowDown');
    await expect(handle).toHaveAttribute('aria-valuenow', '60');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(handle).toHaveAttribute('aria-valuenow', '40');
    await page.keyboard.press('ArrowLeft');
    await expect(handle).toHaveAttribute('aria-valuenow', '40');
    const box = await size(page, '#rz-v');
    expect((await size(page, '#rz-v-a')).height).toBeCloseTo(box.height * 0.4, -1);
  });

  test('vertical: pointer drag', async ({ page }) => {
    const handle = page.locator('#rz-v-handle');
    const box = await size(page, '#rz-v');
    const h = (await handle.boundingBox())!;
    await page.mouse.move(h.x + 5, h.y + h.height / 2);
    await page.mouse.down();
    await page.mouse.move(h.x + 5, box.y + box.height * 0.3, { steps: 5 });
    await page.mouse.up();
    await expect(handle).toHaveAttribute('aria-valuenow', '30');
  });

  test('RTL: the primary panel is on the right; arrows and drag mirror', async ({ page }) => {
    const handle = page.locator('#rz-rtl-handle');
    const box = await size(page, '#rz-rtl');
    const a = await size(page, '#rz-rtl-a');
    expect(a.x + a.width).toBeCloseTo(box.x + box.width, -1);
    await handle.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(handle).toHaveAttribute('aria-valuenow', '60');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(handle).toHaveAttribute('aria-valuenow', '40');

    const h = (await handle.boundingBox())!;
    await page.mouse.move(h.x + h.width / 2, h.y + 5);
    await page.mouse.down();
    // 70% from the RIGHT edge
    await page.mouse.move(box.x + box.width * 0.3, h.y + 5, { steps: 5 });
    await page.mouse.up();
    await expect(handle).toHaveAttribute('aria-valuenow', '70');
  });

  test('pointercancel ends the drag', async ({ page }) => {
    const handle = page.locator('#rz-h-handle');
    const h = (await handle.boundingBox())!;
    // Record the engine's real pointer id (Chromium/WebKit use 1, Firefox 0).
    await page.evaluate(() => {
      document
        .getElementById('rz-h-handle')!
        .addEventListener(
          'pointerdown',
          (e) => ((window as unknown as { __pid: number }).__pid = e.pointerId),
          { once: true },
        );
    });
    await page.mouse.move(h.x + h.width / 2, h.y + 5);
    await page.mouse.down();
    await expect(page.locator('#rz-h')).toHaveAttribute('data-qz-resizing', '');
    await page.evaluate(() => {
      const id = (window as unknown as { __pid: number }).__pid;
      document
        .getElementById('rz-h-handle')!
        .dispatchEvent(new PointerEvent('pointercancel', { pointerId: id, bubbles: true }));
    });
    await expect(page.locator('#rz-h')).not.toHaveAttribute('data-qz-resizing', /.*/);
    const before = await handle.getAttribute('aria-valuenow');
    await page.mouse.move(h.x + 80, h.y + 5, { steps: 3 });
    await expect(handle).toHaveAttribute('aria-valuenow', before!);
    await page.mouse.up();
  });

  test('has no axe violations', async ({ page }) => {
    const results = await new AxeBuilder({ page }).include('#rz-section').analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('tooltip arrow', () => {
  test('exposes geometry centered on the anchor, as data attributes and CSS variables', async ({
    page,
  }) => {
    await page.locator('#tip-anchor').scrollIntoViewIfNeeded();
    await page.locator('#tip-anchor').hover();
    const tip = page.locator('.qz-tooltip');
    await expect(tip).toBeVisible();
    await expect(tip).toHaveAttribute('data-side', 'top');
    await expect(tip).toHaveAttribute('data-placement', 'top');
    const geometry = await page.evaluate(() => {
      const tipEl = document.querySelector('.qz-tooltip') as HTMLElement;
      const anchor = document.getElementById('tip-anchor')!.getBoundingClientRect();
      const t = tipEl.getBoundingClientRect();
      return {
        arrowX: parseFloat(tipEl.style.getPropertyValue('--qz-arrow-x')),
        anchorCenter: anchor.left + anchor.width / 2,
        tipLeft: t.left,
      };
    });
    expect(geometry.arrowX + 5 + geometry.tipLeft).toBeCloseTo(geometry.anchorCenter, 0);
    await expect(page.locator('#tip-arrow-state')).toHaveText('true|top');
  });

  test('flips near the top edge and the arrow follows the resolved side', async ({ page }) => {
    await page.locator('#tip-anchor').evaluate((el) => {
      Object.assign(el.style, { position: 'fixed', top: '6px', left: '200px' });
    });
    await page.locator('#tip-anchor').hover();
    const tip = page.locator('.qz-tooltip');
    await expect(tip).toHaveAttribute('data-side', 'bottom');
    await expect(page.locator('#tip-arrow-state')).toHaveText('true|bottom');
  });

  test('re-measures when the anchor resizes', async ({ page }) => {
    await page.locator('#tip-anchor').scrollIntoViewIfNeeded();
    await page.locator('#tip-anchor').hover();
    const tip = page.locator('.qz-tooltip');
    await expect(tip).toBeVisible();
    const before = await tip.evaluate((el) => (el as HTMLElement).style.transform);
    await page.locator('#tip-wide').click({ force: true });
    await page.locator('#tip-anchor').hover();
    await expect
      .poll(() => tip.evaluate((el) => (el as HTMLElement).style.transform))
      .not.toBe(before);
  });

  test('keyboard focus shows it, Escape hides it, aria-describedby is wired and removed', async ({
    page,
  }) => {
    await page.locator('#tip-anchor').focus();
    const tip = page.locator('.qz-tooltip');
    await expect(tip).toBeVisible();
    await expect(page.locator('#tip-anchor')).toHaveAttribute('aria-describedby', /qz-tooltip-/);
    await page.keyboard.press('Escape');
    await expect(tip).toHaveCount(0);
    await expect(page.locator('#tip-anchor')).not.toHaveAttribute('aria-describedby', /.+/);
  });

  test('template content receives a reactive positioning context', async ({ page }) => {
    await page.locator('#tip-tpl-anchor').focus();
    await expect(page.locator('#tip-tpl')).toBeVisible();
    await expect(page.locator('#tip-tpl')).toHaveAttribute('data-ctx', /top|bottom/);
    await expect(page.locator('#tip-tpl')).toHaveAttribute('role', 'tooltip');
    await expect(page.locator('#tip-tpl-arrow')).toBeVisible();
  });

  test('has no axe violations while open', async ({ page }) => {
    await page.locator('#tip-anchor').focus();
    await expect(page.locator('.qz-tooltip')).toBeVisible();
    const results = await new AxeBuilder({ page }).include('#tip-section').analyze();
    expect(results.violations).toEqual([]);
  });

  test('a tooltip without an arrow size adds no arrow data', async ({ page }) => {
    await page.locator('#tip-plain').focus();
    const tip = page.locator('.qz-tooltip');
    await expect(tip).toBeVisible();
    await expect(tip).not.toHaveAttribute('data-side', /.*/);
  });
});

test.describe('popover arrow', () => {
  test('arrow follows the surface, aria-expanded and aria-controls stay in sync', async ({
    page,
  }) => {
    const trigger = page.locator('#pop-trigger');
    await trigger.scrollIntoViewIfNeeded();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await activate(page, '#pop-trigger');
    const panel = page.locator('#pop-content');
    await expect(panel).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('aria-controls', /.+/);
    await expect(page.locator('#pop-arrow')).toBeVisible();
    const delta = await page.evaluate(() => {
      const arrow = document.getElementById('pop-arrow')!.getBoundingClientRect();
      const anchor = document.getElementById('pop-trigger')!.getBoundingClientRect();
      return arrow.left + arrow.width / 2 - (anchor.left + anchor.width / 2);
    });
    expect(Math.abs(delta)).toBeLessThanOrEqual(1.5);
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).not.toHaveAttribute('aria-controls', /.+/);
    await expect.poll(() => activeId(page)).toBe('pop-trigger');
  });

  test('reports the flipped placement and puts the arrow on the facing edge', async ({ page }) => {
    await page.locator('#pop-trigger').evaluate((el) => {
      Object.assign(el.style, {
        position: 'fixed',
        top: `${window.innerHeight - 30}px`,
        left: '200px',
      });
    });
    await activate(page, '#pop-trigger');
    await expect(page.locator('#pop-content')).toBeVisible();
    await expect(page.locator('#pop-content')).toHaveAttribute('data-side', 'top');
    await expect(page.locator('#pop-ctx')).toHaveText('top');
    await expect(page.locator('#pop-state')).toHaveText('true|top');
  });

  test('RTL: bottom-start resolves to a physical bottom-end', async ({ page }) => {
    await page.locator('#pop-dir').click();
    await page.locator('#pop-place').click();
    await page.locator('#pop-trigger').scrollIntoViewIfNeeded();
    await activate(page, '#pop-trigger');
    await expect(page.locator('#pop-content')).toBeVisible();
    await expect(page.locator('#pop-content')).toHaveAttribute('data-placement', 'bottom-end');
    await expect(page.locator('#pop-arrow')).toBeVisible();
  });

  test('has no axe violations while open', async ({ page }) => {
    await page.locator('#pop-trigger').scrollIntoViewIfNeeded();
    await activate(page, '#pop-trigger');
    await expect(page.locator('#pop-content')).toBeVisible();
    const results = await new AxeBuilder({ page }).include('#pop-content').analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('menu groups', () => {
  async function openMenu(page: Page) {
    await page.locator('#grp-trigger').scrollIntoViewIfNeeded();
    await activate(page, '#grp-trigger');
    await expect(page.locator('#grp-menu')).toBeVisible();
    // Keyboard input only reaches the menu once focus moved into it and the open-time focus
    // frames have run (two animation frames, not a timeout).
    await expect
      .poll(() => page.evaluate(() => !!document.activeElement?.closest('#grp-menu')))
      .toBe(true);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
  }

  test('groups are labelled, separators have roles', async ({ page }) => {
    await openMenu(page);
    await expect(page.locator('#grp-account')).toHaveAttribute('role', 'group');
    await expect(page.locator('#grp-account')).toHaveAttribute(
      'aria-labelledby',
      'grp-account-label',
    );
    await expect(page.locator('#grp-sep')).toHaveAttribute('role', 'separator');
    await expect(page.getByRole('group', { name: 'Account' })).toBeVisible();
  });

  test('arrow keys skip labels, separators and disabled items; Home/End work', async ({ page }) => {
    await openMenu(page);
    await expect.poll(() => activeText(page)).not.toBe('');
    await page.keyboard.press('Home');
    await expect.poll(() => activeText(page)).toBe('Profile');
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => activeText(page)).toBe('Share');
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => activeText(page)).toBe('Sign out');
    await page.keyboard.press('End');
    await expect.poll(() => activeText(page)).toBe('Sign out');
    await page.keyboard.press('ArrowUp');
    await expect.poll(() => activeText(page)).toBe('Share');
  });

  test('submenu opens with the inline-end key and Escape closes one level at a time', async ({
    page,
  }) => {
    await openMenu(page);
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => activeText(page)).toBe('Share');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#grp-sub')).toBeVisible();
    await expect.poll(() => activeText(page)).toBe('Email');
    await page.keyboard.press('Escape');
    await expect(page.locator('#grp-sub')).toHaveCount(0);
    await expect(page.locator('#grp-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#grp-menu')).toHaveCount(0);
    await expect.poll(() => activeId(page)).toBe('grp-trigger');
  });

  test('has no axe violations with a named group, label, separator, disabled item and submenu', async ({
    page,
  }) => {
    await openMenu(page);
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#grp-sub')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .include('#grp-menu')
      .include('#grp-sub')
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test('SSR markup of the fixture is deterministic and free of overlay portals', async ({
  request,
}) => {
  const html = await (await request.get('/e2e-floating-016')).text();
  expect(html).toContain('Floating 0.16 fixture');
  expect(html).not.toContain('data-qz-dialog-wrapper');
  expect(html).not.toContain('data-qz-overlay-container');
  expect(html).toContain('role="separator"');
});
