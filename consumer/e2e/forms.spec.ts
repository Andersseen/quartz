import { expect, test } from '@playwright/test';
import { axe, boot, expectHealthy } from './helpers';

test.describe('forms (hydrated)', () => {
  test('invalid submit shows linked, announced errors; fixing them submits; reset clears', async ({
    page,
  }) => {
    const health = await boot(page, '/forms');
    const email = page.getByLabel('Email');
    await expect(email).toHaveAttribute('aria-describedby', 'email-field-hint');

    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByTestId('status')).toHaveText('Please fix the errors');
    await expect(page.locator('#email-field-error')).toHaveAttribute('role', 'alert');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAttribute('aria-describedby', 'email-field-hint email-field-error');
    // Native textarea gets the same wiring: labelled, described by its error, marked invalid.
    const message = page.getByLabel('Message');
    await expect(message).toHaveAttribute('aria-invalid', 'true');
    await expect(message).toHaveAttribute('aria-describedby', 'message-field-error');
    await axe(page, 'form'); // validation errors state

    await email.fill('a@b.co');
    await page.getByLabel('Message').fill('hello world');
    await expect(page.locator('#email-field-error')).toHaveCount(0);
    await expect(email).not.toHaveAttribute('aria-invalid', 'true');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByTestId('status')).toHaveText('Submitted');

    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(email).toHaveValue('');
    await expect(page.getByTestId('status')).toHaveCount(0);
    await expectHealthy(page, health);
  });

  test('checkbox and switch toggle from the keyboard with correct state', async ({ page }) => {
    await boot(page, '/forms');
    const terms = page.getByTestId('terms');
    await terms.focus();
    await page.keyboard.press('Space');
    await expect(terms).toHaveAttribute('aria-checked', 'true');
    const notify = page.getByTestId('notify');
    await notify.focus();
    await page.keyboard.press('Space');
    await expect(notify).toHaveAttribute('aria-checked', 'false');
  });

  test('radio group: roving arrows move the selection; one tab stop', async ({ page }) => {
    await boot(page, '/forms');
    const group = page.getByRole('radiogroup', { name: 'Plan' });
    await group.getByRole('radio', { name: 'Free' }).focus();
    await page.keyboard.press('Space');
    await expect(group.getByRole('radio', { name: 'Free' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await page.keyboard.press('ArrowDown');
    await expect(group.getByRole('radio', { name: 'Pro' })).toBeFocused();
    await expect(group.getByRole('radio', { name: 'Pro' })).toHaveAttribute('aria-checked', 'true');
    await expect(group.locator('[role="radio"][tabindex="0"]')).toHaveCount(1);
  });

  test('select opens, picks a value with the keyboard and closes', async ({ page }) => {
    await boot(page, '/forms');
    const trigger = page.getByRole('button', { name: /^Fruit/ });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('option').first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(trigger).toHaveText('pear');
  });

  test('combobox filters and commits an option', async ({ page }) => {
    await boot(page, '/forms');
    const city = page.getByRole('combobox', { name: 'City' });
    await city.click();
    await city.fill('Pra');
    await expect(page.getByRole('option')).toHaveCount(1);
    await page.getByRole('option', { name: 'Prague' }).click();
    await expect(city).toHaveValue('Prague');
  });

  test('input OTP: typing, backspace, pattern filtering, paste and completion', async ({
    page,
  }) => {
    await boot(page, '/forms');
    const otp = page.getByLabel('One-time code');
    await otp.click();
    await page.keyboard.type('12a3');
    await expect(otp).toHaveValue('123');
    await page.keyboard.press('Backspace');
    await expect(otp).toHaveValue('12');
    await otp.fill('');
    await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>('.qz-otp-input')!;
      input.focus();
      const data = new DataTransfer();
      data.setData('text', '98-76 54');
      // Firefox ignores the `clipboardData` init option, so define it on the event itself.
      const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'clipboardData', { value: data });
      input.dispatchEvent(event);
    });
    await expect(otp).toHaveValue('987654');
    await expect(page.getByTestId('otp-done')).toHaveText('987654');
    await axe(page, '.otp');
  });

  test('file upload: native picker input accepts files and reports the count', async ({ page }) => {
    await boot(page, '/forms');
    await page.getByLabel('Attachments').setInputFiles([
      { name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('a') },
      { name: 'b.txt', mimeType: 'text/plain', buffer: Buffer.from('b') },
    ]);
    await expect(page.getByTestId('file-count')).toHaveText('2');
    // keyboard path: the Browse button is a real button reachable by Tab/Enter
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Browse files' }).focus();
    await page.keyboard.press('Enter');
    await (
      await chooser
    ).setFiles([{ name: 'c.txt', mimeType: 'text/plain', buffer: Buffer.from('c') }]);
    await expect(page.getByTestId('file-count')).toHaveText('1');
  });

  test('accessibility: initial form page has no axe violations', async ({ page }) => {
    await boot(page, '/forms');
    await axe(page);
  });
});
