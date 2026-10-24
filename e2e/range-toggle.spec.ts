import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Real-browser checks for the Quartz 0.11 range & toggle controls against /e2e-range, in
 * Chromium, Firefox and WebKit: keyboard, real pointer geometry and capture, RTL/vertical,
 * committed events, Angular Forms and cleanup, plus axe scans of the interactive states.
 * `pointercancel` cannot be produced by a mouse, so it is dispatched as a real PointerEvent.
 */

const text = (page: Page, id: string) => page.locator(`#${id}`).innerText();
const slider = (page: Page, name: string) => page.getByRole('slider', { name, exact: true });
// The fixture is taller than the viewport: scroll first so real mouse coordinates are on screen.
const box = async (locator: Locator) => {
  await locator.scrollIntoViewIfNeeded();
  const b = await locator.boundingBox();
  if (!b) throw new Error('element has no box');
  return b;
};
/** Point inside `locator` at a fraction of its width (x) and height (y). */
const point = async (locator: Locator, fx: number, fy = 0.5) => {
  const b = await box(locator);
  return { x: b.x + b.width * fx, y: b.y + b.height * fy };
};
const drag = async (page: Page, from: { x: number; y: number }, to: { x: number; y: number }) => {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2);
  await page.mouse.move(to.x, to.y);
  await page.mouse.up();
};
/** Records `defaultPrevented` of every keydown that bubbles to the document. */
const trackKeydowns = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __prevented: boolean[] };
    w.__prevented = [];
    document.addEventListener('keydown', (e) => w.__prevented.push(e.defaultPrevented));
  });
const prevented = (page: Page) =>
  page.evaluate(() => (window as unknown as { __prevented: boolean[] }).__prevented);

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e-range');
  await expect(page.locator('#app[data-ready]')).toBeAttached();
  await expect(page.locator('#s-basic')).toBeVisible();
});

