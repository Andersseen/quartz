// Real-consumer smoke fixture. Deliberately uses ONLY the public package specifiers a real
// installer would resolve — no deep imports into dist/src, no tsconfig path aliases (this
// fixture's tsconfig has no "paths" field at all). If this file fails to compile, the
// published packages' exports/types are broken for a real external consumer, even though
// the monorepo's own workspace-symlink-based dev flow would never surface it.

import {
  Component,
  Input,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  inject,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  CollectionStore,
  OverlayTriggerDirective,
  SplitterContainerDirective,
  SplitterHandleDirective,
  SplitterPanelDirective,
  calculateArrowGeometry,
  type OverlayArrowGeometry,
  createDismissController,
  createFocusRestorer,
  createFocusTrap,
  createScrollLock,
  isFocusable,
  type CollectionItem,
  type DismissReason,
} from '@quartz-headless/core';
import {
  AccordionDirective,
  AvatarComponent,
  AutofillDirective,
  AccordionItemDirective,
  AccordionPanelDirective,
  AccordionTriggerDirective,
  CheckboxDirective,
  FileDropzoneDirective,
  FileUploadDirective,
  FormFieldControlDirective,
  FormFieldDescriptionDirective,
  FormFieldDirective,
  FormFieldErrorDirective,
  FormFieldLabelDirective,
  InputOtpComponent,
  DatePickerDirective,
  DateRangePickerDirective,
  CalendarGridDirective,
  CalendarRowDirective,
  CalendarCellDirective,
  CalendarDateButtonDirective,
  CalendarMonthLabelDirective,
  CalendarPreviousMonthDirective,
  CalendarNextMonthDirective,
  ComboboxContentDirective,
  ComboboxDirective,
  ComboboxGroupDirective,
  ComboboxGroupLabelDirective,
  ComboboxInputDirective,
  ComboboxListboxDirective,
  ComboboxOptionDirective,
  ListboxGroupDirective,
  ListboxGroupLabelDirective,
  ListboxSeparatorDirective,
  SelectGroupDirective,
  SelectGroupLabelDirective,
  SelectSeparatorDirective,
  createLatestRequest,
  DialogRef,
  DialogService,
  DrawerService,
  MenuDirective,
  MenuGroupDirective,
  MenuLabelDirective,
  MenuSeparatorDirective,
  resolveDrawerSide,
  type DrawerSide,
  type PopoverContext,
  type TooltipContext,
  MenuItemDirective,
  MenuTriggerDirective,
  MeterDirective,
  MeterIndicatorDirective,
  MeterTrackDirective,
  NavigationMenuContentDirective,
  NavigationMenuDirective,
  NavigationMenuItemDirective,
  NavigationMenuLinkDirective,
  NavigationMenuListDirective,
  NavigationMenuTriggerDirective,
  PaginationDirective,
  PaginationFirstDirective,
  PaginationLastDirective,
  PaginationNextDirective,
  PaginationPageDirective,
  PaginationPreviousDirective,
  PopoverDirective,
  PopoverTriggerDirective,
  ProgressDirective,
  ProgressIndicatorDirective,
  ProgressTrackDirective,
  RangeSliderDirective,
  RangeSliderRangeDirective,
  RangeSliderThumbDirective,
  RangeSliderTrackDirective,
  type RangeSliderValue,
  type DateRange,
  SliderDirective,
  SliderThumbDirective,
  SliderTrackDirective,
  ToggleDirective,
  ToggleGroupDirective,
  ToggleItemDirective,
  ToastContainerComponent,
  ToastService,
  type ToastContentComponent,
  type ToastContentContext,
  type ToastTemplateContext,
  TooltipDirective,
  ListboxDirective,
  ListboxOptionDirective,
  RadioDirective,
  RadioGroupDirective,
  SelectContentDirective,
  SelectDirective,
  SelectListboxDirective,
  SelectOptionDirective,
  SelectTriggerDirective,
  SwitchDirective,
  SidebarContentDirective,
  SidebarDirective,
  SidebarPanelDirective,
  SidebarTriggerDirective,
  ToolbarDirective,
  ToolbarItemDirective,
} from '@quartz-headless/primitives';
import { QUARTZ_FORMS } from '@quartz-headless/primitives/forms';

