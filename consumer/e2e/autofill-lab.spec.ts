import { expect, test } from '@playwright/test';
import { boot, expectHealthy } from './helpers';

/**
 * The `/autofill` lab exists for GENUINE browser autofill, which automation cannot produce
 * (docs/releases/0.19-autofill-verification.md). These tests only prove that the lab itself is sound:
 * it renders on the server, hydrates, applies the documented CSS and reports a (synthetic) detection
 * pipeline event end to end. None of them is evidence of genuine autofill.
 */
test.describe('autofill lab (page integrity, NOT genuine autofill)', () => {
  test('SSR renders every field with no autofill state and no live regions', async ({
    request,
  }) => {
    const html = await (await request.get('/autofill')).text();
    for (const name of ['name', 'email', 'tel', 'street', 'postal'])
      expect(html).toContain(`data-testid="lab-${name}"`);
    expect(html).not.toContain('data-autofilled');
    expect(html).toContain('autocomplete="email"');
  });

  test('the documented :-webkit-autofill rules are applied to idle fields', async ({ page }) => {
    await boot(page, '/autofill');
    const animation = await page
      .getByTestId('lab-email')
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(animation).toBe('qz-autofill-cancel');
  });

  test('a synthetic detection event reaches state, output, log and Forms; reset and teardown are clean', async ({
    page,
  }) => {
    const health = await boot(page, '/autofill');
    const email = page.getByTestId('lab-email');

    await email.evaluate((el: HTMLInputElement) => {
      el.value = 'ada@example.test'; // browsers set the value without an input event
      el.dispatchEvent(
        new AnimationEvent('animationstart', { animationName: 'qz-autofill-start' }),
      );
    });
    await expect(email).toHaveAttribute('data-autofilled', '');
    await expect(page.getByTestId('lab-count')).toHaveText('1');
    await expect(page.getByTestId('lab-log')).toContainText('email → true');
    await expect(page.getByTestId('lab-form-value')).toContainText('ada@example.test');
    await expect(page.getByTestId('lab-live')).toHaveText('0');

    // The same state again must not re-emit.
    await email.evaluate((el) =>
      el.dispatchEvent(
        new AnimationEvent('animationstart', { animationName: 'qz-autofill-start' }),
      ),
    );
    await expect(page.getByTestId('lab-count')).toHaveText('1');

    // Clearing the autofill state emits once.
    await email.evaluate((el) =>
      el.dispatchEvent(
        new AnimationEvent('animationstart', { animationName: 'qz-autofill-cancel' }),
      ),
    );
    await expect(email).not.toHaveAttribute('data-autofilled', '');
    await expect(page.getByTestId('lab-count')).toHaveText('2');

    await page.getByTestId('lab-reset').click();
    await expect(page.getByTestId('lab-form-value')).not.toContainText('ada@example.test');

    await page.getByTestId('lab-toggle').click();
    await expect(page.getByTestId('lab-email')).toHaveCount(0);
    await page.getByTestId('lab-toggle').click();
    await expect(page.getByTestId('lab-email')).not.toHaveAttribute('data-autofilled', '');
    await expectHealthy(page, health);
  });
});