test.describe('Slider', () => {
  test('keyboard: arrows, page, home/end, committed once per step, scroll prevented', async ({
    page,
  }) => {
    await trackKeydowns(page);
    const thumb = slider(page, 'Basic');
    await thumb.focus();
    for (const key of ['ArrowRight', 'PageUp', 'End', 'ArrowLeft', 'ArrowDown', 'Home']) {
      await page.keyboard.press(key);
    }
    await page.keyboard.press('Home'); // already at min: no commit
    await expect(page.locator('#s-basic-out')).toHaveText('0');
    await expect(page.locator('#s-basic-log')).toHaveText('21;31;100;99;98;0');
    expect((await prevented(page)).every(Boolean)).toBe(true);
    await expect(thumb).toHaveAttribute('aria-valuenow', '0');
    await expect(thumb).toHaveAttribute('aria-valuemin', '0');
    await expect(thumb).toHaveAttribute('aria-valuemax', '100');
    await expect(thumb).toHaveAttribute('aria-orientation', 'horizontal');
  });

  test('decimal step does not drift', async ({ page }) => {
    await slider(page, 'Decimal').focus();
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowUp');
    await expect(page.locator('#s-decimal-out')).toHaveText('0.3');
    for (let i = 0; i < 7; i++) await page.keyboard.press('ArrowUp');
    await expect(page.locator('#s-decimal-out')).toHaveText('1');
  });

  test('RTL: keyboard and pointer are mirrored', async ({ page }) => {
    const thumb = slider(page, 'Right to left');
    await thumb.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#s-rtl-out')).toHaveText('1');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#s-rtl-out')).toHaveText('0');
    // 10% from the physical left is 90% of the way from the (right-hand) minimum.
    await page.mouse.click(
      ...(Object.values(await point(page.locator('#s-rtl'), 0.1)) as [number, number]),
    );
    await expect(page.locator('#s-rtl-out')).toHaveText('90');
  });

  test('vertical: arrow keys and bottom-up pointer geometry', async ({ page }) => {
    const thumb = slider(page, 'Vertical');
    await expect(thumb).toHaveAttribute('aria-orientation', 'vertical');
    await thumb.focus();
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('#s-vertical-out')).toHaveText('51');
    const p = await point(page.locator('#s-vertical'), 0.5, 0.75); // 25% from the bottom
    await page.mouse.click(p.x, p.y);
    await expect(page.locator('#s-vertical-out')).toHaveText('25');
  });

  test('drag updates, keeps capture outside the element and ends on release', async ({ page }) => {
    const root = page.locator('#s-basic');
    const b = await box(root);
    await page.mouse.move(b.x + 40, b.y + 12);
    await page.mouse.down();
    await expect(root).toHaveAttribute('data-qz-dragging', '');
    await expect(slider(page, 'Basic')).toBeFocused();
    await page.mouse.move(b.x + 120, b.y + 12);
    await expect(page.locator('#s-basic-out')).toHaveText('60');
    await page.mouse.move(b.x + 400, b.y + 300); // far outside: pointer capture keeps it live
    await expect(page.locator('#s-basic-out')).toHaveText('100');
    await page.mouse.up();
    await expect(root).not.toHaveAttribute('data-qz-dragging');
    await page.mouse.move(b.x + 20, b.y + 12);
    await expect(page.locator('#s-basic-out')).toHaveText('100');
  });

  test('an external model write during a drag applies, then the pointer wins again', async ({
    page,
  }) => {
    const b = await box(page.locator('#s-basic'));
    await page.mouse.move(b.x + 60, b.y + 12);
    await page.mouse.down();
    await expect(page.locator('#s-basic-out')).toHaveText('30');
    await page.evaluate(() => document.querySelector<HTMLElement>('#s-basic-set')?.click());
    await expect(page.locator('#s-basic-out')).toHaveText('70');
    await page.mouse.move(b.x + 100, b.y + 12);
    await expect(page.locator('#s-basic-out')).toHaveText('50');
    await page.mouse.up();
  });

  test('pointercancel ends the gesture', async ({ page }) => {
    const root = page.locator('#s-basic');
    const b = await box(root);
    await page.evaluate(() => {
      const el = document.querySelector('#s-basic') as HTMLElement;
      el.addEventListener(
        'pointerdown',
        (e) => ((window as never as { __pid: number }).__pid = e.pointerId),
        {
          once: true,
        },
      );
    });
    await page.mouse.move(b.x + 60, b.y + 12);
    await page.mouse.down();
    await expect(root).toHaveAttribute('data-qz-dragging', '');
    await page.evaluate(() => {
      const pointerId = (window as never as { __pid: number }).__pid;
      document
        .querySelector('#s-basic')
        ?.dispatchEvent(new PointerEvent('pointercancel', { pointerId, bubbles: true }));
    });
    await expect(root).not.toHaveAttribute('data-qz-dragging');
    await page.mouse.move(b.x + 180, b.y + 12);
    await expect(page.locator('#s-basic-out')).toHaveText('30');
    await page.mouse.up();
  });

  test('lostpointercapture ends the gesture', async ({ page }) => {
    // Chromium delivers a real lostpointercapture after releasePointerCapture; Firefox and WebKit
    // do not deliver one for an explicit release, so the event is dispatched with the real
    // pointer id in every engine.
    const root = page.locator('#s-basic');
    const b = await box(root);
    await page.evaluate(() => {
      const el = document.querySelector('#s-basic') as HTMLElement;
      el.addEventListener(
        'pointerdown',
        (e) => ((window as never as { __pid: number }).__pid = e.pointerId),
        {
          once: true,
        },
      );
    });
    await page.mouse.move(b.x + 60, b.y + 12);
    await page.mouse.down();
    await expect(root).toHaveAttribute('data-qz-dragging', '');
    await page.evaluate(() => {
      const pointerId = (window as never as { __pid: number }).__pid;
      document
        .querySelector('#s-basic')
        ?.dispatchEvent(new PointerEvent('lostpointercapture', { pointerId, bubbles: false }));
    });
    await expect(root).not.toHaveAttribute('data-qz-dragging');
    await page.mouse.move(b.x + 180, b.y + 12);
    await expect(page.locator('#s-basic-out')).toHaveText('30');
    await page.mouse.up();
  });

  test('disabling during a drag cancels it; disabled sliders ignore input', async ({ page }) => {
    const target = page.locator('#s-dragdisable');
    const b = await box(target);
    await page.mouse.move(b.x + 80, b.y + 12);
    await page.mouse.down();
    await expect(target).toHaveAttribute('data-qz-dragging', '');
    await page.evaluate(() => document.querySelector<HTMLElement>('#s-basic-disable')?.click());
    await expect(target).not.toHaveAttribute('data-qz-dragging');
    await page.mouse.move(b.x + 180, b.y + 12);
    await expect(page.locator('#s-dragdisable-out')).toHaveText('40');
    await page.mouse.up();

    const disabled = slider(page, 'Disabled');
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await expect(disabled).toHaveAttribute('aria-valuenow', '30');
    await expect(disabled).toBeDisabled();
  });
});

