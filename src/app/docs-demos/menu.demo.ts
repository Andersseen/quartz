import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import {
  MenuCheckboxItemDirective,
  MenuDirective,
  MenuItemDirective,
  MenuRadioGroupDirective,
  MenuRadioItemDirective,
  MenuSeparatorDirective,
  MenuTriggerDirective,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-menu-demo',
  imports: [
    MenuDirective,
    MenuTriggerDirective,
    MenuItemDirective,
    MenuSeparatorDirective,
    MenuCheckboxItemDirective,
    MenuRadioGroupDirective,
    MenuRadioItemDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './menu.demo.html',
  styles: [
    `
      .menu-item {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: space-between;
        border-radius: 6px;
        padding: 8px 10px;
        text-align: left;
        color: #e5e7eb;
      }

      .menu-item[data-qz-highlighted] {
        background: rgba(16, 185, 129, 0.14);
        color: #ffffff;
      }

      .menu-item[data-qz-disabled] {
        cursor: not-allowed;
        color: #6b7280;
      }

      .menu-item[data-qz-checked]::before {
        content: '✓';
        margin-right: 8px;
        color: #10b981;
      }
    `,
  ],
})
export class MenuDemoComponent {
  readonly selected = signal('None');
  readonly showToolbar = signal(true);
  readonly density = signal<'compact' | 'comfortable'>('comfortable');
}
