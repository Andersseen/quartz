import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Real-browser checks for the Quartz 0.8 floating-surface contracts: modal isolation, Dialog ↔
 * Menu / Popover / Select / Dialog composition, Escape and outside-pointer ownership, focus
 * restoration, cleanup and Toast/Tooltip interplay. Runs against /e2e-floating.
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
const inInert = (page: Page, selector: string) =>
  page.evaluate(
    (sel) => !!document.querySelector(sel)?.closest('[inert], [aria-hidden="true"]'),
    selector,
  );
const isInert = (page: Page, selector: string) =>
  page.evaluate(
    (sel) => (document.querySelector(sel) as HTMLElement | null)?.inert ?? false,
    selector,
  );
const residue = (page: Page) =>
  page.evaluate(() => ({
    backdrops: document.querySelectorAll('[data-qz-dialog-backdrop]').length,
    wrappers: document.querySelectorAll('[data-qz-dialog-wrapper]').length,
    overlays: document.querySelectorAll('[data-qz-overlay-container] > *').length,
    inert: Array.from(document.querySelectorAll('[inert]')).map((el) => el.id),
    ariaHidden: Array.from(document.querySelectorAll('[aria-hidden="true"]')).map((el) => el.id),
    overflow: document.body.style.overflow,
  }));

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e-floating', { waitUntil: 'commit' });
  await expect(page.locator('main[data-ready]')).toBeVisible();
  await expect(page.locator('#open-x')).toBeVisible();
});

test.describe('modal isolation', () => {
  test('isolates the background, keeps the dialog live and restores original state on close', async ({
    page,
  }) => {
    await activate(page, '#open-x');
    await expect(page.locator('#x-content')).toBeVisible();

    await expect.poll(() => isInert(page, '#app')).toBe(true);
    expect(await inInert(page, '#x-content')).toBe(false);
    expect(await inInert(page, '[data-qz-dialog-wrapper]')).toBe(false);

    // Background focus is unavailable and the backdrop receives the pointer.
    await page.evaluate(() => document.getElementById('bg-input')?.focus());
    expect(await activeId(page)).not.toBe('bg-input');
    const topmost = await page.evaluate(() => {
      const rect = document.getElementById('bg-button')!.getBoundingClientRect();
      return document
        .elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
        ?.hasAttribute('data-qz-dialog-backdrop');
    });
    expect(topmost).toBe(true);

    await page.keyboard.press('Escape');
    await expect(page.locator('#x-content')).toHaveCount(0);

    const state = await residue(page);
    expect(state).toEqual({
      backdrops: 0,
      wrappers: 0,
      overlays: 0,
      inert: ['pre-inert'],
      ariaHidden: ['pre-hidden'],
      overflow: '',
    });
    expect(await activeId(page)).toBe('open-x');
    await page.locator('#bg-button').click();
    await expect(page.locator('#bg-clicks')).toHaveText('1');
  });

  test('an overlay that was already open is isolated, one opened from the dialog is not', async ({
    page,
  }) => {
    await activate(page, '#bg-pop-trigger');
    await expect(page.locator('#bg-pop-content')).toBeVisible();

    await activate(page, '#open-x');
    await expect(page.locator('#x-content')).toBeVisible();
    expect(await inInert(page, '#bg-pop-content')).toBe(true);
    await expect(page.locator('#bg-pop-content')).toBeVisible();

    await activate(page, '#x-menu-trigger');
    await expect(page.locator('#x-menu')).toBeVisible();
    expect(await inInert(page, '#x-menu')).toBe(false);

    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(page.locator('#x-content')).toHaveCount(0);
    expect(await inInert(page, '#bg-pop-content')).toBe(false);
    await expect(page.locator('#bg-pop-content')).toBeVisible();
  });

  test('keeps the scroll lock until the last dialog closes', async ({ page }) => {
    await activate(page, '#open-x');
    await activate(page, '#x-open-y');
    await expect(page.locator('#y-content')).toBeVisible();
    expect((await residue(page)).overflow).toBe('hidden');

    await page.keyboard.press('Escape');
    await expect(page.locator('#y-content')).toHaveCount(0);
    expect((await residue(page)).overflow).toBe('hidden');

    await page.keyboard.press('Escape');
    await expect(page.locator('#x-content')).toHaveCount(0);
    expect((await residue(page)).overflow).toBe('');
  });
});