// Core service.
interface Row extends CollectionItem {
  id: string;
}
const collection = new CollectionStore<Row>();
collection.register({ id: 'row-1' });
collection.register({ id: 'row-2' });
const firstActive: string | null = collection.activeId();
void firstActive;

// Primitives service.
@Component({
  selector: 'app-consumer-smoke-host',
  standalone: true,
  template: `<ng-template #dialogTpl>Hello from a real consumer</ng-template>`,
})
class DialogHostComponent {
  private readonly dialogs = inject(DialogService);

  open(templateRef: TemplateRef<unknown>, viewContainerRef: ViewContainerRef): DialogRef {
    return this.dialogs.open(templateRef, viewContainerRef, {
      position: 'center',
      ariaLabel: 'Settings',
    });
  }
}

// Primitives directives (model()-based) + component, referenced from imports so the
// Angular compiler actually resolves and type-checks their selectors/inputs/outputs.
@Component({
  selector: 'app-consumer-smoke-controls',
  standalone: true,
  imports: [CheckboxDirective, SliderDirective, ToastContainerComponent],
  template: `
    <button qzCheckbox [(checked)]="checked"></button>
    <div qzSlider [(value)]="volume"></div>
    <qz-toast-container />
  `,
})
class ControlsComponent {
  checked = false;
  volume = 50;
}

void DialogHostComponent;
void ControlsComponent;

// New 0.15 feedback and indicator APIs are compiled against installed package exports with strict
// templates. This catches missing declarations/types that the workspace aliases can conceal.
@Component({
  selector: 'app-consumer-feedback',
  standalone: true,
  imports: [
    AvatarComponent,
    MeterDirective,
    MeterTrackDirective,
    MeterIndicatorDirective,
    ProgressDirective,
    ProgressTrackDirective,
    ProgressIndicatorDirective,
  ],
  template: `
    <div qzProgress [value]="progress" [min]="min" [max]="max" aria-label="Download">
      <div qzProgressTrack><div qzProgressIndicator></div></div>
    </div>
    <div qzMeter [value]="measurement" [min]="min" [max]="max" aria-label="Storage">
      <div qzMeterTrack><div qzMeterIndicator></div></div>
    </div>
    <qz-avatar [src]="avatarSrc" alt="Profile photo" fallback="JD" [fallbackDelay]="100" />
  `,
})
class FeedbackIndicatorsComponent {
  progress = 40;
  measurement = 72;
  min = 0;
  max = 100;
  avatarSrc = 'https://example.test/avatar.png';
}

@Component({ standalone: true, template: '{{ context.toast.message }}' })
class ConsumerToastContentComponent implements ToastContentComponent {
  @Input() context!: ToastContentContext;
}

@Component({
  selector: 'app-consumer-toast-content',
  standalone: true,
  imports: [ToastContainerComponent],
  template: `
    <ng-template #toastTemplate let-toast="toast" let-dismiss="dismiss">
      <span>{{ toast.message }}</span>
      <button type="button" (click)="dismiss()">Dismiss</button>
    </ng-template>
    <button type="button" (click)="showTemplate()">Template toast</button>
    <button type="button" (click)="showComponent()">Component toast</button>
    <qz-toast-container />
  `,
})
class ToastContentHostComponent {
  private readonly toasts = inject(ToastService);
  @ViewChild('toastTemplate', { static: true })
  private toastTemplate!: TemplateRef<ToastTemplateContext>;

  showTemplate(): void {
    this.toasts.show({
      type: 'success',
      message: 'Template content',
      content: this.toastTemplate,
      actions: [{ label: 'Undo', run: () => {}, dismiss: false }],
      maxVisible: 2,
    });
  }

  showComponent(): void {
    this.toasts.show({
      type: 'info',
      message: 'Component content',
      content: ConsumerToastContentComponent,
    });
  }
}

void FeedbackIndicatorsComponent;
void ToastContentHostComponent;

// Core 0.7 contracts, compiled by the Angular AOT compiler against the installed tarball
// (`ngc` with strictTemplates — see scripts/consumer-smoke.js).
@Component({
  selector: 'app-consumer-smoke-overlay',
  standalone: true,
  imports: [OverlayTriggerDirective],
  template: `
    <button
      qzOverlayTrigger
      [overlayTemplate]="panel"
      placement="bottom-end"
      flipAxis="both"
      [closeOnScroll]="false"
      (opened)="opened = true"
      (closed)="opened = false"
    >
      Toggle
    </button>
    <ng-template #panel><div>Panel</div></ng-template>
  `,
})
class OverlayHostComponent {
  opened = false;
}

