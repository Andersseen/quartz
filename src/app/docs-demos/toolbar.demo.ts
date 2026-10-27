import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ToolbarDirective, ToolbarItemDirective } from '@quartz-headless/primitives';

@Component({
  selector: 'app-toolbar-demo',
  imports: [ToolbarDirective, ToolbarItemDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="qz-demo-card">
    <h3>Editor tools</h3>
    <div qzToolbar aria-label="Editor tools" class="flex gap-2" [orientation]="orientation()">
      <button qzToolbarItem>Bold</button><button qzToolbarItem>Italic</button
      ><button qzToolbarItem [disabled]="disabled()">Unavailable</button
      ><button qzToolbarItem>Underline</button>
    </div>
    <p class="mt-3">
      Use arrow keys, Home and End.
      <button type="button" (click)="toggleOrientation()">Toggle orientation</button>
      <button type="button" (click)="disabled.update(v => !v)">Toggle disabled item</button>
    </p>
  </section>`,
})
export class ToolbarDemoComponent {
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly disabled = signal(true);
  toggleOrientation(): void {
    this.orientation.update((value) => (value === 'horizontal' ? 'vertical' : 'horizontal'));
  }
}
