import { OverlayFlipAxis, OverlayPlacement, OverlayPosition } from './overlay.types';

const FLIP_MAP: Record<OverlayPlacement, OverlayPlacement> = {
  top: 'bottom',
  'top-start': 'bottom-start',
  'top-end': 'bottom-end',
  bottom: 'top',
  'bottom-start': 'top-start',
  'bottom-end': 'top-end',
  left: 'right',
  'left-start': 'right-start',
  'left-end': 'right-end',
  right: 'left',
  'right-start': 'left-start',
  'right-end': 'left-end',
};

function computeRaw(
  anchor: DOMRect,
  overlay: { width: number; height: number },
  placement: OverlayPlacement,
  offset: number,
): { top: number; left: number } {
  const { top, bottom, left, right, width, height } = anchor;
  const ow = overlay.width;
  const oh = overlay.height;

  switch (placement) {
    case 'bottom':
      return { top: bottom + offset, left: left + width / 2 - ow / 2 };
    case 'bottom-start':
      return { top: bottom + offset, left };
    case 'bottom-end':
      return { top: bottom + offset, left: right - ow };
    case 'top':
      return { top: top - oh - offset, left: left + width / 2 - ow / 2 };
    case 'top-start':
      return { top: top - oh - offset, left };
    case 'top-end':
      return { top: top - oh - offset, left: right - ow };
    case 'left':
      return { top: top + height / 2 - oh / 2, left: left - ow - offset };
    case 'left-start':
      return { top, left: left - ow - offset };
    case 'left-end':
      return { top: bottom - oh, left: left - ow - offset };
    case 'right':
      return { top: top + height / 2 - oh / 2, left: right + offset };
    case 'right-start':
      return { top, left: right + offset };
    case 'right-end':
      return { top: bottom - oh, left: right + offset };
  }
}

function fitsInViewport(
  pos: { top: number; left: number },
  overlay: { width: number; height: number },
  viewport: { width: number; height: number },
  margin = 8,
): boolean {
  return (
    pos.top >= margin &&
    pos.left >= margin &&
    pos.top + overlay.height <= viewport.height - margin &&
    pos.left + overlay.width <= viewport.width - margin
  );
}

export function calculatePosition(
  anchorRect: DOMRect,
  overlayEl: HTMLElement,
  placement: OverlayPlacement,
  offset: number,
  flip: boolean,
  flipAxis: OverlayFlipAxis = 'main',
  viewport?: { width: number; height: number },
): OverlayPosition {
  const resolvedViewport = viewport ?? {
    width: globalThis.window?.innerWidth ?? 0,
    height: globalThis.window?.innerHeight ?? 0,
  };
  const ow = overlayEl.offsetWidth;
  const oh = overlayEl.offsetHeight;
  const overlay = { width: ow, height: oh };

  let resolvedPlacement = placement;
  let pos = computeRaw(anchorRect, overlay, placement, offset);

  // `flipAxis` controls which axis may be flipped. The current implementation
  // supports main-axis flipping; cross-axis and both-axis flipping are not yet
  // implemented and fall back to main-axis behavior. `none` disables flipping.
  const canFlip = flip && flipAxis !== 'none';
  if (canFlip && !fitsInViewport(pos, overlay, resolvedViewport)) {
    const flipped = FLIP_MAP[placement];
    const flippedPos = computeRaw(anchorRect, overlay, flipped, offset);
    if (fitsInViewport(flippedPos, overlay, resolvedViewport)) {
      pos = flippedPos;
      resolvedPlacement = flipped;
    }
  }

  // Clamp to viewport with margin
  const margin = 8;
  pos.left = Math.max(margin, Math.min(pos.left, resolvedViewport.width - ow - margin));
  pos.top = Math.max(margin, Math.min(pos.top, resolvedViewport.height - oh - margin));

  return { top: pos.top, left: pos.left, placement: resolvedPlacement };
}