test.describe('RangeSlider', () => {
  const thumbs = (page: Page, a = 'Minimum price', b = 'Maximum price') => ({
    low: slider(page, a),
    high: slider(page, b),
  });

  test('exposes two named sliders with coordinated aria bounds and geometry hooks', async ({
    page,
  }) => {
    const { low, high } = thumbs(page);
    await expect(low).toHaveAttribute('aria-valuenow', '20');
    await expect(low).toHaveAttribute('aria-valuemax', '80');
    await expect(high).toHaveAttribute('aria-valuenow', '80');
    await expect(high).toHaveAttribute('aria-valuemin', '20');
    await expect(page.locator('#r-basic')).not.toHaveAttribute('tabindex');
    const style = await page.locator('#r-basic').getAttribute('style');
    expect(style).toContain('--qz-range-low-percent: 20%');
    expect(style).toContain('--qz-range-high-percent: 80%');
  });

  test('low and high thumbs drag independently', async ({ page }) => {
    const root = page.locator('#r-basic');
    const b = await box(root);
    await drag(page, { x: b.x + 40, y: b.y + 12 }, { x: b.x + 80, y: b.y + 12 });
    await expect(page.locator('#r-basic-out')).toHaveText('40-80');
    await drag(page, { x: b.x + 160, y: b.y + 12 }, { x: b.x + 120, y: b.y + 12 });
    await expect(page.locator('#r-basic-out')).toHaveText('40-60');
    await expect(page.locator('#r-basic-log')).toContainText('{"low":40,"high":80}');
    await expect(root).not.toHaveAttribute('data-qz-dragging');
  });

  test('thumbs never cross, even when dragged past each other', async ({ page }) => {
    const b = await box(page.locator('#r-basic'));
    await drag(page, { x: b.x + 40, y: b.y + 12 }, { x: b.x + 190, y: b.y + 12 });
    await expect(page.locator('#r-basic-out')).toHaveText('80-80');
    const { low, high } = thumbs(page);
    await expect(low).toHaveAttribute('aria-valuemax', '80');
    await expect(high).toHaveAttribute('aria-valuemin', '80');
  });

  test('track press picks the nearest thumb; ties go to low', async ({ page }) => {
    const b = await box(page.locator('#r-basic'));
    await page.mouse.click(b.x + 190, b.y + 3); // nearer high
    await expect(page.locator('#r-basic-out')).toHaveText('20-95');
    await page.mouse.click(b.x + 20, b.y + 3); // nearer low
    await expect(page.locator('#r-basic-out')).toHaveText('10-95');
    await page.locator('#r-basic-set').click(); // 10-90 → press the midpoint (50): tie → low
    await page.mouse.click(b.x + 100, b.y + 3);
    await expect(page.locator('#r-basic-out')).toHaveText('50-90');
  });

  test('minimum distance is enforced for pointer and keyboard', async ({ page }) => {
    const b = await box(page.locator('#r-distance'));
    await drag(page, { x: b.x + 40, y: b.y + 12 }, { x: b.x + 190, y: b.y + 12 });
    await expect(page.locator('#r-distance-out')).toHaveText('40-60');
    const { low, high } = thumbs(page, 'Distance low', 'Distance high');
    await expect(low).toHaveAttribute('aria-valuemax', '40');
    await expect(high).toHaveAttribute('aria-valuemin', '60');
    await high.focus();
    await page.keyboard.press('Home');
    await expect(page.locator('#r-distance-out')).toHaveText('40-60');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#r-distance-out')).toHaveText('40-61');
  });

  test('keyboard: each thumb operable, tab order low → high, commits once per change', async ({
    page,
  }) => {
    const { low, high } = thumbs(page);
    await low.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('End');
    await page.keyboard.press('End');
    await expect(page.locator('#r-basic-out')).toHaveText('80-80');
    await page.keyboard.press('Tab');
    await expect(high).toBeFocused();
    await page.keyboard.press('PageDown');
    await expect(page.locator('#r-basic-out')).toHaveText('80-80');
    await page.keyboard.press('End');
    await expect(page.locator('#r-basic-out')).toHaveText('80-100');
    await expect(page.locator('#r-basic-log')).toHaveText(
      '{"low":21,"high":80};{"low":80,"high":80};{"low":80,"high":100}',
    );
  });

  test('RTL and vertical geometry', async ({ page }) => {
    const rtl = page.locator('#r-rtl');
    const b = await box(rtl);
    await page.mouse.click(b.x + 20, b.y + 3); // 10% from the left = 90 in RTL → nearer high
    await expect(page.locator('#r-rtl-out')).toHaveText('20-90');
    await slider(page, 'RTL low').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#r-rtl-out')).toHaveText('21-90');

    const vb = await box(page.locator('#r-vertical'));
    await page.mouse.click(vb.x + 3, vb.y + vb.height * 0.9); // 10% from the bottom → low
    await expect(page.locator('#r-vertical-out')).toHaveText('10-80');
    await expect(slider(page, 'Vertical low')).toHaveAttribute('aria-orientation', 'vertical');
  });

  test('destroying the slider during a drag leaves the page healthy', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const b = await box(page.locator('#r-temp'));
    await page.mouse.move(b.x + 20, b.y + 12);
    await page.mouse.down();
    await page.evaluate(() => document.querySelector<HTMLElement>('#r-temp-remove')?.click());
    await expect(page.locator('#r-temp')).toHaveCount(0);
    await page.mouse.move(b.x + 100, b.y + 12);
    await page.mouse.up();
    expect(errors).toEqual([]);
  });

  test('navigating away mid-drag does not throw', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const b = await box(page.locator('#r-basic'));
    await page.mouse.move(b.x + 40, b.y + 12);
    await page.mouse.down();
    await page.evaluate(() => document.querySelector<HTMLElement>('#leave')?.click());
    await expect(page).toHaveURL(/\/$/);
    await page.mouse.up();
    expect(errors).toEqual([]);
  });
});

