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
    await root.click();
    await expect(root).toHaveAttribute('tabindex', '0');

    // Expand root so there are children to navigate.
    await root.focus();
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
