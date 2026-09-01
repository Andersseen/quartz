import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';
import { NavbarDirective, NavbarMenuDirective, NavbarTriggerDirective } from './index';

@Component({
  standalone: true,
  imports: [NavbarDirective, NavbarMenuDirective, NavbarTriggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      qzNavbar
      sticky
      reveal="scroll-up"
      [scrollThreshold]="8"
      [directionThreshold]="2"
      [breakpoint]="768"
      [closeMenuOnDesktop]="false"
    >
      <button qzNavbarTrigger>Menu</button>
      <div qzNavbarMenu>
        <button>Mobile link</button>
      </div>
    </nav>
  `,
})
class NavbarHost {
  readonly filler = signal(true);
}

describe('Navbar', () => {
  it('toggles the mobile menu and wires trigger ARIA', async () => {
    const { fixture } = await render(NavbarHost);
    const trigger = screen.getByRole('button', { name: 'Menu' });
    const menu = screen.getByText('Mobile link').parentElement as HTMLElement;

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(menu).toHaveAttribute('aria-hidden', 'true');

    fireEvent.click(trigger);
    fixture.detectChanges();

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', menu.id);
    expect(menu).not.toHaveAttribute('aria-hidden');
  });

  it('updates scrolled, stuck, direction and reveal state only across thresholds', async () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) =>
      window.setTimeout(() => cb(0), 0),
    );
    const { fixture } = await render(NavbarHost);
    const nav = fixture.nativeElement.querySelector('[data-qz-navbar]') as HTMLElement;

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 24 });
    fireEvent.scroll(window);
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(nav).toHaveAttribute('data-qz-scrolled');
    expect(nav).toHaveAttribute('data-qz-stuck');
    expect(nav).toHaveAttribute('data-qz-scroll-direction', 'down');
    expect(nav).not.toHaveAttribute('data-qz-visible');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 12 });
    fireEvent.scroll(window);
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(nav).toHaveAttribute('data-qz-scroll-direction', 'up');
    expect(nav).toHaveAttribute('data-qz-visible');
  });

  it('dismisses the mobile menu with Escape and outside pointer', async () => {
    const { fixture } = await render(NavbarHost);
    const trigger = screen.getByRole('button', { name: 'Menu' });

    fireEvent.click(trigger);
    fixture.detectChanges();
    fireEvent.keyDown(document, { key: 'Escape' });
    fixture.detectChanges();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);
    fixture.detectChanges();
    fireEvent.pointerDown(document.body);
    fixture.detectChanges();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
