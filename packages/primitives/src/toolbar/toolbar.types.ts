export type ToolbarOrientation = 'horizontal' | 'vertical';

export interface ToolbarConfig {
  orientation: ToolbarOrientation;
}

export const DEFAULT_TOOLBAR_CONFIG: ToolbarConfig = {
  orientation: 'horizontal',
};
