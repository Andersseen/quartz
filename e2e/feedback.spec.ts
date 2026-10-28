import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('feedback and value indicators', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e-feedback');
  });
  test('Avatar SSR markup starts with a deterministic fallback', async ({ request }) => {
    const html = await (await request.get('/e2e-feedback')).text();
    expect(html).toContain('data-qz-part=\"fallback\"');
    expect(html).toContain('>JD</span>');
  });
  test('Progress updates and indeterminate state has no numeric value', async ({ page }) => {
    const progress = page.locator('#progress');
    await expect(progress).toHaveAttribute('role', 'progressbar');
    await expect(progress).toHaveAttribute('aria-valuenow', '30');
    await page.locator('#progress-next').click();
    await expect(progress).toHaveAttribute('aria-valuenow', '40');
    await page.locator('#progress-indeterminate').click();
    await expect(progress).toHaveAttribute('data-qz-indeterminate', '');
    await expect(progress).not.toHaveAttribute('aria-valuenow', /.+/);
  });
  test('Meter keeps scalar meter semantics and Avatar uses fallback on image error', async ({
    page,
  }) => {
    await expect(page.locator('#meter')).toHaveAttribute('role', 'meter');
    await expect(page.locator('#meter')).toHaveAttribute('aria-valuenow', '72');
    await page.locator('#meter-next').click();
    await expect(page.locator('#meter')).toHaveAttribute('aria-valuenow', '82');
    await expect(page.locator('#avatar [data-qz-part="fallback"]')).toHaveText('JD');
    await expect(page.locator('#avatar')).toHaveAttribute('data-qz-state', 'fallback');
    await page.locator('#avatar-load').click();
    await expect(page.locator('#avatar')).toHaveAttribute('data-qz-state', 'loaded');
    await page.locator('#avatar-fail').click();
    await expect(page.locator('#avatar')).toHaveAttribute('data-qz-state', 'fallback');
  });
  test('custom toast content can dismiss itself and an action dismisses on activation', async ({
    page,
  }) => {
    await page.locator('#show-template').click();
    await expect(page.getByText('Custom toast content')).toBeVisible();
    await page.locator('#content-dismiss').click();
    await expect(page.getByText('Custom toast content')).toHaveCount(0);
    await page.locator('#show-action').click();
    await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(page.getByText('Action ready')).toHaveCount(0);
    await page.locator('#show-component').click();
    await expect(page.getByText('Component toast content')).toBeVisible();
    await page.locator('#component-toast-dismiss').click();
    await expect(page.getByText('Component toast content')).toHaveCount(0);
  });
  test('fixture has no axe violations', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
  test('hydrates the fixture without Angular hydration errors', async ({ page }) => {
    const hydrationErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && /hydration|NG05\d/i.test(message.text())) {
        hydrationErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => hydrationErrors.push(error.message));
    await page.reload();
    await expect(page.locator('#progress')).toHaveAttribute('aria-valuenow', '30');
    await expect(page.locator('#avatar')).toHaveAttribute('data-qz-state', 'fallback');
    await expect(page.locator('#progress-next')).toBeEnabled();
    expect(hydrationErrors).toEqual([]);
  });
  test('Toast playground controls real content, actions, placement and stacking', async ({
    page,
  }) => {
    await page.goto('/docs/primitives/toast');
    await page.waitForLoadState('networkidle');
    const playground = page.locator('[data-doq-playground="quartz-toast"]');
    await playground.getByLabel('Severity').selectOption({ label: 'Error' });
    await playground.getByLabel('Duration (ms, 0 persists)').fill('0');
    await playground.getByLabel('Placement').selectOption({ label: 'Top left' });
    await playground.getByLabel('Use custom template').check();
    await playground.getByLabel('Include action').check();
    await playground.getByLabel('Maximum visible').fill('2');
    await playground.getByRole('button', { name: 'Show toast' }).click();
    const toast = page.locator('qz-toast [role="alert"]');
    await expect(toast).toContainText('Custom template notification');
    await expect(toast.getByRole('button', { name: 'Undo' })).toBeVisible();
    await toast.getByRole('button', { name: 'Undo' }).click();
    await expect(playground).toContainText('Actions used: 1');
    await toast.getByRole('button', { name: 'Dismiss from content' }).click();
    await expect(page.locator('qz-toast')).toHaveCount(0);

    await playground.getByLabel('Use custom template').uncheck();
    await playground.getByLabel('Include action').uncheck();
    await playground.getByRole('button', { name: 'Show stack' }).click();
    await expect(page.locator('qz-toast')).toHaveCount(2);
    await expect(page.getByText('Stack item 1')).toHaveCount(0);
    await expect(page.getByText('Stack item 2')).toBeVisible();
    await expect(page.getByText('Stack item 3')).toBeVisible();
  });
});
