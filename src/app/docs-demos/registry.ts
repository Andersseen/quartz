// Registry of live documentation demos (`::demo[id]` in Markdown). Each wrapper renders its demo
// inside `@defer`, so the demo's code is a lazy chunk, never part of the initial bundle, and is
// not executed during prerendering (the server renders the placeholder only; `on idle` never fires there).
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OverlayDemoComponent } from './overlay.demo';
import { DirectionalityDemoComponent } from './directionality.demo';
import { ScrollLockDemoComponent } from './scroll-lock.demo';
import { SplitterDemoComponent } from './splitter.demo';
import { DragDropDemoComponent } from './drag-drop.demo';
import { VirtualScrollDemoComponent } from './virtual-scroll.demo';
import { ViewportDemoComponent } from './viewport.demo';
import { DialogDemoComponent } from './dialog.demo';
import { TooltipDemoComponent } from './tooltip.demo';
import { ToastDemoComponent } from './toast.demo';
import { PopoverDemoComponent } from './popover.demo';
import { MenuDemoComponent } from './menu.demo';
import { SelectDemoComponent } from './select.demo';
import { ListboxDemoComponent } from './listbox.demo';
import { ComboboxDemoComponent } from './combobox.demo';
import { TabsDemoComponent } from './tabs.demo';
import { AccordionDemoComponent } from './accordion.demo';
import { SwitchDemoComponent } from './switch.demo';
import { CheckboxDemoComponent } from './checkbox.demo';
import { RadioGroupDemoComponent } from './radio-group.demo';
import { ToggleDemoComponent } from './toggle.demo';
import { ToggleGroupDemoComponent } from './toggle-group.demo';
import { SliderDemoComponent } from './slider.demo';
import { RangeSliderDemoComponent } from './range-slider.demo';
import { DatePickerDemoComponent } from './date-picker.demo';
import { DateRangePickerDemoComponent } from './date-range-picker.demo';
import { DateFormsDemoComponent } from './date-forms.demo';
import { TreeDemoComponent } from './tree.demo';
import { SidebarDemoComponent } from './sidebar.demo';
import { NavbarDemoComponent } from './navbar.demo';
import { StepperDemoComponent } from './stepper.demo';
import { ToolbarDemoComponent } from './toolbar.demo';
import { NavigationMenuDemoComponent } from './navigation-menu.demo';
import { PaginationDemoComponent } from './pagination.demo';
import { Controls014DemoComponent } from './controls-014.demo';
import {
  DrawerDemoComponent,
  ResizableDemoComponent,
  TooltipArrowDemoComponent,
  PopoverArrowDemoComponent,
  MenuGroupsDemoComponent,
} from './floating-016.demo';
import {
  ProgressDemoComponent,
  MeterDemoComponent,
  AvatarDemoComponent,
} from './feedback-indicators.demo';

