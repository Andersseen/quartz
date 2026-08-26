import {
  booleanAttribute,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ListboxDirective } from './listbox.directive';

let optionId = 0;

@Directive({
  selector: '[qzListboxOption]',
  exportAs: 'qzListboxOption',
  standalone: true,
  host: {
    '[attr.id]': 'id',
    '[attr.role]': '"option"',
    '[attr.aria-selected]': 'selected()',
    '[attr.aria-disabled]': 'optionDisabled() || null',
    '[attr.data-qz-selected]': 'selected() ? "" : null',
    '[attr.data-qz-active]': 'active() ? "" : null',
    '[attr.data-qz-disabled]': 'optionDisabled() ? "" : null',
    '(click)': 'onClick()',
  },
})
export class ListboxOptionDirective<T> implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly listbox = inject<ListboxDirective<T>>(ListboxDirective);

  readonly qzListboxOption = input.required<T>();
  readonly qzListboxOptionDisabled = input(false, { transform: booleanAttribute });
  readonly id = `qz-listbox-option-${++optionId}`;
  readonly selected = computed(() => this.listbox.isSelected(this));
  readonly active = computed(() => this.listbox.activeId() === this.id);
  readonly label = computed(() => this.elementRef.nativeElement.textContent?.trim() ?? '');
  readonly element = () => this.elementRef.nativeElement;
  readonly disabled = () => this.optionDisabled();

  readonly optionDisabled = this.qzListboxOptionDisabled;
  readonly value = this.qzListboxOption;

  ngOnInit(): void {
    this.listbox.register(this);
  }

  ngOnDestroy(): void {
    this.listbox.unregister(this);
  }

  onClick(): void {
    this.listbox.select(this);
  }
}
