export type DialogPosition = 'center' | 'top' | 'bottom' | 'left' | 'right';

export interface DialogConfig {
  /**
   * The position of the dialog on the screen.
   * @default 'center'
   */
  position: DialogPosition;

  /**
   * Whether to show a backdrop behind the dialog.
   * @default true
   */
  backdrop: boolean;

  /**
   * Whether the dialog should close when the backdrop is clicked.
   * @default true
   */
  closeOnBackdropClick: boolean;

  /**
   * Whether the dialog should close when the Escape key is pressed.
   * @default true
   */
  closeOnEscape: boolean;

  /**
   * Custom CSS class for the dialog container.
   */
  panelClass?: string | string[];

  /**
   * Custom CSS class for the backdrop.
   */
  backdropClass?: string | string[];

  /**
   * Width of the dialog.
   */
  width?: string;

  /**
   * Height of the dialog.
   */
  height?: string;

  /**
   * ID of the element that labels the dialog.
   * Used for `aria-labelledby`. If omitted, a fallback ID is generated and
   * exposed via the template context so consumers can bind it to a title element.
   */
  ariaLabelledBy?: string;

  /**
   * ID of the element that describes the dialog.
   * Used for `aria-describedby`. If omitted, a fallback ID is generated and
   * exposed via the template context so consumers can bind it to a description element.
   */
  ariaDescribedBy?: string;
}

export const DEFAULT_DIALOG_CONFIG: DialogConfig = {
  position: 'center',
  backdrop: true,
  closeOnBackdropClick: true,
  closeOnEscape: true,
};
