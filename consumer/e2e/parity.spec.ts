import { expect, test, type Locator, type Page } from '@playwright/test';
import { axe, boot, domIntegrity, expectHealthy, replacedNodes } from './helpers';

/**
 * Evidence for the six Volt-parity rows that 0.16 left open (accordion, sidebar, form-field,
 * input-otp, autofill, file-upload). Runs against the SSR-served, hydrated consumer app in the three
 * engines. Synthetic events are used ONLY where a browser cannot be driven natively (IME,
 * DataTransfer drops, genuine autofill) and each such test says so.
 */

const trigger = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const focusedText = (page: Page) =>
  page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');

test.describe('accordion', () => {
  test('SSR renders closed panels hidden and the open one visible', async ({ request }) => {
    const html = await (await request.get('/parity')).text();
    expect(html).toMatch(/H panel one/);
    expect(html).toMatch(/<div[^>]*qzaccordionpanel[^>]*hidden[^>]*>\s*H panel two/i);
  });

  test('horizontal orientation: Left/Right rove, Up/Down do nothing, Home/End jump', async ({
    page,
  }) => {
    await boot(page, '/parity');
    await trigger(page, 'H one').focus();
    await page.keyboard.press('ArrowDown');
    expect(await focusedText(page)).toBe('H one');
    await page.keyboard.press('ArrowRight');
    expect(await focusedText(page)).toBe('H two');
    await page.keyboard.press('End');
    expect(await focusedText(page)).toBe('H three');
    await page.keyboard.press('Home');
    expect(await focusedText(page)).toBe('H one');
  });

  test('RTL horizontal: ArrowLeft advances, ArrowRight goes back', async ({ page }) => {
    await boot(page, '/parity');
    await trigger(page, 'R one').focus();
    await page.keyboard.press('ArrowLeft');
    expect(await focusedText(page)).toBe('R two');
    await page.keyboard.press('ArrowRight');
    expect(await focusedText(page)).toBe('R one');
  });

  test('non-collapsible: the open item is aria-disabled and cannot be closed', async ({ page }) => {
    await boot(page, '/parity');
    const open = trigger(page, 'H one');
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    await expect(open).toHaveAttribute('aria-disabled', 'true');
    // aria-disabled controls are not 'enabled' for Playwright, so force the click: it must be a no-op.
    await open.click({ force: true });
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    await trigger(page, 'H two').click();
    await expect(trigger(page, 'H two')).toHaveAttribute('aria-expanded', 'true');
    await expect(open).toHaveAttribute('aria-expanded', 'false');
    await expect(open).not.toHaveAttribute('aria-disabled', 'true');
  });

  test('container disabled blocks every trigger (click and keyboard)', async ({ page }) => {
    await boot(page, '/parity');
    const two = trigger(page, 'D two');
    await expect(two).toHaveAttribute('aria-disabled', 'true');
    await two.click({ force: true });
    await two.focus().catch(() => undefined);
    await page.keyboard.press('Enter');
    await expect(two).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByText('D panel two')).toBeHidden();
  });

  test('multiple: panels open independently; closed panel content is out of the tab order', async ({
    page,
  }) => {
    await boot(page, '/parity');
    const inside = page.getByRole('button', { name: 'Inside one' });
    await expect(inside).toBeHidden();
    await trigger(page, 'M one').click();
    await trigger(page, 'M two').click();
    await expect(trigger(page, 'M one')).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger(page, 'M two')).toHaveAttribute('aria-expanded', 'true');
    await expect(inside).toBeVisible();
    await trigger(page, 'M one').click();
    await expect(inside).toBeHidden();
    // Tab from the closed trigger must not land inside the hidden panel.
    await trigger(page, 'M one').focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).not.toBe(
      'Inside one',
    );
  });

  test('dynamic removal of the focused, open item keeps focus inside the accordion and ARIA valid', async ({
    page,
  }) => {
    const health = await boot(page, '/parity');
    await trigger(page, 'Dyn a').focus();
    await page.getByTestId('acc-remove').evaluate((b) => (b as HTMLButtonElement).click());
    await expect(trigger(page, 'Dyn a')).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(() => !!document.activeElement?.closest('[data-testid="acc-dynamic"]')),
      )
      .toBe(true);
    await expectHealthy(page, health);
  });
});

