// Real-consumer smoke fixture. Deliberately uses ONLY the public package specifiers a real
// installer would resolve — no deep imports into dist/src, no tsconfig path aliases (this
// fixture's tsconfig has no "paths" field at all). If this file fails to compile, the
// published packages' exports/types are broken for a real external consumer, even though
// the monorepo's own workspace-symlink-based dev flow would never surface it.

import { Component, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  CollectionStore,
  OverlayTriggerDirective,
  createDismissController,
  createFocusRestorer,
  createFocusTrap,
  createScrollLock,
  isFocusable,
  type CollectionItem,
  type DismissReason,
} from '@quartz-headless/core';
import {
  CheckboxDirective,
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
  MenuDirective,
  MenuItemDirective,
  MenuTriggerDirective,
  PopoverDirective,
  PopoverTriggerDirective,
  RangeSliderDirective,
  RangeSliderRangeDirective,
  RangeSliderThumbDirective,
  RangeSliderTrackDirective,
  type RangeSliderValue,
  SliderDirective,
  SliderThumbDirective,
  SliderTrackDirective,
  ToggleDirective,
  ToggleGroupDirective,
  ToggleItemDirective,
  ToastContainerComponent,
  ToastService,
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