export function layerContract(doc: Document, root: HTMLElement): () => void {
  const restorer = createFocusRestorer(doc);
  const trap = createFocusTrap(root, doc);
  const lock = createScrollLock(doc);
  lock.lock();
  const reasons: DismissReason[] = [];
  const dismiss = createDismissController({
    document: doc,
    escape: true,
    outsidePointer: true,
    rootElements: () => [root],
    onDismiss: (reason) => reasons.push(reason),
  });
  const focusable: boolean = isFocusable(root);
  void focusable;
  return () => {
    dismiss.destroy();
    lock.destroy();
    trap.destroy();
    restorer.restore();
  };
}

void OverlayHostComponent;

// Primitives 0.8 floating + feedback contracts, compiled with strictTemplates: the Dialog
// template context (`ariaLabelledBy` / `ariaDescribedBy`), the Menu / Popover triggers and the
// Tooltip directive.
@Component({
  selector: 'app-consumer-smoke-floating',
  standalone: true,
  imports: [
    MenuDirective,
    MenuItemDirective,
    MenuTriggerDirective,
    PopoverDirective,
    PopoverTriggerDirective,
    TooltipDirective,
  ],
  template: `
    <ng-template
      #dialogTpl
      let-ref
      let-labelledBy="ariaLabelledBy"
      let-describedBy="ariaDescribedBy"
    >
      <h2 [id]="labelledBy">Title</h2>
      <p [id]="describedBy">Description</p>
      <button (click)="ref.close()">Close</button>
    </ng-template>

    <button qzTooltip="Save" tooltipPlacement="bottom" [tooltipDelay]="100" aria-describedby="hint">
      Save
    </button>

    <button qzPopoverTrigger [popover]="pop" [(open)]="popOpen" [autoFocus]="true">Popover</button>
    <ng-template #pop><div qzPopover>Body</div></ng-template>

    <button qzMenuTrigger [menu]="menu" (opened)="menuOpen = true" (closed)="menuOpen = false">
      Menu
    </button>
    <ng-template #menu>
      <div qzMenu>
        <button qzMenuItem (selected)="picked = 'one'">One</button>
        <button qzMenuItem [submenu]="sub">More</button>
        <ng-template #sub>
          <div qzMenu><button qzMenuItem>Nested</button></div>
        </ng-template>
      </div>
    </ng-template>
  `,
})
class FloatingComponent {
  popOpen = false;
  menuOpen = false;
  picked: string | null = null;
  private readonly toasts = inject(ToastService);

  notify(): string {
    return this.toasts.error('Failed', 'Error', { duration: 0 });
  }
}

void FloatingComponent;

// Angular Forms (opt-in `/forms` entry point): Reactive and template-driven bindings on every
// adapted control, compiled with strictTemplates against the installed packages only.
@Component({
  selector: 'app-forms',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CheckboxDirective,
    SwitchDirective,
    RadioGroupDirective,
    RadioDirective,
    SelectDirective,
    SelectTriggerDirective,
    SelectContentDirective,
    SelectListboxDirective,
    SelectOptionDirective,
    ListboxDirective,
    ListboxOptionDirective,
    ...QUARTZ_FORMS,
  ],
  template: `
    <form [formGroup]="form">
      <button qzCheckbox formControlName="terms" aria-label="Terms">Terms</button>
      <button qzSwitch formControlName="notify" aria-label="Notify">Notify</button>
      <div qzRadioGroup formControlName="plan" aria-label="Plan">
        <button qzRadio="free">Free</button>
        <button qzRadio="pro">Pro</button>
      </div>
      <div qzSelect formControlName="fruit">
        <button qzSelectTrigger aria-label="Fruit">{{ form.controls.fruit.value }}</button>
        <ng-template qzSelectContent>
          <div qzSelectListbox>
            <div qzSelectOption="apple">Apple</div>
            <div qzSelectOption="pear">Pear</div>
          </div>
        </ng-template>
      </div>
      <div qzListbox [multiple]="true" formControlName="tags" aria-label="Tags">
        <div qzListboxOption="a">A</div>
        <div qzListboxOption="b">B</div>
      </div>
    </form>
    <button qzSwitch [(ngModel)]="legacy" aria-label="Legacy">Legacy</button>
  `,
})
class FormsComponent {
  legacy = false;
  readonly form = new FormGroup({
    terms: new FormControl<boolean | 'indeterminate'>(false, { nonNullable: true }),
    notify: new FormControl(true, { nonNullable: true }),
    plan: new FormControl<string | null>(null),
    fruit: new FormControl<string | null>('apple'),
    tags: new FormControl<string[] | null>(null),
  });
}

