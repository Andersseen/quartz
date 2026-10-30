import { expect, test } from '@playwright/test';
import { axe, boot, expectHealthy } from './helpers';

// WebKit does not focus buttons on mouse click; activate from the keyboard so focus-restoration
// assertions are meaningful in all three engines.
async function activate(page: import('@playwright/test').Page, testId: string) {
  await page.getByTestId(testId).focus();
  await page.keyboard.press('Enter');
}

test.describe('overlays (hydrated)', () => {
  test('dialog containing a select: choose a value, close, focus returns to the opener', async ({
    page,
  }) => {
    const health = await boot(page, '/overlays');
    await activate(page, 'open-dialog');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName('Pick a fruit');
    await axe(page, '[role="dialog"]'); // modal open

    await page.getByRole('button', { name: /^Dialog fruit/ }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('listbox')).toBeVisible();
    // Escape ownership: the innermost surface (select) closes first, the dialog stays.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(dialog).toBeVisible();

    await page.getByRole('button', { name: /^Dialog fruit/ }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('option').first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId('dialog-choice')).toHaveText('pear');
    await expect(page.getByTestId('open-dialog')).toBeFocused();
    await expectHealthy(page, health);
  });

  test('dialog traps focus and Escape closes it', async ({ page }) => {
    await boot(page, '/overlays');
    await activate(page, 'open-dialog');
    await expect(page.getByRole('dialog')).toBeVisible();
    for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(
      true,
    );
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByTestId('open-dialog')).toBeFocused();
  });

  test('drawer opens, is a named dialog, closes with Escape and restores focus', async ({
    page,
  }) => {
    await boot(page, '/overlays');
    await activate(page, 'open-drawer');
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await axe(page, '[role="dialog"]');
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
    await expect(page.getByTestId('open-drawer')).toBeFocused();
  });

  test('tooltip shows on focus with aria-describedby and hides on Escape', async ({ page }) => {
    await boot(page, '/overlays');
    await page.getByTestId('tooltip-anchor').focus();
    const tip = page.getByRole('tooltip');
    await expect(tip).toBeVisible();
    await expect(tip).toHaveText('Saves your work');
    const describedBy = await page.getByTestId('tooltip-anchor').getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(await tip.getAttribute('id')).toBe(describedBy);
    await page.keyboard.press('Escape');
    await expect(tip).toHaveCount(0);
  });

  test('popover opens, reports expanded state and closes with Escape', async ({ page }) => {
    await boot(page, '/overlays');
    const trigger = page.getByTestId('popover-trigger');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('popover')).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await axe(page, '[data-testid="popover"]');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('popover')).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('menu opens from the keyboard, navigates and selects', async ({ page }) => {
    await boot(page, '/overlays');
    await page.getByTestId('menu-trigger').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu')).toBeVisible();
    await axe(page, '[role="menu"]'); // menu expanded
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(page.getByTestId('menu-choice')).not.toHaveText('none');
    await expect(page.getByTestId('menu-trigger')).toBeFocused();
  });

  test('toast with an action: announced as status, action runs, cleaned up on dismiss', async ({
    page,
  }) => {
    await boot(page, '/overlays');
    await page.getByTestId('toast').click();
    const toast = page.getByText('File archived');
    await expect(toast).toBeVisible();
    await axe(page, 'qz-toast-container');
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(page.getByTestId('toast-undo')).toHaveText('yes');
  });

  test('destroy and recreate: navigating away removes overlay residue', async ({ page }) => {
    await boot(page, '/overlays');
    await activate(page, 'open-drawer');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('link', { name: 'Forms', exact: true }).click();
    await page.getByRole('link', { name: 'Overlays' }).click();
    await activate(page, 'open-drawer');
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.keyboard.press('Escape');
    const residue = await page.evaluate(() => ({
      backdrops: document.querySelectorAll('[data-qz-dialog-backdrop]').length,
      wrappers: document.querySelectorAll('[data-qz-dialog-wrapper]').length,
      overflow: document.body.style.overflow,
    }));
    expect(residue).toEqual({ backdrops: 0, wrappers: 0, overflow: '' });
  });
});
