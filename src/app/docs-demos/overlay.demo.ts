import {
  Component,
  ChangeDetectionStrategy,
  signal,
  viewChild,
  TemplateRef,
  ViewContainerRef,
  ElementRef,
  inject,
} from '@angular/core';
import {
  OverlayTriggerDirective,
  OverlayService,
  OverlayRef,
  type OverlayPlacement,
} from '@quartz-headless/core';
import { TooltipDirective } from '@quartz-headless/primitives';
import { VoltButton } from '@voltui/components';

@Component({
  selector: 'app-overlay-demo',
  imports: [OverlayTriggerDirective, TooltipDirective, VoltButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overlay.demo.html',
})
export class OverlayDemoComponent {
  private overlayService = inject(OverlayService);
  private viewContainerRef = inject(ViewContainerRef);

  readonly progAnchor = viewChild<ElementRef<HTMLElement>>('progAnchor');
  readonly progTpl = viewChild<TemplateRef<unknown>>('progTpl');
  progRef: OverlayRef | null = null;

  selectedOption = signal('Choose an option…');

  readonly placements: OverlayPlacement[] = [
    'top-start',
    'top',
    'top-end',
    'bottom-start',
    'bottom',
    'bottom-end',
    'left-start',
    'left',
    'left-end',
    'right-start',
    'right',
    'right-end',
  ];

  readonly menuItems = [
    { icon: '✏️', label: 'Edit', shortcut: '⌘E', danger: false },
    { icon: '📋', label: 'Duplicate', shortcut: '⌘D', danger: false },
    { icon: '🔗', label: 'Copy link', shortcut: null, danger: false },
    { icon: '🗑️', label: 'Delete', shortcut: '⌫', danger: true },
  ];

  readonly selectOptions = ['Design system', 'Frontend', 'Backend', 'DevOps', 'Product'];
  toggleProgrammatic(): void {
    const anchor = this.progAnchor()?.nativeElement;
    const tpl = this.progTpl();
    if (!anchor || !tpl) return;

    if (this.progRef?.isOpen) {
      this.progRef.close();
      return;
    }

    this.progRef?.destroy();
    this.progRef = this.overlayService.create(tpl, this.viewContainerRef, anchor, {
      placement: 'bottom-start',
      offset: 8,
    });
    this.progRef.open();
  }
}
