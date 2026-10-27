import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e-navigation');
  await expect(page.locator('#app[data-ready]')).toBeAttached();
});

test.describe('Toolbar', () => {
  test('horizontal navigation skips disabled items and focus does not activate controls', async ({
    page,
  }) => {
    const one = page.locator('#toolbar-one');
    const disabled = page.locator('#toolbar-disabled');
    const three = page.locator('#toolbar-three');
    await expect(one).toHaveAttribute('tabindex', '0');
    await expect(disabled).toHaveAttribute('tabindex', '-1');
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');

    await one.focus();
    await page.keyboard.press('ArrowRight');
    await expect(three).toBeFocused();
    await expect(page.locator('#toolbar-activations')).toHaveText('0');
    await page.keyboard.press('Home');
    await expect(one).toBeFocused();
    await page.keyboard.press('End');
    await expect(three).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.locator('#toolbar-activations')).toHaveText('1');
  });

  test('vertical, RTL, dynamic order and mixed native controls use their own keys', async ({
    page,
  }) => {
    await page.locator('#vertical-one').focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#vertical-two')).toBeFocused();

    await page.locator('#toolbar-dir-toggle').click();
    await page.locator('#toolbar-one').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#toolbar-three')).toBeFocused();

    await page.locator('#toolbar-dir-toggle').click();
    await page.locator('#toolbar-reorder').click();
    await page.locator('#toolbar-three').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#toolbar-one')).toBeFocused();

    const search = page.locator('#toolbar-search');
    await search.focus();
    await page.keyboard.press('ArrowRight');
    await expect(search).toBeFocused();
  });
});