void FormsComponent;

// Quartz 0.10 advanced selection: multiple Select, grouped Select/Listbox, Combobox (single,
// multiple, async guard) and their Forms adapters, strict-template compiled.
interface Tag {
  id: number;
  name: string;
}

@Component({
  selector: 'app-advanced-selection',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SelectDirective,
    SelectTriggerDirective,
    SelectContentDirective,
    SelectListboxDirective,
    SelectOptionDirective,
    SelectGroupDirective,
    SelectGroupLabelDirective,
    SelectSeparatorDirective,
    ListboxDirective,
    ListboxOptionDirective,
    ListboxGroupDirective,
    ListboxGroupLabelDirective,
    ListboxSeparatorDirective,
    ComboboxDirective,
    ComboboxInputDirective,
    ComboboxContentDirective,
    ComboboxListboxDirective,
    ComboboxOptionDirective,
    ComboboxGroupDirective,
    ComboboxGroupLabelDirective,
    ...QUARTZ_FORMS,
  ],
  template: `
    <div
      qzSelect
      multiple
      #tags="qzSelect"
      [(values)]="selected"
      [closeOnSelect]="false"
      [compareWith]="same"
      [displayWith]="label"
      (valuesChangeCommitted)="committed = $event"
    >
      <button qzSelectTrigger aria-label="Tags">{{ tags.selectedLabel() }}</button>
      <ng-template qzSelectContent>
        <div qzSelectListbox>
          <div qzSelectGroup>
            <div qzSelectGroupLabel>Group</div>
            <div [qzSelectOption]="tag">{{ tag.name }}</div>
          </div>
          <div qzSelectSeparator></div>
        </div>
      </ng-template>
    </div>

    <div qzListbox aria-label="Sections" [(value)]="section">
      <div qzListboxGroup>
        <div qzListboxGroupLabel>Section</div>
        <div qzListboxOption="a">A</div>
      </div>
      <div qzListboxSeparator></div>
    </div>

    <form [formGroup]="form">
      <div qzSelect multiple formControlName="tags"></div>
      <div
        qzCombobox
        #city="qzCombobox"
        formControlName="city"
        [options]="cities"
        [allowDeselect]="true"
        [loading]="loading"
        (queryChanged)="search($event)"
        (valueChangeCommitted)="picked = $event"
      >
        <input aria-label="City" qzComboboxInput />
        <ng-template qzComboboxContent>
          <ul qzComboboxListbox>
            <li qzComboboxGroup>
              <span qzComboboxGroupLabel>Cities</span>
              @for (c of city.filteredOptions(); track c) {
                <div [qzComboboxOption]="c">{{ c }}</div>
              }
            </li>
          </ul>
        </ng-template>
      </div>
      <div qzCombobox multiple formControlName="langs" [options]="cities">
        <input aria-label="Languages" qzComboboxInput />
      </div>
    </form>
  `,
})
class AdvancedSelectionComponent {
  readonly tag: Tag = { id: 1, name: 'Angular' };
  selected: readonly Tag[] = [];
  committed: readonly Tag[] = [];
  section: string | string[] | null = null;
  cities = ['Madrid', 'Paris'];
  loading = false;
  picked: string | null = null;
  readonly same = (a: Tag, b: Tag) => a.id === b.id;
  readonly label = (t: Tag) => t.name;
  private readonly latest = createLatestRequest();
  readonly form = new FormGroup({
    tags: new FormControl<Tag[] | null>(null),
    city: new FormControl<string | null>(null),
    langs: new FormControl<string[] | null>([]),
  });

  async search(query: string): Promise<void> {
    this.loading = true;
    const result = await this.latest.run(async (signal) => {
      const response = await fetch(`/api?q=${query}`, { signal });
      return (await response.json()) as string[];
    });
    if (result) this.cities = result;
    this.loading = false;
  }
}