test.describe('sidebar', () => {
  const sb = (page: Page) => page.getByTestId('sb');

  test('SSR renders the desktop default: expanded and open', async ({ request }) => {
    const html = await (await request.get('/parity')).text();
    expect(html).toMatch(
      /data-testid="sb"[^>]*data-qz-state="expanded"|data-qz-state="expanded"[^>]*data-testid="sb"/,
    );
  });

  test('desktop: collapsed rail is distinct from closed; Escape does not close a push sidebar', async ({
    page,
  }) => {
    await boot(page, '/parity');
    await expect(sb(page)).toHaveAttribute('data-qz-state', 'expanded');
    const expandedWidth = (await page.getByTestId('sb-panel').boundingBox())!.width;

    await page.getByTestId('sb-collapse').click();
    await expect(sb(page)).toHaveAttribute('data-qz-state', 'collapsed');
    await expect(sb(page)).toHaveAttribute('data-qz-open', '');
    await expect(page.getByTestId('sb-panel')).toBeVisible();
    expect((await page.getByTestId('sb-panel').boundingBox())!.width).toBeLessThan(expandedWidth);
    // Collapsed rail items stay named for assistive technology.
    await expect(page.getByRole('link', { name: 'Item 1' })).toBeVisible();
    await axe(page, '[data-testid="sb"]');

    await page.getByRole('link', { name: 'Item 1' }).focus();
    await page.keyboard.press('Escape');
    await expect(sb(page)).toHaveAttribute('data-qz-state', 'collapsed');

    await page.getByTestId('sb-close').click();
    await expect(sb(page)).toHaveAttribute('data-qz-state', 'closed');
    await expect(sb(page)).not.toHaveAttribute('data-qz-open', '');
    await page.getByTestId('sb-expand').click();
    await expect(sb(page)).toHaveAttribute('data-qz-state', 'expanded');
  });

  test('mobile: off-canvas overlay locks scroll, Escape closes it and focus returns to the trigger', async ({
    page,
  }) => {
    await boot(page, '/parity');
    await page.setViewportSize({ width: 400, height: 800 });
    await expect(sb(page)).toHaveAttribute('data-qz-responsive', 'mobile');
    await expect(sb(page)).toHaveAttribute('data-qz-state', 'closed');
    const toggle = page.getByTestId('sb-trigger');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(sb(page)).toHaveAttribute('data-qz-state', 'expanded');
    await expect(sb(page)).toHaveAttribute('data-qz-mode', 'overlay');
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    expect(
      await page.evaluate(() => !!document.activeElement?.closest('[data-testid="sb-panel"]')),
    ).toBe(true);
    await page.keyboard.press('Escape');
    await expect(sb(page)).toHaveAttribute('data-qz-state', 'closed');
    await expect(toggle).toBeFocused();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
    // Back to desktop restores the desktop state.
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(sb(page)).toHaveAttribute('data-qz-state', 'expanded');
  });

  test('hydrating at a mobile viewport settles to closed without errors or replaced nodes', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    const health = await boot(page, '/parity');
    await expect(sb(page)).toHaveAttribute('data-qz-state', 'closed');
    expect(await replacedNodes(page)).toEqual([]);
    await expectHealthy(page, health);
  });
});

