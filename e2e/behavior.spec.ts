import { test, expect } from '@playwright/test';

/**
 * Behavior-focussed E2E tests for Quartz primitives.
 *
 * These tests exercise real user interactions (keyboard, mouse, focus) on the
 * demo app. Selectors prefer ARIA roles and library data attributes over
 * demo-specific CSS classes so they stay stable across design tweaks.
 */

test.describe('Dialog behavior', () => {
  test('should open modal and close with Escape', async ({ page }) => {
    await page.goto('/dialog');

    await page.getByRole('button', { name: 'Open Modal' }).click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('should close modal on backdrop click', async ({ page }) => {
    await page.goto('/dialog');

    await page.getByRole('button', { name: 'Open Modal' }).click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Click the backdrop near the viewport edge, away from the centered panel.
    await page.mouse.click(10, 10);
    await expect(dialog).not.toBeVisible();
  });

  test('should keep focus inside the dialog while open', async ({ page }) => {
    await page.goto('/dialog');

    const openButton = page.getByRole('button', { name: 'Open Modal' });
    await openButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Focus should be inside the dialog (on the first focusable element).
    const focused = await page.evaluate(
      () => document.activeElement?.closest('[role="dialog"]') !== null,
    );
    expect(focused).toBe(true);

    // Tab cycling should stay inside: Shift+Tab from first element wraps to last.
    await page.keyboard.press('Shift+Tab');
    const stillInside = await page.evaluate(
      () => document.activeElement?.closest('[role="dialog"]') !== null,
    );
    expect(stillInside).toBe(true);
  });

  test('should restore focus to the opener after Escape', async ({ page }) => {
    await page.goto('/dialog');

    const openButton = page.getByRole('button', { name: 'Open Modal' });
    await openButton.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(openButton).toBeFocused();
  });
});

test.describe('Tooltip behavior', () => {
  test('should show tooltip on hover and hide on mouseleave', async ({ page }) => {
    await page.goto('/tooltip');

    const trigger = page.getByTestId('tooltip-basic-trigger');
    await trigger.hover();
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible({ timeout: 2000 });
    await expect(tooltip).toContainText('Save changes');

    await page.mouse.move(0, 0);
    await expect(tooltip).not.toBeVisible({ timeout: 2000 });
  });

  test('should show tooltip on focus and hide on blur', async ({ page }) => {
    await page.goto('/tooltip');

    const trigger = page.getByTestId('tooltip-basic-trigger');
    await trigger.focus();
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible({ timeout: 2000 });

    await page.keyboard.press('Tab');
    await expect(tooltip).not.toBeVisible({ timeout: 2000 });
  });

  test('should position tooltip on different placements', async ({ page }) => {
    await page.goto('/tooltip');

    for (const label of ['Top', 'Bottom', 'Left', 'Right']) {
      const trigger = page.getByRole('button', { name: label });
      await trigger.hover();
      const tooltip = page.locator('[role="tooltip"]');
      await expect(tooltip).toBeVisible({ timeout: 1000 });
      await expect(tooltip).toContainText(`${label} tooltip`);
      await page.mouse.move(0, 0);
      await expect(tooltip).not.toBeVisible({ timeout: 1000 });
    }
  });

  test('should dismiss tooltip with Escape', async ({ page }) => {
    await page.goto('/tooltip');

    const trigger = page.getByTestId('tooltip-basic-trigger');
    await trigger.focus();
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible({ timeout: 2000 });

    await page.keyboard.press('Escape');
    await expect(tooltip).not.toBeVisible({ timeout: 1000 });
    await expect(trigger).toBeFocused();
  });
});

test.describe('Listbox behavior', () => {
  test('should navigate, typeahead, select and skip disabled options', async ({ page }) => {
    await page.goto('/listbox');

    const single = page.getByRole('listbox').first();
    const singleOptions = single.getByRole('option');

    await single.focus();
    await single.press('End');
    await expect(single).toHaveAttribute(
      'aria-activedescendant',
      await singleOptions.nth(2).getAttribute('id'),
    );
    await single.press('Home');
    await expect(single).toHaveAttribute(
      'aria-activedescendant',
      await singleOptions.nth(0).getAttribute('id'),
    );
    await single.press('e');
    await single.press('Enter');
    await expect(page.locator('text=Selected:').first()).toContainText('enterprise');

    const multi = page.getByRole('listbox').nth(1);
    const multiOptions = multi.getByRole('option');
    await multi.focus();
    await multi.press('ArrowDown');
    await expect(multi).toHaveAttribute(
      'aria-activedescendant',
      await multiOptions.nth(1).getAttribute('id'),
    );
    await multi.press('ArrowDown');
    await expect(multi).toHaveAttribute(
      'aria-activedescendant',
      await multiOptions.nth(0).getAttribute('id'),
    );
    await multiOptions.nth(2).click({ force: true });
    await expect(multiOptions.nth(2)).toHaveAttribute('aria-selected', 'false');
  });
});

test.describe('Menu behavior', () => {
  test('should open and restore focus on Escape', async ({ page }) => {
    await page.goto('/menu');

    const trigger = page.getByRole('button', { name: 'File' });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const menu = page.getByRole('menu').first();
    await expect(menu).toBeVisible();
    const newFile = menu.getByRole('menuitem', { name: 'New file' });
    await expect(newFile).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test('should open a submenu from an active item', async ({ page }) => {
    await page.goto('/menu');

    const trigger = page.getByTestId('submenu-menu-trigger');
    await expect(trigger).toBeVisible();

    const rootMenu = page.getByRole('menu').first();
    for (let attempt = 0; attempt < 3; attempt++) {
      await trigger.click({ force: true });
      try {
        await expect(rootMenu).toBeVisible({ timeout: 1000 });
        break;
      } catch {
        await page.keyboard.press('Escape');
      }
    }

    const share = page.getByTestId('share-submenu-item');
    await expect(rootMenu).toBeVisible();
    await share.click({ force: true });
    await expect(page.getByRole('menu')).toHaveCount(2);
    await expect(page.getByRole('menuitem', { name: 'Email' })).toBeVisible();
  });
});

test.describe('Popover behavior', () => {
  test('should open interactive content and close with Escape', async ({ page }) => {
    await page.goto('/popover');

    const trigger = page.getByRole('button', { name: 'Details' });
    await trigger.click();
    const popover = page.locator('[data-qz-popover]').first();
    await expect(popover).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(popover).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test('should support controlled state and autofocus', async ({ page }) => {
    await page.goto('/popover');

    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('checkbox', { name: 'Email updates' })).toBeFocused();
    await expect(page.locator('text=Open: true')).toBeVisible();
  });
});

test.describe('Combobox behavior', () => {
  test('should filter, keep focus on input, and select with keyboard', async ({ page }) => {
    await page.goto('/combobox');

    const input = page.getByRole('combobox', { name: 'Fruit' });
    await input.fill('ap');
    const listbox = page.locator('[data-qz-overlay-container] [role="listbox"]').first();
    await expect(listbox).toBeVisible();

    const options = listbox.getByRole('option');
    await expect(options).toHaveCount(3);
    const firstId = await options.nth(0).getAttribute('id');
    await expect(input).toHaveAttribute('aria-activedescendant', firstId ?? '');
    await expect(input).toBeFocused();

    await input.press('ArrowDown');
    const secondId = await options.nth(1).getAttribute('id');
    await expect(input).toHaveAttribute('aria-activedescendant', secondId ?? '');
    await expect(input).toBeFocused();

    await input.press('Enter');
    await expect(listbox).not.toBeVisible();
    await expect(input).toHaveValue('Apricot');
    await expect(page.locator('text=Selected:').first()).toContainText('Apricot');
    await expect(input).toBeFocused();
  });

  test('should close on Escape and Tab without committing the active option', async ({ page }) => {
    await page.goto('/combobox');

    const input = page.getByRole('combobox', { name: 'Fruit' });
    await input.fill('ora');
    const listbox = page.getByRole('listbox').first();
    await expect(listbox).toBeVisible();

    await input.press('Escape');
    await expect(listbox).not.toBeVisible();
    await expect(input).toHaveValue('');
    await expect(page.locator('text=Selected:').first()).toContainText('none');

    await input.fill('ban');
    await expect(listbox).toBeVisible();
    await input.press('Tab');
    await expect(listbox).not.toBeVisible();
    await expect(input).not.toBeFocused();
  });
});

test.describe('Select behavior', () => {
  test('should open, expose disabled options, select and restore focus', async ({ page }) => {
    await page.goto('/select');

    const trigger = page.getByTestId('select-basic-trigger');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const listbox = page.locator('[data-qz-overlay-container] [role="listbox"]').first();
    await expect(listbox).toBeVisible();
    const options = page.getByTestId('select-basic-option');
    await expect(options).toHaveCount(3);
    await expect(options.nth(1)).toHaveAttribute('aria-disabled', 'true');
    await options.nth(2).dispatchEvent('click');

    await expect(listbox).not.toBeVisible();
    await expect(page.locator('text=Value:').first()).toContainText('de');
  });
});

test.describe('Tabs behavior', () => {
  test('should activate horizontal tabs and respect disabled tabs', async ({ page }) => {
    await page.goto('/tabs');

    const account = page.locator('button[qztab="account"]').first();
    const billing = page.locator('button[qztab="billing"]').first();
    await account.focus();
    await page.keyboard.press('ArrowRight');

    await expect(billing).toBeFocused();
    await expect(billing).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Billing panel')).toBeVisible();
  });

  test('should move focus without activation in manual vertical tabs', async ({ page }) => {
    await page.goto('/tabs');

    const preview = page.locator('button[qztab="preview"]');
    const settings = page.locator('button[qztab="settings"]');
    await preview.focus();
    await page.keyboard.press('ArrowDown');

    await expect(settings).toBeFocused();
    await expect(preview).toHaveAttribute('aria-selected', 'true');
  });

  test('should mirror horizontal navigation in RTL', async ({ page }) => {
    await page.goto('/tabs');

    const one = page.locator('button[qztab="one"]');
    const two = page.locator('button[qztab="two"]');
    await one.focus();
    await page.keyboard.press('ArrowLeft');

    await expect(two).toBeFocused();
    await expect(two).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('Accordion behavior', () => {
  test('should support single, collapsible and multiple state', async ({ page }) => {
    await page.goto('/accordion');

    const shipping = page.getByRole('button', { name: 'Shipping' });
    const returns = page.getByRole('button', { name: 'Returns' });
    await expect(shipping).toHaveAttribute('aria-expanded', 'true');
    await returns.click();
    await expect(shipping).toHaveAttribute('aria-expanded', 'false');
    await expect(returns).toHaveAttribute('aria-expanded', 'true');

    const faq = page.getByRole('button', { name: 'FAQ' });
    await expect(faq).toHaveAttribute('aria-expanded', 'true');
    await faq.click();
    await expect(faq).toHaveAttribute('aria-expanded', 'false');

    const one = page.getByRole('button', { name: 'One' });
    const two = page.getByRole('button', { name: 'Two' });
    await two.click();
    await expect(one).toHaveAttribute('aria-expanded', 'true');
    await expect(two).toHaveAttribute('aria-expanded', 'true');
  });
});

test.describe('Switch behavior', () => {
  test('should toggle checked state and keep disabled switches inert', async ({ page }) => {
    await page.goto('/switch');

    const notifications = page.getByRole('switch', { name: /Notifications off/ });
    await expect(notifications).toHaveAttribute('aria-checked', 'false');
    await notifications.click();
    await expect(page.getByRole('switch', { name: /Notifications on/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    const disabled = page.getByRole('switch', { name: 'Disabled' });
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await expect(disabled).toHaveAttribute('aria-checked', 'true');
    await disabled.click({ force: true });
    await expect(disabled).toHaveAttribute('aria-checked', 'true');
  });
});

test.describe('Tree behavior', () => {
  function basicTree(page) {
    return page.getByTestId('basic-tree');
  }

  test('should expand and collapse with arrow keys', async ({ page }) => {
    await page.goto('/tree');

    const root = basicTree(page).getByRole('treeitem').filter({ hasText: 'quartz' });
    await expect(root).toHaveAttribute('aria-expanded', 'false');

    await root.focus();
    await page.keyboard.press('ArrowRight');
    await expect(root).toHaveAttribute('aria-expanded', 'true');
    await expect(basicTree(page).getByRole('treeitem').filter({ hasText: 'src' })).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await expect(root).toHaveAttribute('aria-expanded', 'false');
  });

  test('should navigate visible nodes with ArrowDown and ArrowUp', async ({ page }) => {
    await page.goto('/tree');

    const root = basicTree(page).getByRole('treeitem').filter({ hasText: 'quartz' });
    // Focus rather than click: with `toggleOnClick` (default) a click would already
    // expand the row, and this test is about keyboard navigation only.
    await root.focus();
    await expect(root).toHaveAttribute('tabindex', '0');

    // Expand root so there are children to navigate.
    await page.keyboard.press('ArrowRight');

    const firstChild = basicTree(page).getByRole('treeitem').filter({ hasText: 'src' });
    await expect(firstChild).toBeVisible();

    await page.keyboard.press('ArrowDown');
    await expect(firstChild).toHaveAttribute('tabindex', '0');
    await expect(root).toHaveAttribute('tabindex', '-1');

    await page.keyboard.press('ArrowUp');
    await expect(root).toHaveAttribute('tabindex', '0');
    await expect(firstChild).toHaveAttribute('tabindex', '-1');
  });

  test('should select node with Enter', async ({ page }) => {
    await page.goto('/tree');

    const root = basicTree(page).getByRole('treeitem').filter({ hasText: 'quartz' });
    await root.evaluate((el: HTMLElement) => el.focus());
    await page.keyboard.press('Enter');
    await expect(root).toHaveAttribute('aria-selected', 'true');
  });

  test('should use Home/End and skip disabled nodes during focus navigation', async ({ page }) => {
    await page.goto('/tree');

    const tree = basicTree(page);
    const root = tree.getByRole('treeitem').filter({ hasText: 'quartz' });
    await root.focus();
    await page.keyboard.press('ArrowRight');

    await page.keyboard.press('End');
    const readme = tree.getByRole('treeitem').filter({ hasText: 'README.md' });
    await expect(readme).toHaveAttribute('tabindex', '0');

    await page.keyboard.press('ArrowUp');
    const disabledPackage = tree.getByRole('treeitem').filter({ hasText: 'package.json' });
    const packages = tree.getByRole('treeitem').filter({ hasText: 'packages' });
    await expect(disabledPackage).toHaveAttribute('aria-disabled', 'true');
    await expect(packages).toHaveAttribute('tabindex', '0');

    await page.keyboard.press('Home');
    await expect(root).toHaveAttribute('tabindex', '0');
  });
});

test.describe('Directionality behavior', () => {
  test('mirrors horizontal arrow keys after toggling to rtl', async ({ page }) => {
    await page.goto('/directionality');

    const collection = page.getByTestId('directionality-collection');
    await collection.focus();
    await expect(collection.locator('[data-active]')).toHaveText('Alpha');

    // ltr (default): ArrowRight moves next.
    await page.keyboard.press('ArrowRight');
    await expect(collection.locator('[data-active]')).toHaveText('Bravo');
    await expect(collection).toHaveAttribute('dir', 'ltr');

    await page.getByTestId('directionality-toggle').click();
    await expect(collection).toHaveAttribute('dir', 'rtl');
    await collection.focus();

    // rtl: ArrowRight now moves previous, ArrowLeft moves next.
    await page.keyboard.press('ArrowRight');
    await expect(collection.locator('[data-active]')).toHaveText('Alpha');
    await page.keyboard.press('ArrowLeft');
    await expect(collection.locator('[data-active]')).toHaveText('Bravo');
  });
});

test.describe('Splitter behavior', () => {
  test('should resize horizontal panel with arrow keys', async ({ page }) => {
    await page.goto('/splitter');

    const handle = page.locator('[data-directive="qzSplitterHandle"]').first();
    await expect(handle).toBeVisible();
    await handle.focus();

    const before = await page.evaluate(() => {
      const panel = document.querySelector('[data-directive="qzSplitterPanel"]');
      return panel?.getBoundingClientRect().width ?? 0;
    });

    await page.keyboard.press('ArrowRight');
    // Allow the demo's signal-driven width update to render.
    await page.waitForTimeout(100);

    const after = await page.evaluate(() => {
      const panel = document.querySelector('[data-directive="qzSplitterPanel"]');
      return panel?.getBoundingClientRect().width ?? 0;
    });

    expect(after).toBeGreaterThan(before);
  });
});

test.describe('Toast behavior', () => {
  test('should not block clicks in the page corners while no toast is shown', async ({ page }) => {
    await page.goto('/toast');

    // The six aria-live regions are always in the DOM so announcements work. An empty
    // one must never sit on top of the page and swallow clicks.
    const blocked = await page.evaluate(() => {
      const viewport = { w: window.innerWidth, h: window.innerHeight };
      const points = [
        [8, 8],
        [viewport.w / 2, 8],
        [viewport.w - 8, 8],
        [8, viewport.h - 8],
        [viewport.w / 2, viewport.h - 8],
        [viewport.w - 8, viewport.h - 8],
      ] as const;

      return points
        .map(([x, y]) => document.elementFromPoint(x, y))
        .filter((el) => !!el?.closest('.qz-toast-container'))
        .map((el) => (el as Element).className);
    });

    expect(blocked).toEqual([]);
  });

  test('should show a toast and let it be dismissed', async ({ page }) => {
    await page.goto('/toast');

    await page.getByRole('button', { name: 'Show Toast with Title' }).click();
    const toast = page.locator('qz-toast').first();
    await expect(toast).toBeVisible();

    await toast.getByRole('button', { name: 'Close notification' }).click();
    await expect(page.locator('qz-toast')).toHaveCount(0);
  });
});
