import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import {
  SidebarContentDirective,
  SidebarDirective,
  SidebarPanelDirective,
  SidebarTriggerDirective,
} from './index';

const SIDEBAR_IMPORTS = [
  SidebarDirective,
  SidebarPanelDirective,
  SidebarContentDirective,
  SidebarTriggerDirective,
];

@Component({
  standalone: true,
  imports: SIDEBAR_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzSidebar
      [(open)]="open"
      [(collapsed)]="collapsed"
      [mode]="mode()"
      [side]="side()"
      [breakpoint]="768"
      [autoCloseOnMobile]="false"
      [attr.dir]="dir()"
    >
      <aside qzSidebarPanel aria-label="App navigation">
        <button>First link</button>
      </aside>
      <main qzSidebarContent>
        <button qzSidebarTrigger>Toggle</button>
        Content
      </main>
    </div>
  `,
})
class SidebarHost {
  readonly open = signal(true);
  readonly collapsed = signal(false);
  readonly mode = signal<'push' | 'overlay' | null>('push');
  readonly side = signal<'inline-start' | 'inline-end'>('inline-start');
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
}

describe('Sidebar', () => {
  it('separates open and collapsed state and wires trigger ARIA', async () => {
    const { fixture } = await render(SidebarHost);
    const host = fixture.nativeElement.querySelector('[data-qz-sidebar]') as HTMLElement;
    const panel = screen.getByLabelText('App navigation');
    const trigger = screen.getByRole('button', { name: 'Toggle' });

    expect(host).toHaveAttribute('data-qz-state', 'expanded');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', panel.id);

    fixture.componentInstance.collapsed.set(true);
    fixture.detectChanges();
    expect(host).toHaveAttribute('data-qz-state', 'collapsed');

    fireEvent.click(trigger);
    fixture.detectChanges();
    expect(host).toHaveAttribute('data-qz-state', 'closed');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses logical side with RTL resolution in overlay mode', async () => {
    const { fixture } = await render(SidebarHost);
    fixture.componentInstance.mode.set('overlay');
    fixture.componentInstance.dir.set('rtl');
    fixture.detectChanges();

    const panel = screen.getByLabelText('App navigation');
    expect(panel.style.right).toBe('0px');
    expect(panel.style.left).toBe('');
  });

  it('dismisses an overlay sidebar from Escape and outside pointer', async () => {
    const { fixture } = await render(SidebarHost);
    fixture.componentInstance.mode.set('overlay');
    fixture.detectChanges();

    fireEvent.keyDown(document, { key: 'Escape' });
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    fireEvent.pointerDown(document.body);
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
  });
});