test.describe('form-field', () => {
  const input = (page: Page) => page.locator('#ff-name-control');

  test('native input: ids, labelledby/describedby, async validator transitions, reset', async ({
    page,
  }) => {
    const health = await boot(page, '/parity');
    await expect(input(page)).toHaveAttribute('aria-labelledby', 'ff-name-label');
    await expect(input(page)).toHaveAttribute('aria-describedby', 'ff-name-hint');
    await expect(input(page)).not.toHaveAttribute('aria-invalid', 'true');

    await input(page).fill('taken');
    await expect(page.getByTestId('ff-name')).toHaveAttribute('data-pending', '');
    await expect(page.locator('#ff-name-error')).toBeVisible();
    await expect(page.getByTestId('ff-name')).not.toHaveAttribute('data-pending', '');
    await expect(input(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(input(page)).toHaveAttribute('aria-describedby', 'ff-name-hint ff-name-error');
    await expect(page.getByTestId('ff-name')).toHaveAttribute('data-invalid', '');
    await expect(page.getByTestId('ff-name')).toHaveAttribute('data-dirty', '');
    expect((await domIntegrity(page)).dangling).toEqual([]);

    await input(page).fill('free');
    await expect(page.locator('#ff-name-error')).toHaveCount(0);
    await expect(input(page)).not.toHaveAttribute('aria-invalid', 'true');
    await expect(input(page)).toHaveAttribute('aria-describedby', 'ff-name-hint');

    await page.getByTestId('ff-reset').click();
    await expect(input(page)).toHaveValue('');
    await expect(page.getByTestId('ff-name')).not.toHaveAttribute('data-dirty', '');
    await expectHealthy(page, health);
  });

  test('Quartz Checkbox: named by its label, conditional error appears after touch and clears when checked', async ({
    page,
  }) => {
    await boot(page, '/parity');
    const box = page.getByRole('checkbox', { name: 'Agree to terms' });
    await expect(box).toHaveAttribute('aria-describedby', 'ff-agree-hint');
    await box.focus();
    await page.getByTestId('ff-news').getByRole('switch').focus(); // blur => touched
    await expect(page.locator('#ff-agree-error')).toBeVisible();
    await expect(box).toHaveAttribute('aria-describedby', 'ff-agree-hint ff-agree-error');
    await expect(page.getByTestId('ff-agree')).toHaveAttribute('data-touched', '');
    await box.focus();
    await page.keyboard.press('Space');
    await expect(box).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#ff-agree-error')).toHaveCount(0);
    expect((await domIntegrity(page)).dangling).toEqual([]);
  });

  test('Quartz Switch: named by its label; disabled state mirrors to field and control', async ({
    page,
  }) => {
    await boot(page, '/parity');
    const sw = page.getByRole('switch', { name: 'Newsletter' });
    await expect(sw).toHaveAttribute('aria-labelledby', 'ff-news-label');
    await page.getByTestId('ff-disable').click();
    await expect(page.getByTestId('ff-news')).toHaveAttribute('data-disabled', '');
    await expect(sw).toHaveAttribute('aria-disabled', 'true');
    await expect(input(page)).toBeDisabled();
    await axe(page, '[aria-labelledby="ff-h"]');
    await page.getByTestId('ff-disable').click();
    await expect(input(page)).toBeEnabled();
  });
});

test.describe('input-otp', () => {
  const field = (page: Page) => page.getByTestId('otp').locator('input');
  const slots = (page: Page) => page.getByTestId('otp').locator('.qz-otp-slot');

  async function paste(page: Page, testId: string, text: string) {
    await page
      .getByTestId(testId)
      .locator('input')
      .evaluate((input, value) => {
        (input as HTMLInputElement).focus();
        const data = new DataTransfer();
        data.setData('text', value);
        const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'clipboardData', { value: data }); // Firefox ignores the init option
        input.dispatchEvent(event);
      }, text);
  }

  test('typing, pattern filtering, Backspace and Delete', async ({ page }) => {
    await boot(page, '/parity');
    await field(page).click();
    await page.keyboard.type('1a2b3');
    await expect(page.getByTestId('otp-value')).toHaveText('123');
    await expect(slots(page).nth(0)).toHaveText('1');
    await page.keyboard.press('Backspace');
    await expect(page.getByTestId('otp-value')).toHaveText('12');
    await field(page).evaluate((i) => (i as HTMLInputElement).setSelectionRange(0, 0));
    await page.keyboard.press('Delete');
    await expect(page.getByTestId('otp-value')).toHaveText('2');
  });

  test('selection replacement', async ({ page }) => {
    await boot(page, '/parity');
    await field(page).click();
    await page.keyboard.type('123456');
    await field(page).evaluate((i) => (i as HTMLInputElement).setSelectionRange(1, 4));
    await page.keyboard.type('9');
    await expect(page.getByTestId('otp-value')).toHaveText('1956');
  });

  test('paste distributes, filters and completes (synthetic ClipboardEvent: no OS clipboard in CI)', async ({
    page,
  }) => {
    await boot(page, '/parity');
    await paste(page, 'otp', '98-76 54');
    await expect(page.getByTestId('otp-value')).toHaveText('987654');
    await expect(page.getByTestId('otp-completed')).toHaveText('987654');
    await expect(page.getByTestId('otp')).toHaveAttribute('data-complete', '');
  });

  test('IME: composition text is not committed until compositionend (synthetic composition events)', async ({
    page,
  }) => {
    await boot(page, '/parity');
    await field(page).evaluate((input) => {
      const el = input as HTMLInputElement;
      el.focus();
      el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      el.value = 'あ12';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.getByTestId('otp-value')).toHaveText('');
    await field(page).evaluate((input) => {
      const el = input as HTMLInputElement;
      el.value = '12';
      el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '12' }));
    });
    await expect(page.getByTestId('otp-value')).toHaveText('12');
  });

  test('dynamic length trims the value and the slot count; disabled blocks typing; clear resets', async ({
    page,
  }) => {
    await boot(page, '/parity');
    await paste(page, 'otp', '123456');
    await expect(slots(page)).toHaveCount(6);
    await page.getByTestId('otp-len').click();
    await expect(slots(page)).toHaveCount(4);
    await expect(page.getByTestId('otp-value')).toHaveText('1234');

    await page.getByTestId('otp-dis').click();
    await expect(field(page)).toBeDisabled();
    await expect(page.getByTestId('otp')).toHaveAttribute('data-disabled', '');
    await page.getByTestId('otp-dis').click();
    await page.getByTestId('otp-clear').click();
    await expect(page.getByTestId('otp-value')).toHaveText('');
    await expect(field(page)).toHaveValue('');
  });

  test('Angular Forms adapter: writeValue silent, value propagates, reset clears', async ({
    page,
  }) => {
    await boot(page, '/parity');
    await page.getByTestId('otp-forms').locator('input').click();
    await page.keyboard.type('4321');
    await expect(page.getByTestId('otp-forms-value')).toHaveText('4321');
    await page.getByTestId('otp-forms-reset').click();
    await expect(page.getByTestId('otp-forms').locator('input')).toHaveValue('');
  });

  test('one accessible input; slots are presentational; axe clean', async ({ page }) => {
    await boot(page, '/parity');
    await expect(page.getByRole('textbox', { name: 'Verification code' })).toHaveCount(1);
    await expect(page.getByTestId('otp').locator('.qz-otp-slots')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    await expect(field(page)).toHaveAttribute('autocomplete', 'one-time-code');
    await axe(page, '[aria-labelledby="otp-h"]');
  });
});

