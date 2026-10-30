import { expect, test } from '@playwright/test';

/** Behaviour of components whose SOURCE was copied by `quartz add` into a fresh Angular app. */
test('copied accordion toggles, copied splitter resizes, copied dialog opens and closes', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');

  const trigger = page.getByRole('button', { name: 'Details' });
  // Non-collapsible by default: the first item starts open and cannot be closed (APG).
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('Panel A')).toBeVisible();

  const handle = page.getByTestId('handle');
  const before = Number(await handle.getAttribute('aria-valuenow'));
  await handle.focus();
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(async () => Number(await handle.getAttribute('aria-valuenow')))
    .toBeGreaterThan(before);

  await page.getByTestId('open').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('dialog-body')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('dialog-body')).toHaveCount(0);
  await expect(page.getByTestId('open')).toBeFocused();

  expect(errors).toEqual([]);
});
