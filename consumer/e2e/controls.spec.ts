import { expect, test } from '@playwright/test';
import { axe, boot, expectHealthy } from './helpers';

/** Remaining interactive Volt-parity rows: toggle, slider, range-slider, toggle-group, pagination, date pickers, listbox, toolbar. */
test.describe('controls (hydrated)', () => {
  test('slider: arrows/Home/End change the Forms value and aria-valuenow', async ({ page }) => {
    const health = await boot(page, '/controls');
    const thumb = page.getByRole('slider', { name: 'Volume' });
    await expect(thumb).toHaveAttribute('aria-valuenow', '3');
    await thumb.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('slider-value')).toHaveText('4');
    await page.keyboard.press('End');
    await expect(page.getByTestId('slider-value')).toHaveText('10');
    await page.keyboard.press('Home');
    await expect(thumb).toHaveAttribute('aria-valuenow', '0');
    await axe(page, '[data-testid="slider"]');
    await expectHealthy(page, health);
  });

  test('range slider: two named thumbs honour minDistance', async ({ page }) => {
    await boot(page, '/controls');
    const low = page.getByRole('slider', { name: 'Minimum price' });
    const high = page.getByRole('slider', { name: 'Maximum price' });
    await expect(low).toHaveAttribute('aria-valuenow', '100');
    await expect(high).toHaveAttribute('aria-valuenow', '300');
    await high.focus();
    await page.keyboard.press('Home');
    await expect(page.getByTestId('range-value')).toHaveText('100-110');
    await axe(page, '[data-testid="range"]');
  });

  test('toggle: Space toggles aria-pressed and the Forms value', async ({ page }) => {
    await boot(page, '/controls');
    const toggle = page.getByTestId('toggle');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('toggle-value')).toHaveText('true');
  });

  test('toggle group (single, no deselection): selection follows activation; roving arrows', async ({
    page,
  }) => {
    await boot(page, '/controls');
    const group = page.getByTestId('tgroup');
    await expect(group.getByRole('button', { name: 'Left' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await group.getByText('Left').focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    await expect(page.getByTestId('tgroup-value')).toHaveText('center');
    await group.getByText('Center').click();
    await expect(page.getByTestId('tgroup-value')).toHaveText('center'); // cannot deselect
    await axe(page, '[data-testid="tgroup"]');
  });

  test('date picker: grid navigation with the keyboard selects a date; month navigation works', async ({
    page,
  }) => {
    const health = await boot(page, '/controls');
    const picker = page.getByTestId('datepicker');
    await expect(picker.locator('[qzCalendarMonthLabel]')).toContainText('June 2026');
    await picker.getByRole('button', { name: /June 15, 2026/ }).focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('date-value')).toHaveText('2026-06-16');
    await picker.getByRole('button', { name: 'Next month' }).click();
    await expect(picker.locator('[qzCalendarMonthLabel]')).toContainText('July 2026');
    await axe(page, '[data-testid="datepicker"]');
    await expectHealthy(page, health);
  });

  test('date range picker: two selections produce an ordered range', async ({ page }) => {
    await boot(page, '/controls');
    const picker = page.getByTestId('rangepicker');
    await picker.getByRole('button', { name: /June 10, 2026/ }).click();
    await picker.getByRole('button', { name: /June 20, 2026/ }).click();
    await expect(page.getByTestId('range-date-value')).toHaveText('2026-06-10..2026-06-20');
    await axe(page, '[data-testid="rangepicker"]');
  });

  test('listbox: keyboard selection and aria-selected', async ({ page }) => {
    await boot(page, '/controls');
    const listbox = page.getByRole('listbox', { name: 'Sections' });
    await listbox.focus(); // the listbox owns focus; options are activated via aria-activedescendant
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('listbox-value')).toHaveText('b');
    await expect(listbox.getByRole('option', { name: 'Beta' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await axe(page, '[data-testid="listbox"]');
  });

  test('pagination: next/last/first/page buttons, aria-current and disabled ends', async ({
    page,
  }) => {
    await boot(page, '/controls');
    const nav = page.getByRole('navigation', { name: 'Results' });
    await expect(nav.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await expect(nav.getByRole('button', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await nav.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByTestId('page-value')).toHaveText('2');
    await nav.getByRole('button', { name: 'Last page' }).click();
    await expect(page.getByTestId('page-value')).toHaveText('5');
    await expect(nav.getByRole('button', { name: 'Next page' })).toBeDisabled();
    await nav.getByRole('button', { name: 'First page' }).click();
    await expect(page.getByTestId('page-value')).toHaveText('1');
    await axe(page, '[data-testid="pagination"]');
  });

  test('toolbar: one tab stop, arrows rove and skip the disabled item', async ({ page }) => {
    await boot(page, '/controls');
    const bar = page.getByRole('toolbar', { name: 'Formatting' });
    await bar.getByRole('button', { name: 'Cut' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(bar.getByRole('button', { name: 'Copy' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(bar.getByRole('button', { name: 'Undo' })).toBeFocused();
    // Roving tabindex: exactly one toolbar item is a tab stop (the last focused one).
    await expect(bar.locator('button[tabindex="0"]')).toHaveCount(1);
    await expect(bar.getByRole('button', { name: 'Undo' })).toHaveAttribute('tabindex', '0');
    await axe(page, '[data-testid="toolbar"]');
  });
});
