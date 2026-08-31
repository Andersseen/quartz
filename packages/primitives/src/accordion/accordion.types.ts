export type AccordionType = 'single' | 'multiple';

export interface AccordionConfig<T> {
  type: AccordionType;
  collapsible: boolean;
  region: boolean;
  compareWith: (a: T, b: T) => boolean;
}

export const DEFAULT_ACCORDION_CONFIG: AccordionConfig<unknown> = {
  type: 'single',
  collapsible: false,
  region: true,
  compareWith: Object.is,
};
