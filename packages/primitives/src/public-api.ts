// Quartz Headless Primitives — accessible, unstyled UI patterns composed from Quartz Core.

// Dialog & Drawer
export {
  DialogService,
  DialogRef,
  DEFAULT_DIALOG_CONFIG,
  type DialogPosition,
  type DialogConfig,
} from './dialog';

// Toast
export {
  ToastService,
  ToastComponent,
  ToastContainerComponent,
  type Toast,
  type ToastOptions,
  type ToastType,
  type ToastPosition,
  DEFAULT_TOAST_OPTIONS,
} from './toast';

// Tooltip
export { TooltipDirective, TooltipService, DEFAULT_TOOLTIP_CONFIG } from './tooltip';
export type { TooltipConfig, TooltipPlacement } from './tooltip';

// Tree
export { TreeComponent, TreeNodeComponent, TreeService, DEFAULT_TREE_CONFIG } from './tree';
export type {
  TreeNode,
  TreeConfig,
  TreeNodeContext,
  TreeNodeLoadState,
  TreeLoadChildrenFn,
} from './tree';

// Listbox
export {
  ListboxDirective,
  ListboxOptionDirective,
  ListboxService,
  DEFAULT_LISTBOX_CONFIG,
} from './listbox';
export type { ListboxConfig, ListboxOrientation } from './listbox';

// Menu
export {
  MenuDirective,
  MenuTriggerDirective,
  MenuItemDirective,
  MenuSeparatorDirective,
  MenuCheckboxItemDirective,
  MenuRadioGroupDirective,
  MenuRadioItemDirective,
  MenuService,
  DEFAULT_MENU_CONFIG,
} from './menu';
export type { MenuConfig, MenuCollectionEntry } from './menu';

// Popover
export { PopoverDirective, PopoverTriggerDirective, DEFAULT_POPOVER_CONFIG } from './popover';
export type { PopoverConfig } from './popover';

// Combobox
export {
  ComboboxDirective,
  ComboboxInputDirective,
  ComboboxContentDirective,
  ComboboxListboxDirective,
  ComboboxOptionDirective,
  ComboboxTriggerDirective,
  DEFAULT_COMBOBOX_CONFIG,
} from './combobox';
export type {
  ComboboxAutocomplete,
  ComboboxOpenReason,
  ComboboxCloseReason,
  ComboboxFilter,
  ComboboxDisplayWith,
  ComboboxCompareWith,
  ComboboxConfig,
} from './combobox';

// Select
export {
  SelectDirective,
  SelectTriggerDirective,
  SelectContentDirective,
  SelectListboxDirective,
  SelectOptionDirective,
  DEFAULT_SELECT_CONFIG,
} from './select';
export type { SelectCloseReason, SelectConfig, SelectOpenReason } from './select';

// Tabs
export {
  TabsDirective,
  TabListDirective,
  TabDirective,
  TabPanelDirective,
  DEFAULT_TABS_CONFIG,
} from './tabs';
export type { TabsActivationMode, TabsConfig, TabsOrientation } from './tabs';

// Accordion
export {
  AccordionDirective,
  AccordionItemDirective,
  AccordionTriggerDirective,
  AccordionPanelDirective,
  DEFAULT_ACCORDION_CONFIG,
} from './accordion';
export type { AccordionConfig, AccordionType } from './accordion';

// Navigation & Layout
export {
  SidebarDirective,
  SidebarPanelDirective,
  SidebarContentDirective,
  SidebarTriggerDirective,
  DEFAULT_SIDEBAR_CONFIG,
} from './sidebar';
export type {
  SidebarBreakpoint,
  SidebarConfig,
  SidebarFocusMode,
  SidebarMode,
  SidebarSide,
  SidebarState,
} from './sidebar';
export {
  NavbarDirective,
  NavbarTriggerDirective,
  NavbarMenuDirective,
  DEFAULT_NAVBAR_CONFIG,
} from './navbar';
export type {
  NavbarBreakpoint,
  NavbarConfig,
  NavbarRevealMode,
  NavbarScrollDirection,
} from './navbar';
export {
  StepperDirective,
  StepDirective,
  StepTriggerDirective,
  StepPanelDirective,
  StepperNextDirective,
  StepperPreviousDirective,
  DEFAULT_STEPPER_CONFIG,
} from './stepper';
export type {
  StepState,
  StepperActivationMode,
  StepperConfig,
  StepperOrientation,
} from './stepper';

// Switch
export { SwitchDirective } from './switch';

// Controls
export { CheckboxDirective, type CheckboxState } from './checkbox';
export { RadioGroupDirective, RadioDirective, DEFAULT_RADIO_GROUP_CONFIG } from './radio-group';
export type { RadioGroupConfig, RadioGroupOrientation } from './radio-group';
export { ToggleDirective } from './toggle';
export {
  ToggleGroupDirective,
  ToggleItemDirective,
  DEFAULT_TOGGLE_GROUP_CONFIG,
} from './toggle-group';
export type { ToggleGroupConfig, ToggleGroupOrientation, ToggleGroupType } from './toggle-group';
export {
  SliderDirective,
  SliderThumbDirective,
  SliderTrackDirective,
  SliderRangeDirective,
  DEFAULT_SLIDER_CONFIG,
} from './slider';
export type { SliderConfig, SliderOrientation } from './slider';
