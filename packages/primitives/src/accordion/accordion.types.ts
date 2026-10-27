export type AccordionType = 'single' | 'multiple';
export type AccordionOrientation = 'vertical' | 'horizontal';

export interface AccordionConfig<T> {
  type: AccordionType;
  collapsible: boolean;
  region: boolean;
  orientation: AccordionOrientation;
  compareWith: (a: T, b: T) => boolean;
}

export const DEFAULT_ACCORDION_CONFIG: AccordionConfig<unknown> = {
  type: 'single',
  collapsible: false,
  region: true,
  orientation: 'vertical',
  compareWith: Object.is,
};
