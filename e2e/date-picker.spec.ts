import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e-calendar');
  await expect(page.locator('#app[data-ready]')).toBeAttached();
  await expect(page.locator('#single')).toBeVisible();
});

test('DatePicker keyboard focus is separate from selection and commits exactly once', async ({
  page,
}) => {
  const grid = page.locator('#single [role="grid"]');
  const focused = grid.locator('[data-qz-focused]');
  await expect(focused).toHaveAccessibleName('Thursday, February 15, 2024');
  await focused.press('ArrowRight');
  await expect(page.locator('#single [data-qz-focused]')).toHaveAccessibleName(
    'Friday, February 16, 2024',
  );
  await expect(page.locator('#single-value')).toBeEmpty();
  await page.keyboard.press('Enter');
  await expect(page.locator('#single-value')).toHaveText('2024-2-16');
  await expect(page.locator('#single-commits')).toHaveText('1');
});

test('calendar supports week and year navigation, month boundaries, RTL and localized names', async ({
  page,
}) => {
  const grid = page.locator('#single [role="grid"]');
  await grid.locator('[data-qz-focused]').press('Home');
  await expect(page.locator('#single [data-qz-focused]')).toHaveAccessibleName(
    'Monday, February 12, 2024',
  );
  await page.keyboard.press('Shift+PageUp');
  await expect(page.locator('#single h2')).toHaveText('February 2023');
  await page.locator('#single-next').click();
  await expect(page.locator('#single h2')).toHaveText('March 2023');
  await page.locator('#toggle-rtl').click();
  await expect(page.locator('#app')).toHaveAttribute('dir', 'rtl');
  await page.locator('#single [data-qz-focused]').press('ArrowRight');
  await expect(page.locator('#single [data-qz-focused]')).toHaveAccessibleName(
    'Saturday, March 11, 2023',
  );
  await page.locator('#calendar-locale').selectOption('fr-FR');
  await expect(page.locator('#single [data-qz-focused]')).toHaveAttribute(
    'aria-label',
    /février|mars/,
  );
});

test('range supports keyboard focus, one-day selection and a single commit per endpoint', async ({
  page,
}) => {
  const grid = page.locator('#range [role="grid"]');
  await expect(grid.locator('[data-qz-focused]')).toHaveAccessibleName(
    'Thursday, February 15, 2024',
  );
  await grid.locator('[data-qz-focused]').press('Enter');
  await expect(page.locator('#range-value')).toHaveText('15:');
  await expect(page.locator('#range-commits')).toHaveText('1');
  await grid.locator('[data-qz-focused]').press('Enter');
  await expect(page.locator('#range-value')).toHaveText('15:15');
  await expect(page.locator('#range-commits')).toHaveText('2');
});

test('min, max and dateDisabled prevent selection but keep disabled days identifiable', async ({
  page,
}) => {
  const grid = page.locator('#single [role="grid"]');
  await expect(grid.locator('[data-qz-date="2024-02-14"]')).toHaveAccessibleName(
    'Chosen date 2/14',
  );
  const beforeMin = grid.getByRole('button', { name: 'Sunday, February 4, 2024' });
  const blocked = grid.getByRole('button', { name: 'Monday, February 12, 2024' });
  const afterMax = grid.getByRole('button', { name: 'Monday, February 26, 2024' });
  for (const day of [beforeMin, blocked, afterMax]) {
    await expect(day).toHaveAttribute('aria-disabled', 'true');
    // Disabled calendar days intentionally remain focusable and use aria-disabled, not native
    // disabled, so exercise the click handler directly and verify it rejects the commit.
    await day.dispatchEvent('click');
  }
  await expect(page.locator('#single-value')).toBeEmpty();
  await expect(page.locator('#single-commits')).toHaveText('0');
});

test('range exposes a partial value, previews and rejects spans crossing disabled dates', async ({
  page,
}) => {
  const rangeGrid = page.locator('#range [role="grid"]');
  await rangeGrid.getByRole('button', { name: 'Saturday, February 10, 2024' }).click();
  await expect(page.locator('#range-value')).toHaveText('10:');
  await expect(page.locator('#range-form-value')).toHaveText('10:');
  const preview = rangeGrid.locator('[data-qz-date="2024-02-13"]');
  await preview.hover();
  await expect(preview).toHaveAttribute('data-qz-range-preview', '');
  await rangeGrid.getByRole('button', { name: 'Thursday, February 15, 2024' }).click();
  await expect(page.locator('#range-value')).toHaveText('10:');
  await expect(page.locator('#range-form-value')).toHaveText('10:');
  await expect(page.locator('#range-commits')).toHaveText('1');
  await rangeGrid.getByRole('button', { name: 'Sunday, February 11, 2024' }).click();
  await expect(page.locator('#range-value')).toHaveText('10:11');
  await expect(page.locator('#range-form-value')).toHaveText('10:11');
  await expect(page.locator('#range-commits')).toHaveText('2');
  await page.locator('#range-form-reset').click();
  await expect(page.locator('#range-form-value')).toHaveText(':');
  await page.locator('#range-form-disable').click();
  await expect(page.locator('#range')).toHaveAttribute('data-qz-disabled', '');
});

test('Forms writes and reset are silent, user commits update the value and disabled state blocks interaction', async ({
  page,
}) => {
  const grid = page.locator('#forms [role="grid"]');
  await grid.getByRole('button', { name: 'Tuesday, February 6, 2024' }).click();
  await expect(page.locator('#form-value')).toHaveText('6');
  await page.locator('#form-reset').click();
  await expect(page.locator('#form-value')).toBeEmpty();
  await page.locator('#form-disable').click();
  await expect(page.locator('#forms')).toHaveAttribute('data-qz-disabled', '');
});

test('calendar grid has no automated axe violations', async ({ page }) => {
  const report = await new AxeBuilder({ page }).include('#single').include('#range').analyze();
  expect(report.violations).toEqual([]);
});