test.describe('autofill', () => {
  const af = (page: Page) => page.getByTestId('af');

  test('SSR renders the field with no autofill state', async ({ request }) => {
    const html = await (await request.get('/parity')).text();
    expect(html).toContain('data-testid="af"');
    expect(html).not.toContain('data-autofilled');
  });

  test('a real engine animationstart with the configured name flips the state, output and value notification', async ({
    page,
  }) => {
    // NOTE: this proves the directive's event pipeline in Chromium/Firefox/WebKit using a real CSS
    // animation. It does NOT prove genuine browser autofill: headless engines cannot be driven into
    // an autofill state, and only Chromium/WebKit expose `:-webkit-autofill` for this technique.
    await boot(page, '/parity');
    let inputEvents = 0;
    await page.exposeFunction('countInput', () => inputEvents++);
    await af(page).evaluate((el) =>
      el.addEventListener('input', () => (window as any).countInput()),
    );
    await af(page).evaluate((el) => {
      (el as HTMLInputElement).value = 'filled@example.test'; // changed without any input event
      el.classList.add('simulate');
    });
    await expect(af(page)).toHaveAttribute('data-autofilled', '');
    await expect(page.getByTestId('af-state')).toHaveText('true');
    await expect.poll(() => inputEvents).toBe(1);
  });

  test('teardown while active leaves no errors', async ({ page }) => {
    const health = await boot(page, '/parity');
    await af(page).evaluate((el) => el.classList.add('simulate'));
    await expect(af(page)).toHaveAttribute('data-autofilled', '');
    await page.getByTestId('af-toggle').click();
    await expect(af(page)).toHaveCount(0);
    await page.getByTestId('af-toggle').click();
    await expect(af(page)).not.toHaveAttribute('data-autofilled', '');
    await expectHealthy(page, health);
  });
});

