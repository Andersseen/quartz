import type { ViewportBreakpoint } from '@quartz-headless/core';

export type NavbarBreakpoint = ViewportBreakpoint | number;
export type NavbarRevealMode = 'always' | 'scroll-up';
export type NavbarScrollDirection = 'up' | 'down' | 'none';

export interface NavbarConfig {
  sticky: boolean;
  top: string;
  scrollThreshold: number;
  directionThreshold: number;
  reveal: NavbarRevealMode;
  breakpoint: NavbarBreakpoint;
  closeMenuOnDesktop: boolean;
}

export const DEFAULT_NAVBAR_CONFIG: NavbarConfig = {
  sticky: false,
  top: '0px',
  scrollThreshold: 8,
  directionThreshold: 4,
  reveal: 'always',
  breakpoint: 'md',
  closeMenuOnDesktop: true,
};
