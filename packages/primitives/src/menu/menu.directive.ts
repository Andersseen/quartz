import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, OnDestroy, afterRenderEffect, inject, input } from '@angular/core';
import { DEFAULT_MENU_CONFIG, type MenuConfig } from './menu.types';
import { MenuService } from './menu.service';

export const QZ_MENU_SERVICE_PROPERTY = '__qzMenuService';

@Directive({
  selector: '[qzMenu]',
  exportAs: 'qzMenu',
  standalone: true,
  providers: [MenuService],
  host: {
    '[attr.role]': '"menu"',
    '(keydown)': 'onKeydown($event)',
  },
})
export class MenuDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly document = inject(DOCUMENT);
  readonly service = inject(MenuService);

  readonly config = input<Partial<MenuConfig>>({});

  constructor() {
    (this.elementRef.nativeElement as unknown as Record<string, MenuService>)[
      QZ_MENU_SERVICE_PROPERTY
    ] = this.service;
    afterRenderEffect(() => {
      this.service.configure({ ...DEFAULT_MENU_CONFIG, ...this.config() });
    });
  }

  onKeydown(event: KeyboardEvent): void {
    this.service.handleKeydown(event, this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    delete (this.elementRef.nativeElement as unknown as Record<string, MenuService>)[
      QZ_MENU_SERVICE_PROPERTY
    ];
    if (this.document.defaultView) this.service.destroy();
  }
}
