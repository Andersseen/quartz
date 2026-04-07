import {
  Component,
  ChangeDetectionStrategy,
  viewChild,
  TemplateRef,
  ViewContainerRef,
  inject,
  signal,
} from '@angular/core';
import { DialogService, DialogRef, type DialogPosition } from 'quartz';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import {
  MODAL_SNIPPET,
  DRAWER_SNIPPET,
  BACKDROP_SNIPPET,
  DIALOG_REF_SNIPPET,
} from './dialog.snippets';

@Component({
  selector: 'app-dialog-page',
  standalone: true,
  imports: [DemoPageComponent, CodeBlockComponent],
  templateUrl: './dialog.page.html',
  styleUrl: './dialog.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DialogPage {
  private dialogService = inject(DialogService);
  private vcr = inject(ViewContainerRef);

  modalTemplate = viewChild.required<TemplateRef<unknown>>('modalTemplate');
  drawerTemplate = viewChild.required<TemplateRef<unknown>>('drawerTemplate');

  activeDrawer = signal<DialogPosition | null>(null);

  readonly modalCode = MODAL_SNIPPET;
  readonly drawerCode = DRAWER_SNIPPET;
  readonly backdropCode = BACKDROP_SNIPPET;
  readonly dialogRefCode = DIALOG_REF_SNIPPET;

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
    ref.closed$.subscribe(() => this.activeDrawer.set(null));
  }

  openDrawer(pos: DialogPosition): void {
    this.activeDrawer.set(pos);
    const ref: DialogRef = this.dialogService.open(this.drawerTemplate(), this.vcr, {
      position: pos,
      panelClass: `qz-drawer-panel qz-drawer-panel--${pos}`,
      width: pos === 'left' || pos === 'right' ? '360px' : undefined,
      height: pos === 'top' || pos === 'bottom' ? '280px' : undefined,
    });
    ref.closed$.subscribe(() => this.activeDrawer.set(null));
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