void AdvancedSelectionComponent;

// Quartz 0.11 range & toggle controls: Slider, RangeSlider, Toggle and ToggleGroup with their
// Forms adapters, strict-template compiled against the installed tarball. RangeSlider's Forms
// value is the `{ low, high }` object (not a tuple).
@Component({
  selector: 'app-consumer-smoke-range-toggle',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SliderDirective,
    SliderTrackDirective,
    SliderThumbDirective,
    RangeSliderDirective,
    RangeSliderTrackDirective,
    RangeSliderRangeDirective,
    RangeSliderThumbDirective,
    ToggleDirective,
    ToggleGroupDirective,
    ToggleItemDirective,
    ...QUARTZ_FORMS,
  ],
  template: `
    <form [formGroup]="form">
      <div qzSlider formControlName="volume" [min]="0" [max]="1" [step]="0.1" #v="qzSlider">
        <div qzSliderTrack><button qzSliderThumb aria-label="Volume"></button></div>
      </div>
      <div
        qzRangeSlider
        formControlName="price"
        [min]="0"
        [max]="500"
        [minDistance]="10"
        [valueText]="priceText"
        (valueChangeCommitted)="last = $event"
      >
        <div qzRangeSliderTrack>
          <div qzRangeSliderRange></div>
          <button qzRangeSliderThumb="low" aria-label="Minimum price"></button>
          <button qzRangeSliderThumb="high" aria-label="Maximum price"></button>
        </div>
      </div>
      <button
        qzToggle
        formControlName="bold"
        (pressedChangeCommitted)="boldCommits = boldCommits + 1"
      >
        Bold
      </button>
      <div qzToggleGroup formControlName="align" [allowDeselection]="false" aria-label="Alignment">
        <button qzToggleItem="left">Left</button>
        <button qzToggleItem="right">Right</button>
      </div>
      <div qzToggleGroup type="multiple" formControlName="marks" aria-label="Marks">
        <button qzToggleItem="b">B</button>
      </div>
    </form>
  `,
})
class RangeToggleComponent {
  last: RangeSliderValue | null = null;
  boldCommits = 0;
  readonly priceText = (value: number, thumb: 'low' | 'high') => `${thumb}: ${value}`;
  readonly form = new FormGroup({
    volume: new FormControl<number | null>(0.5),
    price: new FormControl<RangeSliderValue | null>({ low: 100, high: 300 }),
    bold: new FormControl(false),
    align: new FormControl<string | null>('left'),
    marks: new FormControl<string[] | null>([]),
  });
}

void RangeToggleComponent;

// 0.12 date controls and optional Forms adapters compile from installed package tarballs.
@Component({
  selector: 'app-consumer-smoke-dates',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePickerDirective,
    DateRangePickerDirective,
    CalendarGridDirective,
    CalendarRowDirective,
    CalendarCellDirective,
    CalendarDateButtonDirective,
    CalendarMonthLabelDirective,
    CalendarPreviousMonthDirective,
    CalendarNextMonthDirective,
    ...QUARTZ_FORMS,
  ],
  template: `
    <form [formGroup]="form">
      <section qzDatePicker [today]="today" formControlName="date" #single="qzDatePicker">
        <h2 qzCalendarMonthLabel></h2>
        <button qzCalendarPreviousMonth>Previous</button><button qzCalendarNextMonth>Next</button>
        <div qzCalendarGrid>
          <div qzCalendarRow>
            @for (weekday of single.weekdays(); track $index) {
              <div role="columnheader">{{ weekday }}</div>
            }
          </div>
          @for (week of single.weeks(); track $index) {
            <div qzCalendarRow>
              @for (day of week; track day.date.getTime()) {
                <div [qzCalendarCell]="day">
                  <button [qzCalendarDateButton]="day">{{ day.day }}</button>
                </div>
              }
            </div>
          }
        </div>
      </section>
      <section qzDateRangePicker formControlName="range" #range="qzDateRangePicker">
        <h2 qzCalendarMonthLabel></h2>
        <div qzCalendarGrid>
          @for (week of range.weeks(); track $index) {
            <div qzCalendarRow>
              @for (day of week; track day.date.getTime()) {
                <div [qzCalendarCell]="day">
                  <button [qzCalendarDateButton]="day">{{ day.day }}</button>
                </div>
              }
            </div>
          }
        </div>
      </section>
    </form>
  `,
})
class DateControlsComponent {
  readonly today = new Date(2024, 1, 15, 12);
  readonly form = new FormGroup({
    date: new FormControl<Date | null>(null),
    range: new FormControl<DateRange | null>({ start: null, end: null }),
  });
}