test.describe('NavigationMenu composition', () => {
  test('a flyout inside Dialog is the Escape owner and restores focus without closing the Dialog', async ({
    page,
  }) => {
    await activate(page, '#open-x');
    await expect(page.locator('#x-content')).toBeVisible();
    await activate(page, '#x-navigation-trigger');
    await expect(page.locator('#x-navigation-link')).toBeVisible();
    expect(await inInert(page, '#x-navigation-link')).toBe(false);

    await page.keyboard.press('Escape');
    await expect(page.locator('#x-navigation-link')).toHaveCount(0);
    await expect(page.locator('#x-content')).toBeVisible();
    await expect(page.locator('#x-navigation-trigger')).toBeFocused();
  });
});

test.describe('Dialog → floating surface', () => {
  test.beforeEach(async ({ page }) => {
    await activate(page, '#open-x');
    await expect(page.locator('#x-content')).toBeVisible();
  });

  test('Menu: interactive inside the modal, Escape closes only the menu and returns focus', async ({
    page,
  }) => {
    await activate(page, '#x-menu-trigger');
    await expect(page.locator('#x-menu')).toBeVisible();
    await expect.poll(() => activeText(page)).toBe('One');
    await expect(page.locator('#x-menu-trigger')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#x-menu-trigger')).toHaveAttribute('aria-controls', 'x-menu');

    await page.keyboard.press('Escape');
    await expect(page.locator('#x-menu')).toHaveCount(0);
    await expect(page.locator('#x-content')).toBeVisible();
    await expect.poll(() => activeId(page)).toBe('x-menu-trigger');
    await expect(page.locator('#x-menu-trigger')).not.toHaveAttribute('aria-controls');
    await expect(page.locator('#closed')).toHaveText('');
  });

  test('Menu: selecting an item closes the menu and keeps the dialog open', async ({ page }) => {
    await activate(page, '#x-menu-trigger');
    await expect.poll(() => activeText(page)).toBe('One');
    await page.keyboard.press('Enter');

    await expect(page.locator('#x-menu')).toHaveCount(0);
    await expect(page.locator('#state')).toHaveText('x-menu-item-1');
    await expect(page.locator('#x-content')).toBeVisible();
    await expect.poll(() => activeId(page)).toBe('x-menu-trigger');
  });

  test('Menu: an outside pointer closes only the menu; the next one closes the dialog', async ({
    page,
  }) => {
    await activate(page, '#x-menu-trigger');
    await expect(page.locator('#x-menu')).toBeVisible();

    await page.mouse.click(2, 2); // backdrop
    await expect(page.locator('#x-menu')).toHaveCount(0);
    await expect(page.locator('#x-content')).toBeVisible();
    await expect(page.locator('#closed')).toHaveText('');

    await page.mouse.click(2, 2);
    await expect(page.locator('#x-content')).toHaveCount(0);
    await expect(page.locator('#closed')).toHaveText('X;');
  });

  test('Menu: Tab leaves the menu, closes it and keeps the dialog open', async ({ page }) => {
    await activate(page, '#x-menu-trigger');
    await expect(page.locator('#x-menu')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator('#x-menu')).toHaveCount(0);
    await expect(page.locator('#x-content')).toBeVisible();
    await expect(page.locator('#closed')).toHaveText('');
  });

  test('Popover: Escape closes only the popover; inside click keeps it, dialog click closes it', async ({
    page,
  }) => {
    await activate(page, '#x-pop-trigger');
    await expect(page.locator('#x-pop-content')).toBeVisible();
    expect(await inInert(page, '#x-pop-content')).toBe(false);
    await expect(page.locator('#x-pop-trigger')).toHaveAttribute('aria-expanded', 'true');
    const controls = await page.locator('#x-pop-trigger').getAttribute('aria-controls');
    expect(await page.locator(`[id="${controls}"]`).count()).toBe(1);

    await page.locator('#x-pop-inside').click();
    await expect(page.locator('#x-pop-content')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#x-pop-content')).toHaveCount(0);
    await expect(page.locator('#x-content')).toBeVisible();
    await expect.poll(() => activeId(page)).toBe('x-pop-trigger');

    await activate(page, '#x-pop-trigger');
    await expect(page.locator('#x-pop-content')).toBeVisible();
    await page.locator('#x-first').click();
    await expect(page.locator('#x-pop-content')).toHaveCount(0);
    await expect(page.locator('#x-content')).toBeVisible();
  });

  test('Select: opens inside the modal, selects with the keyboard, Escape closes only the listbox', async ({
    page,
  }) => {
    await activate(page, '#x-select-trigger');
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('option', { name: 'Option A' })).toBeFocused();
    expect(await inInert(page, '[role="listbox"]')).toBe(false);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(page.locator('#x-select-trigger')).toHaveText(/[ab]/);
    await expect(page.locator('#x-content')).toBeVisible();
    await expect.poll(() => activeId(page)).toBe('x-select-trigger');

    await activate(page, '#x-select-trigger');
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(page.locator('#x-content')).toBeVisible();
  });

  test('Dialog → Dialog → Menu: layers close from the top down and isolation is restored per level', async ({
    page,
  }) => {
    await activate(page, '#x-open-y');
    await expect(page.locator('#y-content')).toBeVisible();
    await expect.poll(() => activeId(page)).toBe('y-first');
    expect(await inInert(page, '#x-content')).toBe(true);
    expect(await inInert(page, '#y-content')).toBe(false);

    await activate(page, '#y-menu-trigger');
    await expect(page.locator('#y-menu')).toBeVisible();
    expect(await inInert(page, '#y-menu')).toBe(false);

    await page.keyboard.press('Escape');
    await expect(page.locator('#y-menu')).toHaveCount(0);
    await expect(page.locator('#y-content')).toBeVisible();
    await expect(page.locator('#x-content')).toBeVisible();
    await expect.poll(() => activeId(page)).toBe('y-menu-trigger');

    await page.keyboard.press('Escape');
    await expect(page.locator('#y-content')).toHaveCount(0);
    await expect(page.locator('#x-content')).toBeVisible();
    await expect.poll(() => activeId(page)).toBe('x-open-y');
    expect(await inInert(page, '#x-content')).toBe(false);
    expect(await isInert(page, '#app')).toBe(true);

    await page.keyboard.press('Escape');
    await expect(page.locator('#x-content')).toHaveCount(0);
    await expect(page.locator('#closed')).toHaveText('Y;X;');
    expect(await isInert(page, '#app')).toBe(false);
    await expect.poll(() => activeId(page)).toBe('open-x');
  });

  test('destroying the host while a menu is open releases overlays, locks and isolation', async ({
    page,
  }) => {
    await activate(page, '#x-menu-trigger');
    await expect(page.locator('#x-menu')).toBeVisible();

    // Programmatic click: a real pointer would dismiss the menu first.
    await page.evaluate(() => document.getElementById('x-destroy-host')?.click());

    await expect(page.locator('#x-content')).toHaveCount(0);
    await expect(page.locator('#x-menu')).toHaveCount(0);
    await expect(page.locator('#closed')).toHaveText('X;');
    expect(await residue(page)).toEqual({
      backdrops: 0,
      wrappers: 0,
      overlays: 0,
      inert: ['pre-inert'],
      ariaHidden: ['pre-hidden'],
      overflow: '',
    });
  });

  test('ARIA: the dialog name and description resolve to existing elements', async ({ page }) => {
    const ids = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]')!;
      const labelledBy = dialog.getAttribute('aria-labelledby')!;
      return {
        modal: dialog.getAttribute('aria-modal'),
        label: document.getElementById(labelledBy)?.textContent,
        describedBy: dialog.getAttribute('aria-describedby'),
      };
    });
    expect(ids).toEqual({ modal: 'true', label: 'Dialog X', describedBy: null });
  });
});

