import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { TabDirective } from './tab.directive';
import { TabListDirective } from './tab-list.directive';
import { TabPanelDirective } from './tab-panel.directive';
import { TabsDirective } from './tabs.directive';

const TABS_IMPORTS = [TabsDirective, TabListDirective, TabDirective, TabPanelDirective];

@Component({
  standalone: true,
  imports: TABS_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div qzTabs [(value)]="value" [activationMode]="activationMode()" [attr.dir]="dir()">
      <div qzTabList>
        <button qzTab="account">Account</button>
        <button qzTab="security" [qzTabDisabled]="securityDisabled()">Security</button>
        <button qzTab="billing">Billing</button>
      </div>
      <section qzTabPanel="account">Account panel</section>
      <section qzTabPanel="security">Security panel</section>
      <section qzTabPanel="billing">Billing panel</section>
    </div>
  `,
})
class TabsHost {
  readonly value = signal<string | null>(null);
  readonly activationMode = signal<'automatic' | 'manual'>('automatic');
  readonly securityDisabled = signal(false);
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
}

describe('Tabs', () => {
  it('selects the first enabled tab by default and wires ARIA relationships', async () => {
    await render(TabsHost);

    const tab = screen.getByRole('tab', { name: 'Account' });
    const panel = screen.getByRole('tabpanel', { name: 'Account' });

    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(tab).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', tab.id);
  });

  it('activates on click', async () => {
    const { fixture } = await render(TabsHost);

    fireEvent.click(screen.getByRole('tab', { name: 'Billing' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('billing');
    expect(screen.getByText('Account panel')).toHaveAttribute('hidden');
    expect(screen.getByText('Billing panel')).not.toHaveAttribute('hidden');
  });

  it('supports automatic keyboard activation while skipping disabled tabs', async () => {
    const { fixture } = await render(TabsHost);
    fixture.componentInstance.securityDisabled.set(true);
    fixture.detectChanges();

    screen.getByRole('tab', { name: 'Account' }).focus();
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });

    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Billing' }));
    expect(fixture.componentInstance.value()).toBe('billing');
  });

  it('supports manual activation', async () => {
    const { fixture } = await render(TabsHost);
    fixture.componentInstance.activationMode.set('manual');
    fixture.detectChanges();

    screen.getByRole('tab', { name: 'Account' }).focus();
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });

    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Security' }));
    expect(fixture.componentInstance.value()).toBe('account');
  });

  it('uses RTL inline navigation for horizontal tablists', async () => {
    const { fixture } = await render(TabsHost);
    fixture.componentInstance.dir.set('rtl');
    fixture.detectChanges();

    screen.getByRole('tab', { name: 'Account' }).focus();
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' });

    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Security' }));
  });
});
