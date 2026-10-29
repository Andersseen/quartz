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
   * Used for `aria-labelledby`; it is only applied when the element exists in the document.
   * If omitted, a fallback ID is generated and exposed via the template context
   * (`let-labelledBy="ariaLabelledBy"`) so consumers can bind it to a title element.
   */
  ariaLabelledBy?: string;

  /**
   * Accessible name used when the dialog has no visible title element. Ignored when a valid
   * `aria-labelledby` reference resolves. A dialog with neither has no accessible name, and
   * a development-mode warning is logged.
   */
  ariaLabel?: string;

  /**
   * Keep the dialog mounted while a consumer-defined CSS exit transition/animation runs.
   *
   * On close the panel, wrapper and backdrop get `data-state="closing"`; the nodes are removed
   * when their `transitionend`/`animationend` fired (or, as a safety net, shortly after the
   * longest computed duration). With no transition/animation on those nodes, with
   * `prefers-reduced-motion: reduce`, or when the host view is destroyed, removal is immediate.
   * Quartz never sets a duration. Default: false (immediate removal).
   */
  presence?: boolean;

  /**
   * Extra attributes written on the panel element (e.g. `data-*` hooks).
   */
  panelAttributes?: Record<string, string>;

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
