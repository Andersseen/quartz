export type SplitterOrientation = 'horizontal' | 'vertical';

export interface SplitterSize {
  value: number;
  unit: 'percent' | 'pixel';
}

export interface SplitterConfig {
  orientation: SplitterOrientation;
  minSize: number;
  maxSize: number;
  step: number;
}
