import type { ViewportBreakpoint } from '@quartz-headless/core';

export type SidebarMode = 'push' | 'overlay';
export type SidebarSide = 'inline-start' | 'inline-end';
export type SidebarState = 'expanded' | 'collapsed' | 'closed';
export type SidebarFocusMode = 'none' | 'initial' | 'trap';
export type SidebarBreakpoint = ViewportBreakpoint | number;

export interface SidebarConfig {
  desktopMode: SidebarMode;
  mobileMode: SidebarMode;
  breakpoint: SidebarBreakpoint;
  side: SidebarSide;
  scrollLock: boolean;
  focusMode: SidebarFocusMode;
  autoCloseOnMobile: boolean;
}

export const DEFAULT_SIDEBAR_CONFIG: SidebarConfig = {
  desktopMode: 'push',
  mobileMode: 'overlay',
  breakpoint: 'md',
  side: 'inline-start',
  scrollLock: true,
  focusMode: 'initial',
  autoCloseOnMobile: true,
};
