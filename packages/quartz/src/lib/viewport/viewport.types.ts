/**
 * Predefined breakpoint names used by the ViewportService.
 */
export type ViewportBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Map of breakpoint names to pixel widths.
 */
export interface ViewportBreakpoints {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

/**
 * Result of matching all predefined breakpoints.
 */
export interface ViewportMatchResult {
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
}

/** Default breakpoints following Tailwind conventions. */
export const DEFAULT_BREAKPOINTS: ViewportBreakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};
