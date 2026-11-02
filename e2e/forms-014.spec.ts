import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './support/test';
import { gotoReady } from './support/readiness';

const openDemo = async (page: import('./support/test').Page) => {
  await gotoReady(page, '/docs/primitives/form-field');
  await expect(page.locator('app-controls-014-demo')).toBeVisible();
};

test.describe('0.14 text, file and field composition', () => {
  test('FormField exposes native and Quartz-control names, hint, error and reset state', async ({
    page,
  }) => {
    await openDemo(page);
    const field = page.getByRole('region', { name: 'Form field' });
    const email = field.getByRole('textbox', { name: 'Email address' });
    await email.fill('invalid');
    await field.getByRole('button', { name: 'Validate email' }).click();
    await expect(field.getByText('Enter a valid email address.', { exact: true })).toBeVisible();
    await expect(email).toHaveAttribute('aria-describedby', 'demo-email-hint demo-email-error');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await email.fill('person@example.com');
    await expect(field.getByText('Enter a valid email address.', { exact: true })).toHaveCount(0);
    await expect(field).not.toHaveAttribute('data-invalid');
    await page.getByRole('button', { name: 'Reset email' }).click();
    await expect(email).toHaveValue('');
    await expect(field).not.toHaveAttribute('data-touched');
    await expect(page.getByRole('switch', { name: 'Product updates' })).toHaveAttribute(
      'aria-labelledby',
      'demo-notifications-field-label',
    );
  });

  test('InputOTP filters, completes, resets and blocks interaction when disabled', async ({
    page,
  }) => {
    await openDemo(page);
    const otp = page.getByRole('textbox', { name: 'Six-digit one-time code' });
    await otp.fill('12x34567');
    await expect(otp).toHaveValue('123456');
    await expect(page.getByText('Code entered.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Reset code' }).click();
    await expect(otp).toHaveValue('');
    await otp.fill('12');
    await otp.evaluate((element) => {
      const clipboard = new DataTransfer();
      clipboard.setData('text', '3x4567');
      const paste = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
      // Firefox and WebKit do not expose clipboardData on constructed ClipboardEvents.
      Object.defineProperty(paste, 'clipboardData', { value: clipboard });
      element.dispatchEvent(paste);
    });
    await expect(otp).toHaveValue('123456');
    await expect(page.getByText('Code entered.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Disable code' }).click();
    await expect(otp).toBeDisabled();
  });

  test('autofill animation contract updates the public state hook once', async ({ page }) => {
    await openDemo(page);
    const input = page.getByRole('textbox', { name: 'Browser autofill example' });
    await input.evaluate((element) => {
      element.dispatchEvent(
        new AnimationEvent('animationstart', { bubbles: true, animationName: 'qz-autofill-start' }),
      );
    });
    await expect(input).toHaveAttribute('data-autofilled');
    await expect(page.getByText('Detected autofill state: autofilled.')).toBeVisible();
    await input.evaluate((element) => {
      element.dispatchEvent(
        new AnimationEvent('animationstart', {
          bubbles: true,
          animationName: 'qz-autofill-cancel',
        }),
      );
    });
    await expect(input).not.toHaveAttribute('data-autofilled');
  });

  test('native picker/drop filter files; keyboard search clear returns focus', async ({ page }) => {
    await openDemo(page);
    const files = page.getByLabel('Choose text or PDF files');
    await files.setInputFiles([
      { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') },
      { name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from('image') },
    ]);
    await expect(page.getByText('1 accepted file(s).')).toBeVisible();
    await expect(page.getByText(/1 file\(s\) were rejected/)).toBeVisible();

    const dropzone = page.locator('[data-demo-dropzone]');
    await dropzone.evaluate((element) => {
      const transfer = new DataTransfer();
      transfer.items.add(new File(['pdf'], 'report.pdf', { type: 'application/pdf' }));
      element.dispatchEvent(
        new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }),
      );
    });
    await expect(page.getByText('1 accepted file(s).')).toBeVisible();
    await expect(page.getByText(/file\(s\) were rejected/)).toHaveCount(0);

    const browse = page.getByRole('button', { name: 'Browse files' });
    await browse.focus();
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), browse.press('Enter')]);
    await chooser.setFiles([
      { name: 'keyboard.txt', mimeType: 'text/plain', buffer: Buffer.from('ok') },
    ]);
    await expect(page.getByText('1 accepted file(s).')).toBeVisible();

    const search = page.getByRole('searchbox', { name: 'Search this site' });
    await search.fill('Quartz');
    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(search).toBeFocused();
    await expect(search).toHaveValue('');
  });

  test('official form-field demo has no axe violations in RTL', async ({ page }) => {
    await openDemo(page);
    await page.locator('html').evaluate((element) => element.setAttribute('dir', 'rtl'));
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('official demo hydrates without browser console or page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await openDemo(page);
    await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
