import {
  Component,
  ChangeDetectionStrategy,
  viewChild,
  TemplateRef,
  ViewContainerRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogService, DialogRef, type DialogPosition } from '@quartz-headless/primitives';
import { VoltButton } from '@voltui/components';

@Component({
  selector: 'app-dialog-demo',
  imports: [VoltButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dialog.demo.html',
})
export class DialogDemoComponent {
  private dialogService = inject(DialogService);
  private vcr = inject(ViewContainerRef);

  modalTemplate = viewChild.required<TemplateRef<unknown>>('modalTemplate');
  drawerTemplate = viewChild.required<TemplateRef<unknown>>('drawerTemplate');

  activeDrawer = signal<DialogPosition | null>(null);
  readonly drawerPositions: { pos: DialogPosition; label: string; icon: string }[] = [
    { pos: 'left', label: 'Left', icon: '←' },
    { pos: 'right', label: 'Right', icon: '→' },
    { pos: 'top', label: 'Top', icon: '↑' },
    { pos: 'bottom', label: 'Bottom', icon: '↓' },
  ];

  openModal(): void {
    const ref = this.dialogService.open(this.modalTemplate(), this.vcr, {
      position: 'center',
      panelClass: 'qz-dialog-panel',
      width: '480px',
    });
    ref.closed$.pipe(takeUntilDestroyed()).subscribe(() => this.activeDrawer.set(null));
  }

  openDrawer(pos: DialogPosition): void {
    this.activeDrawer.set(pos);
    const ref: DialogRef = this.dialogService.open(this.drawerTemplate(), this.vcr, {
      position: pos,
      panelClass: `qz-drawer-panel qz-drawer-panel--${pos}`,
      width: pos === 'left' || pos === 'right' ? '360px' : undefined,
      height: pos === 'top' || pos === 'bottom' ? '280px' : undefined,
    });
    ref.closed$.pipe(takeUntilDestroyed()).subscribe(() => this.activeDrawer.set(null));
  }

  openNoBackdrop(): void {
    this.dialogService.open(this.modalTemplate(), this.vcr, {
      position: 'center',
      panelClass: 'qz-dialog-panel',
      width: '480px',
      backdrop: false,
      closeOnBackdropClick: false,
    });
  }
}
