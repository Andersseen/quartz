import { Directive, TemplateRef, inject } from '@angular/core';

@Directive({
  selector: 'ng-template[qzComboboxContent]',
  exportAs: 'qzComboboxContent',
  standalone: true,
})
export class ComboboxContentDirective {
  readonly templateRef = inject(TemplateRef<unknown>);
}
