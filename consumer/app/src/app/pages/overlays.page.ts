import { Component, TemplateRef, ViewContainerRef, inject, signal, viewChild } from '@angular/core';
import {
  DialogRef,
  DialogService,
  DrawerService,
  MenuDirective,
  MenuItemDirective,
  MenuTriggerDirective,
  PopoverDirective,
  PopoverTriggerDirective,
  SelectContentDirective,
  SelectDirective,
  SelectListboxDirective,
  SelectOptionDirective,
  SelectTriggerDirective,
  ToastContainerComponent,
  ToastService,
  TooltipDirective,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-overlays-page',
  imports: [
    MenuDirective,
    MenuItemDirective,
    MenuTriggerDirective,
    PopoverDirective,
    PopoverTriggerDirective,
    SelectContentDirective,
    SelectDirective,
    SelectListboxDirective,
    SelectOptionDirective,
    SelectTriggerDirective,
    ToastContainerComponent,
    TooltipDirective,
  ],
  template: `
    <h1>Overlays</h1>
    <section>
      <button type="button" data-testid="open-dialog" (click)="openDialog()">Open dialog</button>
      <output data-testid="dialog-choice">{{ choice() }}</output>
      <button type="button" data-testid="open-drawer" (click)="openDrawer()">Open drawer</button>
    </section>

    <ng-template
      #dialogTpl
      let-ref
      let-labelledBy="ariaLabelledBy"
      let-describedBy="ariaDescribedBy"
    >
      <div class="panel" data-testid="dialog">
        <h2 [id]="labelledBy">Pick a fruit</h2>
        <p [id]="describedBy">The choice closes the dialog.</p>
        <div qzSelect [(value)]="picked" data-testid="dialog-select">
          <button qzSelectTrigger [attr.aria-label]="'Dialog fruit: ' + (picked() ?? 'Choose')">
            {{ picked() ?? 'Choose' }}
          </button>
          <ng-template qzSelectContent>
            <div qzSelectListbox class="panel">
              <div qzSelectOption="apple">Apple</div>
              <div qzSelectOption="pear">Pear</div>
            </div>
          </ng-template>
        </div>
        <button type="button" (click)="finish(ref)">Done</button>
        <button type="button" (click)="ref.close()">Cancel</button>
      </div>
    </ng-template>

    <ng-template
      #drawerTpl
      let-ref
      let-labelledBy="ariaLabelledBy"
      let-describedBy="ariaDescribedBy"
    >
      <div class="panel" data-testid="drawer">
        <h2 [id]="labelledBy">Drawer</h2>
        <p [id]="describedBy">Side panel.</p>
        <button type="button" (click)="ref.close()">Close drawer</button>
      </div>
    </ng-template>

    <section>
      <button qzTooltip="Saves your work" tooltipPlacement="bottom" data-testid="tooltip-anchor">
        Save
      </button>
      <button qzPopoverTrigger [popover]="pop" data-testid="popover-trigger">Popover</button>
      <ng-template #pop>
        <div qzPopover class="panel" data-testid="popover">
          Popover body <button>Inside</button>
        </div>
      </ng-template>
      <button qzMenuTrigger [menu]="menu" data-testid="menu-trigger">Menu</button>
      <ng-template #menu>
        <div qzMenu class="panel" data-testid="menu">
          <button qzMenuItem (selected)="menuChoice.set('one')">One</button>
          <button qzMenuItem (selected)="menuChoice.set('two')">Two</button>
        </div>
      </ng-template>
      <output data-testid="menu-choice">{{ menuChoice() }}</output>
    </section>

    <section>
      <button type="button" data-testid="toast" (click)="toast()">Show toast</button>
      <output data-testid="toast-undo">{{ undone() }}</output>
      <qz-toast-container />
    </section>
  `,
})
export class OverlaysPage {
  private readonly dialogs = inject(DialogService);
  private readonly drawers = inject(DrawerService);
  private readonly toasts = inject(ToastService);
  private readonly vcr = inject(ViewContainerRef);
  readonly dialogTpl = viewChild.required<TemplateRef<unknown>>('dialogTpl');
  readonly drawerTpl = viewChild.required<TemplateRef<unknown>>('drawerTpl');
  readonly picked = signal<string | null>(null);
  readonly choice = signal('none');
  readonly menuChoice = signal('none');
  readonly undone = signal('no');

  openDialog(): void {
    this.picked.set(null);
    this.dialogs.open(this.dialogTpl(), this.vcr, { ariaLabel: 'Fruit' });
  }

  finish(ref: DialogRef): void {
    this.choice.set(this.picked() ?? 'none');
    ref.close();
  }

  openDrawer(): void {
    this.drawers.open(this.drawerTpl(), this.vcr, { side: 'inline-end' });
  }

  toast(): void {
    this.toasts.show({
      type: 'success',
      message: 'File archived',
      duration: 0,
      actions: [{ label: 'Undo', run: () => this.undone.set('yes') }],
    });
  }
}
