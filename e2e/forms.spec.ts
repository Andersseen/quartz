import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from './support/test';

/**
 * Real-browser checks for the Quartz 0.9 selection controls and Angular Forms adapters:
 * programmatic values, user changes, validation, touched, submit, reset, disabled, Select inside
 * Dialog, keyboard-only operation, RTL, cleanup and an automated accessibility scan.
 * Runs against /e2e-forms in Chromium, Firefox and WebKit.
 */

const form = async (page: Page) =>
  JSON.parse(await page.locator('#live-value').innerText()) as Record<string, unknown>;
// Radios, options and popup listboxes get their ids from the directives, so they are addressed by
// role and accessible name — which is also what the contract promises to assistive technology.
const radio = (page: Page, name: string) => page.getByRole('radio', { name });
const option = (page: Page, name: string) => page.getByRole('option', { name });
const countryList = (page: Page) => page.getByRole('listbox', { name: /Country/ });
const sizeList = (page: Page) => page.getByRole('listbox', { name: /Size/ });
const tag = (page: Page, name: string) => page.locator('#tags').getByRole('option', { name });
const activeText = (page: Page) =>
  page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');
const activeId = (page: Page) => page.evaluate(() => document.activeElement?.id ?? '');
const overlayResidue = (page: Page) =>
  page.evaluate(() => document.querySelectorAll('[data-qz-overlay-container] > *').length);

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e-forms');
  await expect(page.locator('#terms')).toBeVisible();
});

