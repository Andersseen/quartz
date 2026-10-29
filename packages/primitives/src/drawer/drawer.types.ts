import type { DialogConfig, DialogPosition } from '../dialog/dialog.types';

/**
 * Edge a drawer is anchored to. `left`/`right`/`top`/`bottom` are physical and never mirror.
 * `inline-start`/`inline-end` follow the writing direction: in LTR `inline-start` is `left`, in
 * RTL it is `right` (and vice versa for `inline-end`).
 */
export type DrawerSide = 'left' | 'right' | 'top' | 'bottom' | 'inline-start' | 'inline-end';

/** Physical edge a {@link DrawerSide} resolved to. */
export type DrawerPhysicalSide = Extract<DialogPosition, 'left' | 'right' | 'top' | 'bottom'>;

export interface DrawerConfig extends Omit<DialogConfig, 'position'> {
  /** Edge the drawer is anchored to. Fixed for the lifetime of one `open()`. Default: 'inline-end'. */
  side: DrawerSide;
}

export const DEFAULT_DRAWER_CONFIG: DrawerConfig = {
  side: 'inline-end',
  backdrop: true,
  closeOnBackdropClick: true,
  closeOnEscape: true,
  presence: true,
};