test.describe('Toast', () => {
  test('a toast shown over a modal does not steal focus, close the dialog or become inert', async ({
    page,
  }) => {
    await activate(page, '#open-x');
    await activate(page, '#x-toast');

    const toast = page.getByRole('status').filter({ hasText: 'Saved' });
    await expect(toast).toBeVisible();
    expect(await inInert(page, '.qz-toast')).toBe(false);
    expect(await activeId(page)).toBe('x-toast');
    await expect(page.locator('#x-content')).toBeVisible();

    await toast.getByRole('button', { name: 'Close notification' }).click();
    await expect(toast).toHaveCount(0);
    await expect(page.locator('#x-content')).toBeVisible();
    await expect(page.locator('#closed')).toHaveText('');
  });

  test('empty toast regions never intercept pointer events', async ({ page }) => {
    const hit = await page.evaluate(() => {
      const el = document.elementFromPoint(window.innerWidth - 8, window.innerHeight - 8);
      return el?.closest('qz-toast-container') ? 'toast' : 'page';
    });
    expect(hit).toBe('page');
    await page.locator('#bg-button').click();
    await expect(page.locator('#bg-clicks')).toHaveText('1');
  });

  test('announces by severity and stays dismissible while hovered', async ({ page }) => {
    await page.locator('#bg-toast').click();
    const toast = page.getByRole('status').filter({ hasText: 'Background toast' });
    await expect(toast).toBeVisible();
    await toast.hover();
    await expect(toast).toBeVisible();
  });
});

