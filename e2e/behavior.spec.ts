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