test.describe('Toggle and ToggleGroup', () => {
  test('Toggle: Enter and Space each activate once; external writes are silent', async ({
    page,
  }) => {
    const button = page.locator('#t-bold');
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Space');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await button.click();
    await expect(page.locator('#t-bold-log')).toHaveText('true;false;true');
    await page.locator('#t-bold-set').click();
    await expect(page.locator('#t-bold-log')).toHaveText('true;false;true');
    await expect(button).toHaveAttribute('type', 'button');
  });

  test('single: selects, switches and deselects; disabled item is inert', async ({ page }) => {
    const group = page.locator('#g-single');
    await expect(group).toHaveAttribute('role', 'group');
    await group.getByRole('button', { name: 'Left' }).click();
    await group.getByRole('button', { name: 'Center' }).click();
    await expect(page.locator('#g-single-out')).toHaveText('center');
    await expect(group.getByRole('button', { name: 'Left' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await group.getByRole('button', { name: 'Center' }).click();
    await expect(page.locator('#g-single-out')).toHaveText('none');
    await expect(page.locator('#g-single-log')).toHaveText('"left";"center";null');
    await expect(group.getByRole('button', { name: 'Right' })).toBeDisabled();
  });

  test('multiple: toggles members and commits arrays', async ({ page }) => {
    const group = page.locator('#g-multiple');
    await group.getByRole('button', { name: 'Bold' }).click();
    await group.getByRole('button', { name: 'Italic' }).click();
    await expect(page.locator('#g-multiple-out')).toHaveText('["b","i"]');
    await group.getByRole('button', { name: 'Bold' }).click();
    await expect(page.locator('#g-multiple-out')).toHaveText('["i"]');
    await expect(page.locator('#g-multiple-log')).toHaveText('["b"];["b","i"];["i"]');
  });

  test('allowDeselection=false keeps the single value', async ({ page }) => {
    const group = page.locator('#g-nodeselect');
    const a = group.getByRole('button', { name: 'A', exact: true });
    await a.click();
    await expect(page.locator('#g-nodeselect-out')).toHaveText('a');
    await expect(a).toHaveAttribute('aria-pressed', 'true');
    await group.getByRole('button', { name: 'B', exact: true }).click();
    await group.getByRole('button', { name: 'B', exact: true }).click();
    await expect(page.locator('#g-nodeselect-out')).toHaveText('b');
  });

  test('roving focus: one tab stop, arrows move focus without selecting, disabled skipped', async ({
    page,
  }) => {
    const group = page.locator('#g-single');
    const items = group.getByRole('button');
    await expect(group.locator('[tabindex="0"]')).toHaveCount(1);
    await group.getByRole('button', { name: 'Left' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(group.getByRole('button', { name: 'Center' })).toBeFocused();
    await page.keyboard.press('ArrowRight'); // skips the disabled "Right"
    await expect(group.getByRole('button', { name: 'Justify' })).toBeFocused();
    await page.keyboard.press('ArrowRight'); // wraps
    await expect(group.getByRole('button', { name: 'Left' })).toBeFocused();
    await page.keyboard.press('End');
    await expect(group.getByRole('button', { name: 'Justify' })).toBeFocused();
    await page.keyboard.press('Home');
    await expect(group.getByRole('button', { name: 'Left' })).toBeFocused();
    await expect(page.locator('#g-single-out')).toHaveText('none');
    await expect(page.locator('#g-single-log')).toHaveText('');
    await expect(items.first()).toHaveAttribute('tabindex', '0');
    await page.keyboard.press('Space');
    await expect(page.locator('#g-single-out')).toHaveText('left');
    await page.keyboard.press('Tab');
    await expect(group.locator('button:focus')).toHaveCount(0);
  });

  test('RTL and vertical arrow mapping', async ({ page }) => {
    const rtl = page.locator('#g-rtl');
    await rtl.getByRole('button', { name: 'One' }).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(rtl.getByRole('button', { name: 'Two' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(rtl.getByRole('button', { name: 'One' })).toBeFocused();

    const vertical = page.locator('#g-vertical');
    await vertical.getByRole('button', { name: 'X' }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(vertical.getByRole('button', { name: 'Y' })).toBeFocused();
  });
});

test.describe('Angular Forms', () => {
  const value = async (page: Page) => JSON.parse(await text(page, 'f-value'));

  test('user changes commit once, programmatic writes are silent, reset and disabled work', async ({
    page,
  }) => {
    await expect
      .poll(() => value(page))
      .toEqual({
        volume: 10,
        price: { low: 20, high: 80 },
        bold: false,
        align: null,
        marks: [],
      });
    await page.locator('#f-prefill').click();
    await expect(slider(page, 'Form volume')).toHaveAttribute('aria-valuenow', '60');
    await expect(slider(page, 'Form min')).toHaveAttribute('aria-valuenow', '30');
    await expect(page.locator('#f-bold')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#f-align').getByRole('button', { name: 'FRight' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.locator('#f-dirty')).toHaveText('pristine');

    const before = Number(await text(page, 'f-changes'));
    await slider(page, 'Form volume').focus();
    await page.keyboard.press('ArrowRight');
    await slider(page, 'Form max').focus();
    await page.keyboard.press('ArrowLeft');
    await page.locator('#f-bold').click();
    await page.locator('#f-marks').getByRole('button', { name: 'FBold' }).click();
    await expect.poll(async () => Number(await text(page, 'f-changes'))).toBe(before + 4);
    await expect
      .poll(() => value(page))
      .toEqual({
        volume: 61,
        price: { low: 30, high: 69 },
        bold: false,
        align: 'right',
        marks: ['i'],
      });
    await expect(page.locator('#f-dirty')).toHaveText('dirty');

    await page.locator('#f-submit').click();
    await expect(page.locator('#f-submitted')).toContainText('"volume":61');

    await page.locator('#f-reset').click();
    await expect
      .poll(() => value(page))
      .toEqual({
        volume: null,
        price: null,
        bold: null,
        align: null,
        marks: null,
      });
    await expect(slider(page, 'Form volume')).toHaveAttribute('aria-valuenow', '0');
    await expect(slider(page, 'Form min')).toHaveAttribute('aria-valuenow', '0');
    await expect(slider(page, 'Form max')).toHaveAttribute('aria-valuenow', '100');
    await expect(page.locator('#f-bold')).toHaveAttribute('aria-pressed', 'false');

    await page.locator('#f-disable').click();
    await expect(slider(page, 'Form volume')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('#f-bold')).toBeDisabled();
    await expect(page.locator('#f-align')).toHaveAttribute('aria-disabled', 'true');
    await page.locator('#f-align').getByRole('button', { name: 'FLeft' }).click({ force: true });
    await expect.poll(async () => (await value(page)).align).toBeNull();
    await page.locator('#f-disable').click();
    await expect(slider(page, 'Form volume')).not.toHaveAttribute('aria-disabled');
  });

  test('touched fires when focus leaves each control, not when it moves inside', async ({
    page,
  }) => {
    const price = page.locator('#f-price');
    await expect(price).not.toHaveClass(/ng-touched/);
    await slider(page, 'Form min').focus();
    await page.keyboard.press('Tab'); // low → high thumb: still inside the range slider
    await expect(slider(page, 'Form max')).toBeFocused();
    await expect(price).not.toHaveClass(/ng-touched/);
    // Safari does not Tab to buttons by default, so move to the toggle explicitly.
    await page.locator('#f-bold').focus();
    await expect(price).toHaveClass(/ng-touched/);
    await expect(page.locator('#f-bold')).not.toHaveClass(/ng-touched/);
    await page.locator('#f-align').getByRole('button', { name: 'FLeft' }).focus(); // into the group
    await expect(page.locator('#f-bold')).toHaveClass(/ng-touched/);
    await expect(page.locator('#f-align')).not.toHaveClass(/ng-touched/);
    await page.locator('#f-bold').focus(); // out of the group
    await expect(page.locator('#f-align')).toHaveClass(/ng-touched/);
  });
});

test('axe finds no violations in the default and interacted states', async ({ page }) => {
  const scan = () => new AxeBuilder({ page }).include('#app').analyze();
  expect((await scan()).violations).toEqual([]);
  await slider(page, 'Basic').focus();
  await page.keyboard.press('PageUp');
  await page.locator('#g-multiple').getByRole('button', { name: 'Bold' }).click();
  await page.locator('#t-bold').click();
  await page.locator('#f-disable').click();
  expect((await scan()).violations).toEqual([]);
});
