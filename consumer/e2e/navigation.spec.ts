import { expect, test } from '@playwright/test';
import { axe, boot, expectHealthy } from './helpers';

test.describe('navigation (hydrated)', () => {
  test('tabs: arrows move and activate, only the active panel is exposed', async ({ page }) => {
    const health = await boot(page, '/navigation');
    const one = page.getByRole('tab', { name: 'One' });
    await one.focus();
    await expect(one).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowRight');
    const two = page.getByRole('tab', { name: 'Two' });
    await expect(two).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toHaveText('Panel two');
    await expectHealthy(page, health);
  });

  test('accordion: toggles with the keyboard, arrows rove, hidden panel is not exposed', async ({
    page,
  }) => {
    await boot(page, '/navigation');
    const account = page.getByRole('button', { name: 'Account' });
    const billing = page.getByRole('button', { name: 'Billing' });
    await expect(account).toHaveAttribute('aria-expanded', 'true');
    await expect(billing).toHaveAttribute('aria-expanded', 'false');
    await account.focus();
    await page.keyboard.press('ArrowDown');
    await expect(billing).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(billing).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('Billing settings')).toBeVisible();
    await expect(account).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByText('Account settings')).toBeHidden();
  });

  test('navigation menu: trigger expands and reveals its link', async ({ page }) => {
    await boot(page, '/navigation');
    const trigger = page.getByRole('button', { name: 'Products' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('link', { name: 'Browse' })).toBeVisible();
    await axe(page, 'nav[aria-label="Primary"]');
    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('sidebar: desktop open by default; mobile settles to off-canvas and Escape dismisses', async ({
    page,
  }) => {
    await boot(page, '/navigation');
    const sidebar = page.getByTestId('sidebar');
    await expect(sidebar).toHaveAttribute('data-qz-responsive', 'desktop');
    await expect(sidebar).toHaveAttribute('data-qz-open', '');

    await page.setViewportSize({ width: 420, height: 800 });
    await expect(sidebar).toHaveAttribute('data-qz-responsive', 'mobile');
    const trigger = page.getByTestId('sidebar-trigger');
    if ((await sidebar.getAttribute('data-qz-open')) === null) {
      await trigger.focus();
      await page.keyboard.press('Enter');
    }
    await expect(sidebar).toHaveAttribute('data-qz-open', '');
    await page.keyboard.press('Escape');
    await expect(sidebar).not.toHaveAttribute('data-qz-open', '');
    await expect(trigger).toBeFocused();
  });

  test('resizable separator: keyboard resizing updates aria-valuenow; pointer drag moves it', async ({
    page,
  }) => {
    await boot(page, '/navigation');
    const handle = page.getByTestId('handle');
    await expect(handle).toHaveAttribute('role', 'separator');
    await axe(page, '[data-testid="handle"]');
    const before = Number(await handle.getAttribute('aria-valuenow'));
    await handle.focus();
    await page.keyboard.press('ArrowRight');
    await expect
      .poll(async () => Number(await handle.getAttribute('aria-valuenow')))
      .toBeGreaterThan(before);
    const afterKey = Number(await handle.getAttribute('aria-valuenow'));
    const box = (await handle.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 80, box.y + box.height / 2, { steps: 6 });
    await page.mouse.up();
    await expect
      .poll(async () => Number(await handle.getAttribute('aria-valuenow')))
      .not.toBe(afterKey);
  });

  test('progress, meter and avatar expose their semantics', async ({ page }) => {
    await boot(page, '/navigation');
    await expect(page.getByRole('progressbar', { name: 'Download' })).toHaveAttribute(
      'aria-valuenow',
      '40',
    );
    await expect(page.getByRole('meter', { name: 'Storage' })).toHaveAttribute(
      'aria-valuenow',
      '72',
    );
    await expect(page.getByText('JD')).toBeVisible();
  });

  test('accessibility: navigation page has no axe violations', async ({ page }) => {
    await boot(page, '/navigation');
    await axe(page);
  });
});