test.describe('NavigationMenu', () => {
  test('opens by hover, keeps open across the trigger-panel gap, and closes after pointer exit', async ({
    page,
  }) => {
    const products = page.locator('#nav-products');
    const link = page.locator('#products-link');
    await products.hover();
    await expect(link).toBeVisible();
    await link.hover();
    await expect(link).toBeVisible();
    await page.locator('#outside-navigation').hover();
    await expect(link).toBeHidden();
  });

  test('rapid sibling hover switches the one active panel and disabled triggers are skipped', async ({
    page,
  }) => {
    const products = page.locator('#nav-products');
    const company = page.locator('#nav-company');
    await products.hover();
    await company.hover();
    await expect(page.locator('#company-link')).toBeVisible();
    await expect(page.locator('#products-link')).toHaveCount(0);

    await products.focus();
    await page.keyboard.press('ArrowRight');
    await expect(company).toBeFocused();
    await expect(page.locator('#nav-disabled')).toBeDisabled();
  });

  test('keyboard open, Escape return, Tab exit, RTL and outside dismissal work', async ({
    page,
  }) => {
    const products = page.locator('#nav-products');
    await products.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#products-link')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(products).toBeFocused();
    await expect(page.locator('#products-link')).toHaveCount(0);

    await page.locator('#navigation-rtl').click();
    await products.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#nav-company')).toBeFocused();

    await page.locator('#nav-company').click();
    await expect(page.locator('#company-link')).toBeVisible();
    await page.locator('#outside-navigation').click();
    await expect(page.locator('#company-link')).toHaveCount(0);
  });

  test('delayed hover uses current state and route destruction removes the portal', async ({
    page,
  }) => {
    await page.locator('#navigation-delay').click();
    await page.locator('#nav-products').hover();
    await page.locator('#nav-company').hover();
    await expect(page.locator('#company-link')).toBeVisible();
    await expect(page.locator('#products-link')).toHaveCount(0);

    await page.locator('#nav-company').hover();
    await page.keyboard.press('Escape');
    await page.goto('/docs/primitives/accordion');
    await expect(page.locator('[data-qz-overlay-container] > *')).toHaveCount(0);
  });

  test('open navigation content has no axe violations', async ({ page }) => {
    await page.locator('#nav-products').click();
    await expect(page.locator('#products-link')).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('Pagination', () => {
  test('first, previous, next, last and current-page semantics stay bounded', async ({ page }) => {
    const current = page.locator('#pagination [aria-current="page"]');
    await expect(current).toHaveAccessibleName('Page 2');
    await expect(page.getByRole('navigation', { name: 'Search results' })).toBeVisible();

    await page.getByRole('button', { name: 'First page' }).click();
    await expect(page.locator('#page-value')).toHaveText('1');
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await page.getByRole('button', { name: 'Last page' }).click();
    await expect(page.locator('#page-value')).toHaveText('3');
    await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled();
    await expect(page.locator('#pagination [aria-current="page"]')).toHaveAccessibleName('Page 3');
    await expect(page.locator('#pagination [aria-current="page"]')).toHaveCount(1);
  });

  test('dynamic pageCount clamps state and boundary focus recovers to current page', async ({
    page,
  }) => {
    await page.locator('#page-count-decrease').click();
    await expect(page.locator('#page-value')).toHaveText('2');
    await page.locator('#page-count-decrease').click();
    await expect(page.locator('#page-value')).toHaveText('1');

    await page.locator('#page-count-increase').click();
    await page.locator('#page-count-increase').click();
    await page.getByRole('button', { name: 'Next page' }).click();
    await page.getByRole('button', { name: 'Next page' }).focus();
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByRole('button', { name: 'Page 3' })).toBeFocused();
  });

  test('keyboard activation and disabled state do not submit the surrounding form', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Next page' }).press('Enter');
    await expect(page.locator('#page-value')).toHaveText('3');
    await expect(page.locator('#form-submitted')).toHaveText('false');
    await page.locator('#pagination-disable').click();
    for (const button of await page.locator('#pagination button').all()) {
      await expect(button).toBeDisabled();
    }
  });
});

test.describe('Accordion and Sidebar', () => {
  test('Accordion horizontal RTL focus, container disabled and required-open semantics', async ({
    page,
  }) => {
    const account = page.getByRole('button', { name: 'Account' });
    const privacy = page.getByRole('button', { name: 'Privacy' });
    await expect(account).toHaveAttribute('aria-disabled', 'true');
    await expect(account).not.toHaveAttribute('disabled', '');
    await page.locator('#accordion-horizontal').click();
    await page.locator('#accordion-rtl').click();
    await expect(page.locator('#accordion')).toHaveAttribute('data-qz-orientation', 'horizontal');
    await expect(page.locator('#accordion')).toHaveAttribute('dir', 'rtl');
    await account.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(privacy).toBeFocused();
    await expect(account).toHaveAttribute('aria-expanded', 'true');
    await expect(privacy).toHaveAttribute('aria-expanded', 'false');
    await page.locator('#accordion-disabled').click();
    await expect(account).toBeDisabled();
  });

  test('Sidebar desktop collapsed rail stays distinct from closed mobile drawer', async ({
    page,
  }) => {
    await page.locator('#sidebar-collapse').click();
    await expect(page.locator('#sidebar')).toHaveAttribute('data-qz-state', 'collapsed');
    await expect(page.locator('#sidebar')).toHaveAttribute('data-qz-open', '');
    await page.setViewportSize({ width: 500, height: 800 });
    await expect(page.locator('#sidebar')).toHaveAttribute('data-qz-state', 'closed');
    await page.locator('#sidebar-trigger').click();
    await expect(page.locator('#sidebar')).toHaveAttribute('data-qz-mode', 'overlay');
    await expect(page.locator('[qzSidebarPanel]')).toHaveCSS('position', 'fixed');
  });

  test('Sidebar mobile Escape restores focus and releases scroll lock', async ({ page }) => {
    await page.setViewportSize({ width: 500, height: 800 });
    await expect(page.locator('#sidebar')).toHaveAttribute('data-qz-state', 'closed');
    await page.locator('#sidebar-focus-mode').click();
    const trigger = page.locator('#sidebar-trigger');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#sidebar')).toHaveAttribute('data-qz-open', '');
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    await page.keyboard.press('Escape');
    await expect(page.locator('#sidebar')).toHaveAttribute('data-qz-state', 'closed');
    await expect(trigger).toBeFocused();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  });

  test('representative closed and active states pass axe', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
    await page.locator('#nav-products').click();
    await expect(page.locator('#products-link')).toBeVisible();
    const openResults = await new AxeBuilder({ page }).analyze();
    expect(openResults.violations).toEqual([]);
  });
});
