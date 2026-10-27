import type { OverlayFlipAxis, OverlayPlacement } from '@quartz-headless/core';

export type NavigationMenuOrientation = 'horizontal' | 'vertical';

export interface NavigationMenuConfig {
  orientation: NavigationMenuOrientation;
  showDelay: number;
  hideDelay: number;
  placement: OverlayPlacement;
  offset: number;
  flip: boolean;
  flipAxis: OverlayFlipAxis;
}

export const DEFAULT_NAVIGATION_MENU_CONFIG: NavigationMenuConfig = {
  orientation: 'horizontal',
  showDelay: 150,
  hideDelay: 150,
  placement: 'bottom-start',
  offset: 4,
  flip: true,
  flipAxis: 'main',
};