void DateControlsComponent;

// Quartz 0.13 navigation and roving-focus public imports compiled from external tarballs.
@Component({
  selector: 'app-consumer-smoke-navigation',
  standalone: true,
  imports: [
    ToolbarDirective,
    ToolbarItemDirective,
    NavigationMenuDirective,
    NavigationMenuListDirective,
    NavigationMenuItemDirective,
    NavigationMenuTriggerDirective,
    NavigationMenuContentDirective,
    NavigationMenuLinkDirective,
    PaginationDirective,
    PaginationFirstDirective,
    PaginationPreviousDirective,
    PaginationNextDirective,
    PaginationLastDirective,
    PaginationPageDirective,
    AccordionDirective,
    AccordionItemDirective,
    AccordionTriggerDirective,
    AccordionPanelDirective,
    SidebarDirective,
    SidebarPanelDirective,
    SidebarContentDirective,
    SidebarTriggerDirective,
  ],
  template: `
    <div qzToolbar aria-label="Formatting" orientation="horizontal">
      <button qzToolbarItem>Bold</button
      ><button qzToolbarItem [qzToolbarItemDisabled]="locked">Link</button>
    </div>
    <nav qzNavigationMenu aria-label="Primary" [(value)]="openSection">
      <ul qzNavigationMenuList>
        <li qzNavigationMenuItem="products">
          <button qzNavigationMenuTrigger>Products</button>
          <ng-template qzNavigationMenuContent
            ><a qzNavigationMenuLink href="/products">Browse</a></ng-template
          >
        </li>
      </ul>
    </nav>
    <nav qzPagination aria-label="Results" [(page)]="page" [pageCount]="pageCount">
      <button qzPaginationFirst>First</button><button qzPaginationPrevious>Previous</button>
      <button [qzPaginationPage]="1">1</button>
      <button qzPaginationNext>Next</button><button qzPaginationLast>Last</button>
    </nav>
    <div qzAccordion [(value)]="section" orientation="horizontal">
      <section qzAccordionItem="account">
        <button qzAccordionTrigger>Account</button>
        <div qzAccordionPanel>Settings</div>
      </section>
    </div>
    <div
      qzSidebar
      [(open)]="sidebarOpen"
      [(collapsed)]="sidebarCollapsed"
      mode="push"
      side="inline-start"
    >
      <aside qzSidebarPanel><button qzSidebarTrigger>Toggle</button></aside>
      <main qzSidebarContent>Content</main>
    </div>
  `,
})
class NavigationControlsComponent {
  locked = false;
  openSection = '';
  page = 1;
  pageCount = 3;
  section: string | string[] | null = 'account';
  sidebarOpen = true;
  sidebarCollapsed = false;
}

void NavigationControlsComponent;

// Quartz 0.14 text/file/form composition, compiled from packed npm tarballs.
@Component({
  selector: 'app-consumer-smoke-controls-014',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AutofillDirective,
    FileDropzoneDirective,
    FileUploadDirective,
    FormFieldControlDirective,
    FormFieldDescriptionDirective,
    FormFieldDirective,
    FormFieldErrorDirective,
    FormFieldLabelDirective,
    InputOtpComponent,
    ...QUARTZ_FORMS,
  ],
  template: `
    <div qzFormField id="consumer-email">
      <label qzFormFieldLabel for="consumer-email-control">Email</label>
      <p qzFormFieldDescription id="consumer-email-hint">Work address.</p>
      <p qzFormFieldError id="consumer-email-error">Invalid email.</p>
      <input qzFormFieldControl id="consumer-email-control" type="email" [formControl]="email" />
    </div>
    <div qzFormField id="consumer-message">
      <label qzFormFieldLabel for="consumer-message-control">Message</label>
      <p qzFormFieldDescription id="consumer-message-hint">A native textarea example.</p>
      <textarea qzFormFieldControl id="consumer-message-control" [formControl]="message"></textarea>
    </div>
    <qz-input-otp ariaLabel="One-time code" [formControl]="otp" />
    <input qzAutofill aria-label="Autofill test" />
    <div qzFileDropzone>
      <input #consumerUpload="qzFileUpload" type="file" qzFileUpload accept="image/*,.txt" />
      <button type="button" (click)="consumerUpload.openPicker()">Browse consumer files</button>
    </div>
  `,
})
class Controls014Component {
  readonly email = new FormControl('');
  readonly message = new FormControl('');
  readonly otp = new FormControl('');
}

