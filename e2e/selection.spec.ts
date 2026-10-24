import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Real-browser contract for the Quartz 0.10 advanced selection: multiple/grouped Select, grouped
 * Listbox, Combobox (local, asynchronous, IME, multiple), Angular Reactive Forms integration,
 * Select inside Dialog, keyboard-only use, RTL and cleanup. Runs against /e2e-selection in
 * Chromium, Firefox and WebKit.
 */

const value = async (page: Page) =>
  JSON.parse(await page.locator('#live-value').innerText()) as Record<string, unknown>;
const changes = async (page: Page) => Number(await page.locator('#changes').innerText());
const option = (page: Page, name: string) => page.getByRole('option', { name, exact: true });
const tagsList = (page: Page) => page.getByRole('listbox', { name: 'Tags' });
const activeText = (page: Page) =>
  page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');
const overlayResidue = (page: Page) =>
  page.evaluate(() => document.querySelectorAll('[data-qz-overlay-container] > *').length);

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e-selection');
  await expect(page.locator('#tags')).toBeVisible();
});

test.describe('multiple and grouped Select', () => {
  test('toggles by pointer without closing and commits an array once per toggle', async ({
    page,
  }) => {
    await page.locator('#tags').click();
    const list = tagsList(page);
    await expect(list).toHaveAttribute('aria-multiselectable', 'true');
    await expect(page.locator('#tags')).toHaveAttribute('aria-expanded', 'true');

    const before = await changes(page);
    await option(page, 'Angular').click();
    await option(page, 'Svelte').click();
    await expect(list).toBeVisible();
    await expect
      .poll(() => value(page))
      .toMatchObject({
        tags: [
          { id: 1, name: 'Angular' },
          { id: 3, name: 'Svelte' },
        ],
      });
    expect(await changes(page)).toBe(before + 2);
    await expect(page.locator('#tags')).toHaveText('Angular, Svelte');
    await expect(option(page, 'Angular')).toHaveAttribute('aria-selected', 'true');

    await option(page, 'Angular').click();
    await expect(option(page, 'Angular')).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('#tags')).toHaveText('Svelte');
    await expect(page.locator('#dirty')).toHaveText('dirty');
  });

  test('exposes accessible groups, a separator, and skips them and disabled options by keyboard', async ({
    page,
  }) => {
    await page.locator('#tags').focus();
    await page.keyboard.press('ArrowDown');
    const list = tagsList(page);
    await expect(list).toBeVisible();
    await expect(page.getByRole('group', { name: 'Frontend' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Backend' })).toBeVisible();
    await expect(list.locator('[aria-hidden="true"][role="presentation"]')).toHaveCount(1);
    await expect(list.getByRole('option')).toHaveCount(4);

    await expect.poll(() => activeText(page)).toBe('Angular');
    await page.keyboard.press('Space'); // toggle Angular
    await page.keyboard.press('ArrowDown'); // React is disabled
    await expect.poll(() => activeText(page)).toBe('Svelte');
    await page.keyboard.press('ArrowDown'); // crosses the separator and the "Backend" label
    await expect.poll(() => activeText(page)).toBe('Node');
    await page.keyboard.press('Enter');
    await expect(list).toBeVisible();
    await expect
      .poll(async () => ((await value(page))['tags'] as { id: number }[]).map((t) => t.id))
      .toEqual([1, 10]);
    expect(await value(page)).toMatchObject({
      tags: expect.not.arrayContaining([{ id: 2, name: 'React' }]),
    });
  });

  test('Escape closes, restores focus to the trigger and keeps the selection', async ({ page }) => {
    await page.locator('#tags').click();
    await option(page, 'Node').click();
    await page.keyboard.press('Escape');
    await expect(tagsList(page)).toBeHidden();
    await expect(page.locator('#tags')).toBeFocused();
    await expect(page.locator('#tags')).toHaveText('Node');
  });

  test('programmatic prefill renders labels and selection without dirtying the form', async ({
    page,
  }) => {
    await page.locator('#prefill').click();
    await expect(page.locator('#tags')).toHaveText('Angular, Node');
    await expect(page.locator('#city')).toHaveValue('Paris');
    await expect(page.locator('#dirty')).toHaveText('pristine');
    await page.locator('#tags').click();
    await expect(option(page, 'Angular')).toHaveAttribute('aria-selected', 'true');
    await expect(option(page, 'Node')).toHaveAttribute('aria-selected', 'true');
    await expect(option(page, 'Svelte')).toHaveAttribute('aria-selected', 'false');
  });
});

test.describe('Listbox sections', () => {
  test('keyboard skips headers and disabled items; selection is independent of the active item', async ({
    page,
  }) => {
    const list = page.locator('#sections');
    await expect(page.getByRole('group', { name: 'Fruit' })).toBeVisible();
    await expect(list.getByRole('option')).toHaveCount(3);
    await list.focus();
    await page.keyboard.press('Home');
    const active = () => list.getAttribute('aria-activedescendant');
    const idOf = (name: string) =>
      list.getByRole('option', { name, exact: true }).getAttribute('id');
    await expect.poll(active).toBe(await idOf('Apple'));
    await page.keyboard.press('ArrowDown'); // Pear is disabled; the "Veg" label and separator are skipped
    await expect.poll(active).toBe(await idOf('Carrot'));
    await expect(list.getByRole('option', { name: 'Carrot' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    await page.keyboard.press('Space');
    await expect(list.getByRole('option', { name: 'Carrot' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect.poll(async () => (await value(page))['sections']).toEqual(['carrot']);
    await page.keyboard.press('ArrowUp');
    await expect.poll(active).toBe(await idOf('Apple'));
    await expect(list.getByRole('option', { name: 'Apple' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });
});

test.describe('Combobox', () => {
  test('typing filters but only choosing commits; editing a selection clears it once', async ({
    page,
  }) => {
    const city = page.locator('#city');
    await city.click();
    await city.fill('pr');
    await expect(city).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('listbox', { name: 'Cities' }).getByRole('option')).toHaveText([
      'Prague',
    ]);
    await expect(value(page).then((v) => v['city'])).resolves.toBeNull();
    const typed = await changes(page);
    await city.press('ArrowDown');
    await city.press('Enter');
    await expect(city).toHaveValue('Prague');
    await expect.poll(async () => (await value(page))['city']).toBe('Prague');
    expect(await changes(page)).toBe(typed + 1);

    await city.press('Backspace'); // editing the label clears the selection
    await expect.poll(async () => (await value(page))['city']).toBeNull();
    expect(await changes(page)).toBe(typed + 2);
    await city.pressSequentially('x'); // typing without a selection commits nothing
    expect(await changes(page)).toBe(typed + 2);
    await expect(page.locator('#city-empty')).toBeVisible();
    await expect(city).toHaveAttribute('aria-expanded', 'true');
  });

  test('allowDeselect clears the committed value when the selected option is chosen again', async ({
    page,
  }) => {
    const city = page.locator('#city');
    await city.fill('par');
    await option(page, 'Paris').click();
    await expect.poll(async () => (await value(page))['city']).toBe('Paris');
    await city.press('ArrowDown');
    await option(page, 'Paris').click();
    await expect.poll(async () => (await value(page))['city']).toBeNull();
    await expect(city).toHaveValue('');
  });

  test('ARIA: controls only while open, no dangling active descendant', async ({ page }) => {
    const city = page.locator('#city');
    await expect(city).toHaveAttribute('role', 'combobox');
    await expect(city).toHaveAttribute('aria-expanded', 'false');
    await expect(city).not.toHaveAttribute('aria-controls', /.+/);
    await city.press('ArrowDown');
    const list = page.getByRole('listbox', { name: 'Cities' });
    await expect(list).toBeVisible();
    await expect(city).toHaveAttribute('aria-controls', (await list.getAttribute('id'))!);
    await expect(city).toHaveAttribute('aria-autocomplete', 'list');
    const activeId = await city.getAttribute('aria-activedescendant');
    expect(activeId).toBeTruthy();
    expect(await page.locator(`[id="${activeId}"]`).count()).toBe(1);
    await city.press('Escape');
    await expect(list).toBeHidden();
    await expect(city).not.toHaveAttribute('aria-activedescendant', /.+/);
    await expect(city).not.toHaveAttribute('aria-controls', /.+/);
    await expect(city).toBeFocused();
  });

  test('asynchronous results: a stale response never replaces a newer one', async ({ page }) => {
    const remote = page.locator('#remote');
    await remote.click();
    await remote.pressSequentially('slow'); // resolves after ~600 ms
    await expect(page.locator('#remote-loading')).toBeVisible();
    await remote.fill('fast'); // supersedes it; resolves after ~50 ms
    const results = page.getByRole('listbox', { name: 'Remote results' }).getByRole('option');
    await expect(results).toHaveText(['fast-1', 'fast-2']);
    await page.waitForTimeout(900); // the aborted "slow" request would have landed by now
    await expect(results).toHaveText(['fast-1', 'fast-2']);
    await expect(page.locator('#remote-loading')).toBeHidden();
    await expect(remote).toHaveAttribute('aria-expanded', 'true');
    await results.first().click();
    await expect.poll(async () => (await value(page))['remote']).toBe('fast-1');
  });

  test('IME composition is neither filtered nor committed until it ends', async ({ page }) => {
    const remote = page.locator('#remote');
    await remote.click();
    const fire = (type: string, data: string, composing: boolean) =>
      remote.evaluate(
        (element, args) => {
          const input = element as HTMLInputElement;
          if (args.type === 'compositionstart') {
            input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
            return;
          }
          if (args.type === 'compositionend') {
            input.value = args.data;
            input.dispatchEvent(
              new CompositionEvent('compositionend', { bubbles: true, data: args.data }),
            );
            return;
          }
          input.value = args.data;
          input.dispatchEvent(
            new InputEvent('input', {
              bubbles: true,
              data: args.data,
              isComposing: args.composing,
            }),
          );
        },
        { type, data, composing },
      );
    await fire('compositionstart', '', true);
    await fire('input', 'に', true);
    await fire('input', 'にほ', true);
    await page.waitForTimeout(150);
    await expect(page.locator('#remote-query')).toHaveText(''); // no query, no request, no filtering
    await expect(remote).toHaveValue('にほ'); // the input text is left to the IME
    await remote.press('Enter'); // belongs to the IME
    await expect(page.getByRole('listbox', { name: 'Remote results' })).toBeHidden();
    await fire('compositionend', 'にほん', false);
    await expect(page.locator('#remote-query')).toHaveText('にほん');
    await expect(
      page.getByRole('listbox', { name: 'Remote results' }).getByRole('option'),
    ).toHaveText(['にほん-1', 'にほん-2']);
  });

  test('multiple Combobox toggles values, keeps the popup open and resets the query', async ({
    page,
  }) => {
    const langs = page.locator('#langs');
    await langs.fill('s');
    const list = page.getByRole('listbox', { name: 'Language results' });
    await expect(list).toHaveAttribute('aria-multiselectable', 'true');
    await option(page, 'Spanish').click();
    await expect(list).toBeVisible();
    await expect(langs).toHaveValue('');
    await expect.poll(async () => (await value(page))['langs']).toEqual(['Spanish']);
    await option(page, 'English').click();
    await expect.poll(async () => (await value(page))['langs']).toEqual(['Spanish', 'English']);
    await expect(option(page, 'English')).toHaveAttribute('aria-selected', 'true');
    await option(page, 'Spanish').click();
    await expect.poll(async () => (await value(page))['langs']).toEqual(['English']);
  });
});

test.describe('forms: reset, disabled, composition', () => {
  test('reset clears controls silently into the documented empty values', async ({ page }) => {
    await page.locator('#prefill').click();
    await page.locator('#city').fill('pa');
    await page.locator('#city').press('Escape'); // the open popup would cover the reset button
    await page.locator('#reset').click();
    await expect
      .poll(() => value(page))
      .toEqual({
        tags: null,
        sections: null,
        city: null,
        remote: null,
        langs: null,
      });
    await expect(page.locator('#tags')).toHaveText('Pick tags');
    await expect(page.locator('#tags')).toHaveAttribute('data-qz-placeholder', '');
    await expect(page.locator('#city')).toHaveValue('');
    await page.locator('#tags').click();
    await expect(page.getByRole('option', { selected: true })).toHaveCount(0);
  });

  test('a disabled form blocks every control and closes nothing it should not', async ({
    page,
  }) => {
    await page.locator('#disable').click();
    await expect(page.locator('#tags')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('#city')).toBeDisabled();
    await expect(page.locator('#langs')).toBeDisabled();
    await expect(page.locator('#sections')).toHaveAttribute('aria-disabled', 'true');
    await page.locator('#tags').click({ force: true });
    await expect(tagsList(page)).toBeHidden();
    await page.locator('#disable').click();
    await expect(page.locator('#city')).toBeEnabled();
    await page.locator('#tags').click();
    await expect(tagsList(page)).toBeVisible();
  });

  test('disabling while the popup is open closes it', async ({ page }) => {
    await page.locator('#tags').click();
    await expect(tagsList(page)).toBeVisible();
    await page.locator('#disable').evaluate((button) => (button as HTMLButtonElement).click());
    await expect(tagsList(page)).toBeHidden();
  });
});

test.describe('composition', () => {
  test('a multiple Select inside a Dialog stays interactive; Escape closes only the listbox', async ({
    page,
  }) => {
    await page.locator('#open-dialog').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const trigger = page.locator('#dialog-tags');
    await trigger.click();
    const list = page.getByRole('listbox', { name: 'Dialog tags' });
    await expect(list).toBeVisible();
    await expect.poll(() => list.evaluate((el) => !el.closest('[inert]'))).toBe(true);
    await option(page, 'One').click();
    await option(page, 'Two').click();
    await expect(page.locator('#dialog-value')).toHaveText(
      '["one","two"]'.replace(/"one"/, '"one"'),
    );
    await page.keyboard.press('Escape');
    await expect(list).toBeHidden();
    await expect(dialog).toBeVisible();
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('keyboard-only: Tab to the trigger, open, toggle, close, continue tabbing', async ({
    page,
  }) => {
    await page.locator('#prefill').focus();
    await page.keyboard.press('Shift+Tab'); // back to the last control before the buttons
    await page.locator('#tags').focus();
    await page.keyboard.press('Enter');
    await expect(tagsList(page)).toBeVisible();
    // Wait for the active option: Space on a slow runner could otherwise beat its activation.
    await expect.poll(() => activeText(page)).toBe('Angular');
    await page.keyboard.press('Space');
    await page.keyboard.press('Tab'); // hands focus back to the trigger before moving on
    await expect(tagsList(page)).toBeHidden();
    await expect
      .poll(async () => (await value(page))['tags'])
      .toEqual([{ id: 1, name: 'Angular' }]);
    expect(await overlayResidue(page)).toBe(0);
  });

  test('cleans up overlays and timers when the route is destroyed', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.locator('#tags').click();
    await expect(tagsList(page)).toBeVisible();
    await page
      .locator('#city')
      .click({ force: true })
      .catch(() => undefined);
    await page.evaluate(() => (document.querySelector('#leave') as HTMLElement).click());
    await expect(page).toHaveURL(/\/$/);
    expect(await overlayResidue(page)).toBe(0);
    expect(errors).toEqual([]);
  });
});

test.describe('RTL', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e-selection?dir=rtl');
    await expect(page.locator('#tags')).toBeVisible();
  });

  test('works right-to-left: popup aligns to the trigger start, vertical keys unchanged', async ({
    page,
  }) => {
    await expect(page.locator('#app')).toHaveAttribute('dir', 'rtl');
    await page.locator('#tags').focus();
    await page.keyboard.press('ArrowDown');
    await expect(tagsList(page)).toBeVisible();
    await expect.poll(() => activeText(page)).toBe('Angular');
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => activeText(page)).toBe('Svelte');
    await page.keyboard.press('Enter');
    await expect.poll(async () => (await value(page))['tags']).toEqual([{ id: 3, name: 'Svelte' }]);
    const trigger = (await page.locator('#tags').boundingBox())!;
    const popup = (await tagsList(page).boundingBox())!;
    expect(Math.abs(popup.x + popup.width - (trigger.x + trigger.width))).toBeLessThanOrEqual(2);
  });
});

test.describe('accessibility (axe)', () => {
  const scan = async (page: Page, selector: string) => {
    const { violations } = await new AxeBuilder({ page }).include(selector).analyze();
    expect(
      violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`),
    ).toEqual([]);
  };

  test('open multiple Select with groups and a selected option', async ({ page }) => {
    await page.locator('#tags').click();
    await option(page, 'Angular').click();
    await expect(tagsList(page)).toBeVisible();
    await scan(page, '[data-qz-overlay-container]');
    await scan(page, '#tags');
  });

  test('open Combobox with an active option, and the grouped Listbox', async ({ page }) => {
    await page.locator('#city').press('ArrowDown');
    await expect(page.getByRole('listbox', { name: 'Cities' })).toBeVisible();
    await scan(page, '[data-qz-overlay-container]');
    await scan(page, '#city');
    await page.keyboard.press('Escape');
    await page.locator('#sections').focus();
    await page.keyboard.press('ArrowDown');
    await scan(page, '#sections');
  });

  test('Select open inside a Dialog', async ({ page }) => {
    await page.locator('#open-dialog').click();
    await page.locator('#dialog-tags').click();
    await expect(page.getByRole('listbox', { name: 'Dialog tags' })).toBeVisible();
    await scan(page, '[data-qz-overlay-container]');
  });
});
