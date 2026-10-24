import { isDevMode } from '@angular/core';
import { resolveDirection } from '@quartz-headless/core';
import type { SliderOrientation } from './slider.types';

/** Internal (not part of the public API): keyboard + pointer geometry shared by Slider and RangeSlider. */
export type SliderKeyAction = 'increment' | 'decrement' | 'page-up' | 'page-down' | 'min' | 'max';

/**
 * WAI-ARIA Slider keyboard mapping. Up/Right increase and Down/Left decrease; Right/Left swap in a
 * horizontal RTL slider (value 0 is at the right). Vertical sliders keep Left/Right usable.
 */
export function sliderKeyAction(
  key: string,
  orientation: SliderOrientation,
  rtl: boolean,
): SliderKeyAction | null {
  const mirrored = orientation === 'horizontal' && rtl;
  switch (key) {
    case 'Home':
      return 'min';
    case 'End':
      return 'max';
    case 'PageUp':
      return 'page-up';
    case 'PageDown':
      return 'page-down';
    case 'ArrowUp':
      return 'increment';
    case 'ArrowDown':
      return 'decrement';
    case 'ArrowRight':
      return mirrored ? 'decrement' : 'increment';
    case 'ArrowLeft':
      return mirrored ? 'increment' : 'decrement';
    default:
      return null;
  }
}

/**
 * Pointer position along the slider as 0..100 from the "min" end. Returns `null` for an element
 * without layout (hidden, detached) so a gesture never writes `NaN`.
 */
export function pointerPercent(
  element: HTMLElement,
  event: PointerEvent,
  orientation: SliderOrientation,
): number | null {
  const rect = element.getBoundingClientRect();
  let percent: number;
  if (orientation === 'vertical') {
    if (!rect.height) return null;
    percent = ((rect.bottom - event.clientY) / rect.height) * 100;
  } else {
    if (!rect.width) return null;
    const physical = ((event.clientX - rect.left) / rect.width) * 100;
    percent = resolveDirection(element) === 'rtl' ? 100 - physical : physical;
  }
  return Math.min(100, Math.max(0, percent));
}

/** Development-only: a slider thumb must be named by its consumer; Quartz never invents a name. */
export function warnUnnamedThumb(element: HTMLElement, label: string): void {
  if (!isDevMode()) return;
  const named =
    element.getAttribute('aria-label')?.trim() ||
    element.getAttribute('aria-labelledby')?.trim() ||
    element.textContent?.trim();
  if (!named) {
    console.warn(
      `[Quartz] ${label} has no accessible name. Add aria-label, aria-labelledby or text content.`,
    );
  }
}