void Controls014Component;

// Quartz 0.16 Drawer / Resizable / arrow geometry / Menu groups, compiled with strictTemplates
// from packed npm tarballs.
@Component({
  selector: 'app-consumer-smoke-016',
  standalone: true,
  imports: [
    MenuDirective,
    MenuGroupDirective,
    MenuItemDirective,
    MenuLabelDirective,
    MenuSeparatorDirective,
    MenuTriggerDirective,
    PopoverDirective,
    PopoverTriggerDirective,
    SplitterContainerDirective,
    SplitterHandleDirective,
    SplitterPanelDirective,
    TooltipDirective,
  ],
  template: `
    <button type="button" (click)="openDrawer('inline-start')">Open drawer</button>
    <ng-template
      #drawerTpl
      let-ref
      let-labelledBy="ariaLabelledBy"
      let-describedBy="ariaDescribedBy"
    >
      <h2 [id]="labelledBy">Drawer</h2>
      <p [id]="describedBy">Body</p>
      <button type="button" (click)="ref.close()">Close</button>
    </ng-template>

    <div
      qzSplitterContainer
      orientation="horizontal"
      [minSize]="20"
      [maxSize]="80"
      [step]="5"
      [disabled]="false"
    >
      <div qzSplitterPanel>A</div>
      <div qzSplitterHandle aria-label="Resize panels"></div>
      <div [qzSplitterPanel]="false">B</div>
    </div>

    <button
      [qzTooltip]="tipTpl"
      tooltipPlacement="top"
      [tooltipArrowSize]="8"
      [tooltipArrowPadding]="4"
    >
      Tip
    </button>
    <ng-template #tipTpl let-arrow="arrow" let-placement="placement">
      <div>{{ placement() }} {{ arrow()?.offset }} {{ arrow()?.available }}</div>
    </ng-template>

    <button
      qzPopoverTrigger
      [popover]="popTpl"
      [arrowSize]="10"
      [arrowPadding]="2"
      #pop="qzPopoverTrigger"
    >
      Popover
    </button>
    <ng-template #popTpl let-arrow="arrow" let-placement="placement" let-open="open">
      <div qzPopover>{{ placement() }} {{ open() }} {{ arrow()?.side }}</div>
    </ng-template>
    <span>{{ pop.arrow()?.edge }} {{ pop.resolvedPlacement() }}</span>

    <button qzMenuTrigger [menu]="menuTpl">Menu</button>
    <ng-template #menuTpl>
      <div qzMenu>
        <div qzMenuGroup>
          <div qzMenuLabel>Account</div>
          <button qzMenuItem>Profile</button>
        </div>
        <div qzMenuSeparator></div>
        <button qzMenuItem>Sign out</button>
      </div>
    </ng-template>
  `,
})
class Floating016Component {
  private readonly drawers = inject(DrawerService);
  private readonly vcr = inject(ViewContainerRef);
  readonly drawerTpl = viewChild.required<TemplateRef<unknown>>('drawerTpl');

  openDrawer(side: DrawerSide): DialogRef {
    const ref = this.drawers.open(this.drawerTpl(), this.vcr, { side, presence: true });
    const state: 'opening' | 'open' | 'closing' | 'closed' = ref.state();
    void state;
    return ref;
  }
}

const geometry: OverlayArrowGeometry = calculateArrowGeometry(
  { left: 0, top: 0, width: 10, height: 10 },
  { left: 0, top: 10, width: 100, height: 40 },
  'bottom',
  { size: 8, padding: 2 },
);
const resolvedSide: 'left' | 'right' | 'top' | 'bottom' = resolveDrawerSide('inline-end', 'rtl');
const tooltipContextShape: Pick<TooltipContext, 'arrow' | 'placement'> | null = null;
const popoverContextShape: Pick<PopoverContext, 'open'> | null = null;
void geometry;
void resolvedSide;
void tooltipContextShape;
void popoverContextShape;
void Floating016Component;