test.describe('values', () => {
  test('starts from the form model and follows programmatic updates in the DOM', async ({
    page,
  }) => {
    await expect
      .poll(() => form(page))
      .toEqual({
        terms: false,
        notify: false,
        plan: null,
        country: null,
        tags: null,
      });
    await expect(page.locator('#terms')).toHaveAttribute('aria-checked', 'false');
    await expect(radio(page, 'Free')).toHaveAttribute('aria-checked', 'false');

    await page.locator('#prefill').click();

    await expect(page.locator('#terms')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#notify')).toHaveAttribute('aria-checked', 'true');
    await expect(radio(page, 'Team')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#country')).toHaveText('France');
    await expect(tag(page, 'Alpha')).toHaveAttribute('aria-selected', 'true');
    await expect(tag(page, 'Beta')).toHaveAttribute('aria-selected', 'false');
    await expect(tag(page, 'Gamma')).toHaveAttribute('aria-selected', 'true');
    // Programmatic writes are not user edits.
    await expect(page.locator('#dirty')).toHaveText('pristine');
  });

  test('pointer changes reach the form model once and mark the form dirty', async ({ page }) => {
    await page.locator('#terms').click();
    await page.locator('#notify').click();
    await radio(page, 'Pro').click();
    await page.locator('#country').click();
    await option(page, 'Germany').click();
    await tag(page, 'Beta').click();
    await tag(page, 'Gamma').click();

    await expect
      .poll(() => form(page))
      .toEqual({
        terms: true,
        notify: true,
        plan: 'pro',
        country: 'Germany',
        tags: ['beta', 'gamma'],
      });
    await expect(page.locator('#dirty')).toHaveText('dirty');
    await expect(page.locator('#country')).toHaveText('Germany');
  });
});

test.describe('validation, touched and submit', () => {
  test('submitting an invalid form shows errors and does not submit', async ({ page }) => {
    await page.locator('#submit').click();
    await expect(page.locator('#terms-error')).toBeVisible();
    await expect(page.locator('#plan-error')).toBeVisible();
    await expect(page.locator('#country-error')).toBeVisible();
    await expect(page.locator('#submitted')).toHaveText('');
  });

  test('a control becomes touched only after focus really leaves it', async ({ page }) => {
    await page.locator('#terms').focus();
    await expect(page.locator('#terms-error')).toHaveCount(0);
    await page.locator('#notify').focus();
    await expect(page.locator('#terms-error')).toBeVisible();

    // Moving between radios keeps the group untouched until focus leaves the group.
    await radio(page, 'Free').focus();
    await radio(page, 'Pro').focus();
    await expect(page.locator('#plan-error')).toHaveCount(0);
    await page.locator('#notify').focus();
    await expect(page.locator('#plan-error')).toBeVisible();
  });

  test('correcting the errors and submitting delivers the exact form value', async ({ page }) => {
    await page.locator('#submit').click();
    await page.locator('#terms').click();
    await radio(page, 'Team').click();
    await page.locator('#country').click();
    await option(page, 'Spain').click();
    await expect(page.locator('#valid')).toHaveText('valid');
    await expect(page.locator('#terms-error')).toHaveCount(0);

    await page.locator('#submit').click();
    await expect
      .poll(async () => JSON.parse((await page.locator('#submitted').innerText()) || 'null'))
      .toEqual({
        terms: true,
        notify: false,
        plan: 'team',
        country: 'Spain',
        tags: null,
      });
  });

  test('behaviour buttons never submit the form by themselves', async ({ page }) => {
    await page.locator('#terms').click();
    await radio(page, 'Free').click();
    await page.locator('#country').click();
    await option(page, 'France').click();
    await tag(page, 'Alpha').click();
    await expect(page.locator('#submitted')).toHaveText('');
  });
});

test.describe('reset and disabled', () => {
  test('reset restores the empty state in the DOM and the model', async ({ page }) => {
    await page.locator('#prefill').click();
    await page.locator('#reset').click();

    await expect(page.locator('#terms')).toHaveAttribute('aria-checked', 'false');
    await expect(page.locator('#notify')).toHaveAttribute('aria-checked', 'false');
    await expect(radio(page, 'Team')).toHaveAttribute('aria-checked', 'false');
    await expect(page.locator('#country')).toHaveText('Choose a country');
    await expect(tag(page, 'Alpha')).toHaveAttribute('aria-selected', 'false');
    await expect
      .poll(() => form(page))
      .toEqual({
        terms: false,
        notify: false,
        plan: null,
        country: null,
        tags: null,
      });
  });

  test('a disabled form blocks every control and keeps its values', async ({ page }) => {
    await page.locator('#prefill').click();
    await page.locator('#toggle-disabled').click();

    await expect(page.locator('#terms')).toBeDisabled();
    await expect(page.locator('#notify')).toBeDisabled();
    await expect(radio(page, 'Free')).toBeDisabled();
    await expect(page.locator('#country')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('#tags')).toHaveAttribute('aria-disabled', 'true');

    await page.locator('#country').click({ force: true });
    await tag(page, 'Beta').click({ force: true });
    await expect(countryList(page)).toHaveCount(0);
    await page.locator('#country').focus();
    await page.keyboard.press('ArrowDown');
    await expect(countryList(page)).toHaveCount(0);
    await expect
      .poll(() => form(page))
      .toEqual({
        terms: true,
        notify: true,
        plan: 'team',
        country: 'France',
        tags: ['alpha', 'gamma'],
      });

    await page.locator('#toggle-disabled').click();
    await expect(page.locator('#terms')).toBeEnabled();
    await page.locator('#terms').click();
    await expect(page.locator('#terms')).toHaveAttribute('aria-checked', 'false');
  });
});

test.describe('keyboard only', () => {
  test('completes and submits the form without a pointer', async ({ page }) => {
    await page.locator('#terms').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#terms')).toHaveAttribute('aria-checked', 'true');

    // macOS WebKit does not put plain <button>s in the Tab order, so move between buttons by focus.
    await page.locator('#notify').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#notify')).toHaveAttribute('aria-checked', 'true');

    // Roving tabindex: one Tab stop for the whole radio group; arrows move and select.
    await page.keyboard.press('Tab');
    expect(await activeText(page)).toBe('Free');
    await page.keyboard.press('ArrowRight');
    expect(await activeText(page)).toBe('Pro');
    await expect(radio(page, 'Pro')).toHaveAttribute('aria-checked', 'true');

    // Select: open with the keyboard, move, commit with Enter, focus returns to the trigger.
    await page.locator('#country').focus();
    await page.keyboard.press('Enter');
    await expect(countryList(page)).toBeVisible();
    await expect.poll(() => activeText(page)).toBe('Spain');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(countryList(page)).toHaveCount(0);
    expect(await activeId(page)).toBe('country');
    await expect(page.locator('#country')).toHaveText('France');

    // Multiple listbox: arrows move the active option, Space toggles.
    await page.locator('#tags').focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await expect(tag(page, 'Beta')).toHaveAttribute('aria-selected', 'true');
    await expect(tag(page, 'Gamma')).toHaveAttribute('aria-selected', 'true');

    await page.locator('#submit').focus();
    await page.keyboard.press('Enter');
    await expect
      .poll(async () => JSON.parse((await page.locator('#submitted').innerText()) || 'null'))
      .toEqual({
        terms: true,
        notify: true,
        plan: 'pro',
        country: 'France',
        tags: ['beta', 'gamma'],
      });
  });

  test('Select: Escape closes without committing; Tab leaves from the trigger', async ({
    page,
  }) => {
    await page.locator('#country').focus();
    await page.keyboard.press('ArrowDown');
    await expect(countryList(page)).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await expect(countryList(page)).toHaveCount(0);
    expect(await activeId(page)).toBe('country');
    await expect.poll(async () => (await form(page)).country).toBeNull();

    await page.keyboard.press('ArrowDown');
    await expect(countryList(page)).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(countryList(page)).toHaveCount(0);
    // Focus continues from the trigger's place in the page, not from the end of <body>.
    expect(await activeId(page)).not.toBe('country');
    expect(await activeId(page)).toBe('tags');
    await expect.poll(async () => (await form(page)).country).toBeNull();
  });
});

test.describe('Select inside a Dialog', () => {
  test('commits to its own control, Escape closes only the listbox, focus is restored', async ({
    page,
  }) => {
    await page.locator('#open-dialog').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#dialog-content')).toBeVisible();

    await page.locator('#size').focus();
    await page.keyboard.press('Enter');
    await expect(sizeList(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sizeList(page)).toHaveCount(0);
    await expect(page.locator('#dialog-content')).toBeVisible();
    expect(await activeId(page)).toBe('size');

    await page.keyboard.press('Enter');
    await expect.poll(() => activeText(page)).toBe('Small');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.locator('#size')).toHaveText('M');
    await expect(page.locator('#dialog-value')).toHaveText('M');
    await expect(page.locator('#dialog-content')).toBeVisible();

    await page.locator('#dialog-close').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#dialog-content')).toHaveCount(0);
    await expect(page.locator('#dialog-value')).toHaveText('M');
    await expect.poll(() => overlayResidue(page)).toBe(0);
  });
});

test.describe('RTL', () => {
  test('horizontal radio arrows follow the reading direction and the form still submits', async ({
    page,
  }) => {
    await page.goto('/e2e-forms?dir=rtl');
    await expect(page.locator('#app')).toHaveAttribute('dir', 'rtl');

    await radio(page, 'Pro').focus();
    await page.keyboard.press('ArrowLeft');
    expect(await activeText(page)).toBe('Team');
    await expect(radio(page, 'Team')).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('ArrowRight');
    expect(await activeText(page)).toBe('Pro');

    await page.locator('#country').click();
    await option(page, 'France').click();
    await page.locator('#terms').click();
    await page.locator('#submit').click();
    await expect
      .poll(async () => JSON.parse((await page.locator('#submitted').innerText()) || 'null'))
      .toMatchObject({
        terms: true,
        plan: 'pro',
        country: 'France',
      });
  });
});

test.describe('cleanup and repetition', () => {
  test('repeated open/select cycles leave no overlay residue and keep the value stable', async ({
    page,
  }) => {
    const options = ['Spain', 'France', 'Germany'];
    for (let i = 0; i < 6; i++) {
      await page.locator('#country').click();
      await expect(countryList(page)).toBeVisible();
      await option(page, options[i % 3]).click();
      await expect(countryList(page)).toHaveCount(0);
      await expect
        .poll(async () => (await form(page)).country)
        .toBe(['Spain', 'France', 'Germany'][i % 3]);
    }
    // Outside pointer closes without committing and without residue.
    await page.locator('#country').click();
    await expect(countryList(page)).toBeVisible();
    await page.locator('h1').click();
    await expect(countryList(page)).toHaveCount(0);
    await expect.poll(async () => (await form(page)).country).toBe('Germany');
    await expect.poll(() => overlayResidue(page)).toBe(0);
  });
});

test.describe('automated accessibility scan', () => {
  // A scanner finds only a subset of problems; this is a regression net, not certification.
  async function scan(page: Page, include: string) {
    const results = await new AxeBuilder({ page })
      .include(include)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    return results.violations.map(
      (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
    );
  }

  test('the form, an open Select popup and error messages have no detectable violations', async ({
    page,
  }) => {
    await page.locator('#submit').click();
    await expect(page.locator('#terms-error')).toBeVisible();
    expect(await scan(page, '#form')).toEqual([]);

    await page.locator('#country').focus();
    await page.keyboard.press('Enter');
    const listbox = countryList(page);
    await expect(listbox).toBeVisible();
    // The popup is named without any consumer-provided label on the listbox itself.
    await expect(listbox).not.toHaveAttribute('aria-label', /.+/);
    expect(await scan(page, '[role="listbox"][aria-labelledby]')).toEqual([]);
  });
});