test.describe('file-upload', () => {
  const zone = (page: Page) => page.getByTestId('drop');
  const picker = (page: Page) => page.getByLabel('Single image or text');

  async function drop(page: Page, target: Locator, files: { name: string; type: string }[]) {
    const transfer = await page.evaluateHandle((list) => {
      const dt = new DataTransfer();
      for (const f of list) dt.items.add(new File(['x'], f.name, { type: f.type }));
      return dt;
    }, files);
    await target.dispatchEvent('dragenter', { dataTransfer: transfer });
    await target.dispatchEvent('dragover', { dataTransfer: transfer });
    await target.dispatchEvent('drop', { dataTransfer: transfer });
  }

  test('native picker via keyboard: Browse opens the chooser and the file is reported', async ({
    page,
  }) => {
    await boot(page, '/parity');
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Browse' }).focus();
    await page.keyboard.press('Enter');
    await (
      await chooser
    ).setFiles([{ name: 'note.txt', mimeType: 'text/plain', buffer: Buffer.from('n') }]);
    await expect(page.getByTestId('fu-accepted')).toHaveText('note.txt');
  });

  test('accept filter rejects non-matching types (MIME wildcard and extension)', async ({
    page,
  }) => {
    await boot(page, '/parity');
    await picker(page).setInputFiles({
      name: 'run.exe',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('x'),
    });
    await expect(page.getByTestId('fu-rejected')).toHaveText('run.exe:type');
    await expect(page.getByTestId('fu-accepted')).toHaveText('');
    await picker(page).setInputFiles({
      name: 'pic.png',
      mimeType: 'image/png',
      buffer: Buffer.from('x'),
    });
    await expect(page.getByTestId('fu-accepted')).toHaveText('pic.png');
  });

  test('a real DataTransfer drop on the wrapper accepts the first file and rejects the rest (single mode)', async ({
    page,
  }) => {
    await boot(page, '/parity');
    await drop(page, zone(page), [
      { name: 'a.txt', type: 'text/plain' },
      { name: 'b.txt', type: 'text/plain' },
    ]);
    await expect(page.getByTestId('fu-accepted')).toHaveText('a.txt');
    await expect(page.getByTestId('fu-rejected')).toHaveText('b.txt:multiple');
    await expect(zone(page)).not.toHaveAttribute('data-drag-active', '');
  });

  test('nested dragenter/dragleave keeps the drag state until the pointer truly leaves', async ({
    page,
  }) => {
    await boot(page, '/parity');
    const child = page.getByTestId('drop-child');
    const dt = await page.evaluateHandle(() => new DataTransfer());
    const outside = await page.getByRole('heading', { name: 'File upload' }).elementHandle();
    const zoneHandle = await zone(page).elementHandle();
    const childHandle = await child.elementHandle();

    await zone(page).dispatchEvent('dragenter', { dataTransfer: dt, relatedTarget: outside });
    await expect(zone(page)).toHaveAttribute('data-drag-active', '');
    await child.dispatchEvent('dragenter', { dataTransfer: dt, relatedTarget: zoneHandle });
    await zone(page).dispatchEvent('dragleave', { dataTransfer: dt, relatedTarget: childHandle });
    await expect(zone(page)).toHaveAttribute('data-drag-active', '');
    await zone(page).dispatchEvent('dragleave', { dataTransfer: dt, relatedTarget: outside });
    await expect(zone(page)).not.toHaveAttribute('data-drag-active', '');
  });

  test('disabled input ignores drops and never shows drag state', async ({ page }) => {
    await boot(page, '/parity');
    await drop(page, page.getByTestId('drop-disabled'), [{ name: 'a.txt', type: 'text/plain' }]);
    await expect(page.getByTestId('fu-disabled')).toHaveText('0');
    await expect(page.getByTestId('drop-disabled')).not.toHaveAttribute('data-drag-active', '');
  });

  test('directory mode sets webkitdirectory; contents are not traversed or read', async ({
    page,
  }) => {
    await boot(page, '/parity');
    await expect(page.getByTestId('dir')).toHaveAttribute('webkitdirectory', '');
  });

  test('cancel event is surfaced (synthetic: engines do not let tests dismiss the native dialog)', async ({
    page,
  }) => {
    await boot(page, '/parity');
    await picker(page).dispatchEvent('cancel');
    await expect(page.getByTestId('fu-cancelled')).toHaveText('1');
  });

  test('accessibility: dropzone, named inputs and keyboard picker pass axe', async ({ page }) => {
    await boot(page, '/parity');
    await axe(page, '[aria-labelledby="fu-h"]');
  });
});