@Component({
  selector: 'app-overlay-demo-loader',
  imports: [OverlayDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-overlay-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class OverlayDemoLoader {}

@Component({
  selector: 'app-directionality-demo-loader',
  imports: [DirectionalityDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-directionality-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class DirectionalityDemoLoader {}

@Component({
  selector: 'app-scroll-lock-demo-loader',
  imports: [ScrollLockDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-scroll-lock-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class ScrollLockDemoLoader {}

@Component({
  selector: 'app-splitter-demo-loader',
  imports: [SplitterDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-splitter-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class SplitterDemoLoader {}

@Component({
  selector: 'app-drag-drop-demo-loader',
  imports: [DragDropDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-drag-drop-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class DragDropDemoLoader {}

@Component({
  selector: 'app-virtual-scroll-demo-loader',
  imports: [VirtualScrollDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-virtual-scroll-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class VirtualScrollDemoLoader {}

@Component({
  selector: 'app-viewport-demo-loader',
  imports: [ViewportDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-viewport-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class ViewportDemoLoader {}

@Component({
  selector: 'app-dialog-demo-loader',
  imports: [DialogDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-dialog-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class DialogDemoLoader {}

@Component({
  selector: 'app-tooltip-demo-loader',
  imports: [TooltipDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-tooltip-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class TooltipDemoLoader {}

@Component({
  selector: 'app-toast-demo-loader',
  imports: [ToastDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-toast-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class ToastDemoLoader {}

@Component({
  selector: 'app-popover-demo-loader',
  imports: [PopoverDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-popover-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class PopoverDemoLoader {}

@Component({
  selector: 'app-menu-demo-loader',
  imports: [MenuDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-menu-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class MenuDemoLoader {}

@Component({
  selector: 'app-select-demo-loader',
  imports: [SelectDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-select-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class SelectDemoLoader {}

@Component({
  selector: 'app-listbox-demo-loader',
  imports: [ListboxDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-listbox-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class ListboxDemoLoader {}

@Component({
  selector: 'app-combobox-demo-loader',
  imports: [ComboboxDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-combobox-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class ComboboxDemoLoader {}

@Component({
  selector: 'app-tabs-demo-loader',
  imports: [TabsDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-tabs-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class TabsDemoLoader {}

@Component({
  selector: 'app-accordion-demo-loader',
  imports: [AccordionDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-accordion-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class AccordionDemoLoader {}

@Component({
  selector: 'app-switch-demo-loader',
  imports: [SwitchDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-switch-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class SwitchDemoLoader {}

@Component({
  selector: 'app-checkbox-demo-loader',
  imports: [CheckboxDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-checkbox-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class CheckboxDemoLoader {}

@Component({
  selector: 'app-radio-group-demo-loader',
  imports: [RadioGroupDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-radio-group-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class RadioGroupDemoLoader {}

@Component({
  selector: 'app-toggle-demo-loader',
  imports: [ToggleDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-toggle-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class ToggleDemoLoader {}

@Component({
  selector: 'app-toggle-group-demo-loader',
  imports: [ToggleGroupDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-toggle-group-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class ToggleGroupDemoLoader {}

@Component({
  selector: 'app-slider-demo-loader',
  imports: [SliderDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-slider-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class SliderDemoLoader {}

@Component({
  selector: 'app-range-slider-demo-loader',
  imports: [RangeSliderDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-range-slider-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class RangeSliderDemoLoader {}

@Component({
  selector: 'app-date-picker-demo-loader',
  imports: [DatePickerDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-date-picker-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class DatePickerDemoLoader {}

@Component({
  selector: 'app-date-range-picker-demo-loader',
  imports: [DateRangePickerDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-date-range-picker-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class DateRangePickerDemoLoader {}

@Component({
  selector: 'app-date-forms-demo-loader',
  imports: [DateFormsDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-date-forms-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class DateFormsDemoLoader {}

@Component({
  selector: 'app-tree-demo-loader',
  imports: [TreeDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-tree-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class TreeDemoLoader {}

@Component({
  selector: 'app-sidebar-demo-loader',
  imports: [SidebarDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-sidebar-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class SidebarDemoLoader {}

@Component({
  selector: 'app-navbar-demo-loader',
  imports: [NavbarDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-navbar-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class NavbarDemoLoader {}

@Component({
  selector: 'app-stepper-demo-loader',
  imports: [StepperDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-stepper-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class StepperDemoLoader {}

@Component({
  selector: 'app-toolbar-demo-loader',
  imports: [ToolbarDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-toolbar-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class ToolbarDemoLoader {}

@Component({
  selector: 'app-navigation-menu-demo-loader',
  imports: [NavigationMenuDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-navigation-menu-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class NavigationMenuDemoLoader {}

@Component({
  selector: 'app-pagination-demo-loader',
  imports: [PaginationDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-pagination-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class PaginationDemoLoader {}

@Component({
  selector: 'app-controls-014-demo-loader',
  imports: [Controls014DemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-controls-014-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class Controls014DemoLoader {}

@Component({
  selector: 'app-progress-demo-loader',
  imports: [ProgressDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-progress-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class ProgressDemoLoader {}
@Component({
  selector: 'app-meter-demo-loader',
  imports: [MeterDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-meter-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class MeterDemoLoader {}
@Component({
  selector: 'app-avatar-demo-loader',
  imports: [AvatarDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-avatar-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class AvatarDemoLoader {}

@Component({
  selector: 'app-drawer-demo-loader',
  imports: [DrawerDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-drawer-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class DrawerDemoLoader {}

@Component({
  selector: 'app-resizable-demo-loader',
  imports: [ResizableDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-resizable-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class ResizableDemoLoader {}

@Component({
  selector: 'app-tooltip-arrow-demo-loader',
  imports: [TooltipArrowDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-tooltip-arrow-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class TooltipArrowDemoLoader {}

@Component({
  selector: 'app-popover-arrow-demo-loader',
  imports: [PopoverArrowDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-popover-arrow-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class PopoverArrowDemoLoader {}

@Component({
  selector: 'app-menu-groups-demo-loader',
  imports: [MenuGroupsDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@defer (on idle) {
      <app-menu-groups-demo />
    } @placeholder {
      <div class="qz-demo-placeholder" aria-busy="true">Loading demo…</div>
    }`,
})
class MenuGroupsDemoLoader {}

export const DOC_DEMOS = {
  overlay: OverlayDemoLoader,
  directionality: DirectionalityDemoLoader,
  'scroll-lock': ScrollLockDemoLoader,
  splitter: SplitterDemoLoader,
  'drag-drop': DragDropDemoLoader,
  'virtual-scroll': VirtualScrollDemoLoader,
  viewport: ViewportDemoLoader,
  dialog: DialogDemoLoader,
  tooltip: TooltipDemoLoader,
  toast: ToastDemoLoader,
  progress: ProgressDemoLoader,
  meter: MeterDemoLoader,
  avatar: AvatarDemoLoader,
  popover: PopoverDemoLoader,
  menu: MenuDemoLoader,
  select: SelectDemoLoader,
  listbox: ListboxDemoLoader,
  combobox: ComboboxDemoLoader,
  tabs: TabsDemoLoader,
  accordion: AccordionDemoLoader,
  switch: SwitchDemoLoader,
  checkbox: CheckboxDemoLoader,
  'radio-group': RadioGroupDemoLoader,
  toggle: ToggleDemoLoader,
  'toggle-group': ToggleGroupDemoLoader,
  slider: SliderDemoLoader,
  'range-slider': RangeSliderDemoLoader,
  'date-picker': DatePickerDemoLoader,
  'date-range-picker': DateRangePickerDemoLoader,
  'date-forms': DateFormsDemoLoader,
  tree: TreeDemoLoader,
  sidebar: SidebarDemoLoader,
  navbar: NavbarDemoLoader,
  stepper: StepperDemoLoader,
  toolbar: ToolbarDemoLoader,
  'navigation-menu': NavigationMenuDemoLoader,
  pagination: PaginationDemoLoader,
  'controls-text-files': Controls014DemoLoader,
  drawer: DrawerDemoLoader,
  resizable: ResizableDemoLoader,
  'tooltip-arrow': TooltipArrowDemoLoader,
  'popover-arrow': PopoverArrowDemoLoader,
  'menu-groups': MenuGroupsDemoLoader,
} as const;
