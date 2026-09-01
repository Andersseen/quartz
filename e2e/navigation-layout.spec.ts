import { expect, test } from '@playwright/test';

test.describe('Navigation and layout primitives', () => {
  test('sidebar supports push collapse and overlay dismissal', async ({ page }) => {
    await page.goto('/sidebar');
    await expect(page.getByRole('heading', { name: 'Sidebar', level: 1 })).toBeVisible();

    const push = page.locator('[data-qz-sidebar]').first();
    await expect(push).toHaveAttribute('data-qz-state', 'expanded');
    await page.getByRole('button', { name: 'Collapse' }).click();
    await expect(push).toHaveAttribute('data-qz-state', 'collapsed');
    await page.getByRole('button', { name: 'Toggle' }).first().click();
    await expect(push).toHaveAttribute('data-qz-state', 'closed');

    const overlay = page.locator('[data-qz-sidebar]').nth(1);
    await page.getByRole('button', { name: 'Open overlay' }).click();
    await expect(overlay).toHaveAttribute('data-qz-state', 'expanded');
    await page.keyboard.press('Escape');
    await expect(overlay).toHaveAttribute('data-qz-state', 'closed');
  });

  test('navbar toggles menu and exposes scroll hooks', async ({ page }) => {
    await page.goto('/navbar');
    await expect(page.getByRole('heading', { name: 'Navbar', level: 1 })).toBeVisible();

    const demo = page.locator('[preview]').first();
    const navbar = demo.locator('[data-qz-navbar]');
    await page.getByRole('button', { name: 'Menu' }).last().click();
    await expect(navbar).toHaveAttribute('data-qz-menu-open', '');
    await page.keyboard.press('Escape');
    await expect(navbar).not.toHaveAttribute('data-qz-menu-open', '');

    await demo.evaluate((element) => {
      element.scrollTop = 220;
      element.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    await expect(navbar).toHaveAttribute('data-qz-scrolled', '');
    await expect(navbar).toHaveAttribute('data-qz-sticky', '');
  });

  test('stepper blocks linear future steps until completion', async ({ page }) => {
    await page.goto('/stepper');
    await expect(page.getByRole('heading', { name: 'Stepper', level: 1 })).toBeVisible();

    const account = page.getByRole('button', { name: 'Account' }).last();
    const profile = page.getByRole('button', { name: 'Profile' });
    const billing = page.getByRole('button', { name: 'Billing' });

    await billing.click();
    await expect(account).toHaveAttribute('aria-current', 'step');
    await page.getByRole('button', { name: 'Mark complete' }).first().click();
    await profile.click();
    await expect(profile).toHaveAttribute('aria-current', 'step');
  });
});
