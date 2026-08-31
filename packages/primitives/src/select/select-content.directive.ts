import { Directive, TemplateRef, inject } from '@angular/core';

@Directive({
  selector: 'ng-template[qzSelectContent]',
  exportAs: 'qzSelectContent',
  standalone: true,
})
export class SelectContentDirective {
  readonly templateRef = inject(TemplateRef<unknown>);
}