test.describe('Tooltip', () => {
  test('keeps the consumer description, shows on focus and dismisses with Escape', async ({
    page,
  }) => {
    await page.locator('#tip-trigger').focus();
    const tip = page.getByRole('tooltip');
    await expect(tip).toHaveText('Tip text');
    const tipId = await tip.getAttribute('id');
    await expect(page.locator('#tip-trigger')).toHaveAttribute(
      'aria-describedby',
      `tip-help ${tipId}`,
    );

    await page.keyboard.press('Escape');
    await expect(tip).toHaveCount(0);
    await expect(page.locator('#tip-trigger')).toHaveAttribute('aria-describedby', 'tip-help');
    expect(await activeId(page)).toBe('tip-trigger');
  });

  test('stays while focus remains after the pointer leaves', async ({ page }) => {
    await page.locator('#tip-trigger').focus();
    await expect(page.getByRole('tooltip')).toBeVisible();
    await page.locator('#tip-trigger').hover();
    await page.mouse.move(2, 400);
    // The hide delay has elapsed once a later frame confirms the tooltip is still there.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          setTimeout(() => requestAnimationFrame(() => resolve()), 300),
        ),
    );
    await expect(page.getByRole('tooltip')).toBeVisible();
  });
});

test.describe('RTL submenu', () => {
  test('opens toward the inline-end side with ArrowLeft and returns with ArrowRight', async ({
    page,
  }) => {
    await activate(page, '#rtl-menu-trigger');
    await expect(page.locator('#rtl-menu')).toBeVisible();
    await expect.poll(() => activeText(page)).toBe('More');

    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#rtl-sub')).toBeVisible();
    await expect.poll(() => activeText(page)).toBe('Nested');
    const [parent, sub] = await Promise.all([
      page.locator('#rtl-menu').boundingBox(),
      page.locator('#rtl-sub').boundingBox(),
    ]);
    expect(sub!.x + sub!.width).toBeLessThanOrEqual(parent!.x + parent!.width);
    expect(sub!.x).toBeLessThan(parent!.x);

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#rtl-sub')).toHaveCount(0);
    await expect.poll(() => activeText(page)).toBe('More');

    await page.keyboard.press('Escape');
    await expect(page.locator('#rtl-menu')).toHaveCount(0);
    await expect.poll(() => activeId(page)).toBe('rtl-menu-trigger');
  });
});

test.describe('automated accessibility scan', () => {
  // A scanner finds only a subset of problems; this is a regression net, not certification.
  async function scan(page: Page, include: string) {
    const results = await new AxeBuilder({ page })
      .include(include)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    return results.violations.map(
      (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
    );
  }

  test('dialog with an open menu has no detectable violations', async ({ page }) => {
    await activate(page, '#open-x');
    await activate(page, '#x-menu-trigger');
    await expect(page.locator('#x-menu')).toBeVisible();
    expect(await scan(page, '[role="dialog"]')).toEqual([]);
    expect(await scan(page, '#x-menu')).toEqual([]);
  });

  test('dialog with an open listbox and a toast has no detectable violations', async ({ page }) => {
    await activate(page, '#open-x');
    await activate(page, '#x-toast');
    await expect(page.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();
    await activate(page, '#x-select-trigger');
    await expect(page.getByRole('listbox')).toBeVisible();
    expect(await scan(page, '[role="listbox"]')).toEqual([]);
    expect(await scan(page, '.qz-toast')).toEqual([]);
  });
});
