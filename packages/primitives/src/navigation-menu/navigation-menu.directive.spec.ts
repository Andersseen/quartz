import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  NavigationMenuDirective,
  NavigationMenuLinkDirective,
  NavigationMenuListDirective,
} from './navigation-menu.directive';
import { NavigationMenuItemDirective } from './navigation-menu-item.directive';
import {
  NavigationMenuContentDirective,
  NavigationMenuTriggerDirective,
} from './navigation-menu-trigger.directive';

@Component({
  standalone: true,
  imports: [
    NavigationMenuDirective,
    NavigationMenuListDirective,
    NavigationMenuItemDirective,
    NavigationMenuTriggerDirective,
    NavigationMenuContentDirective,
    NavigationMenuLinkDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      qzNavigationMenu
      aria-label="Main navigation"
      [(value)]="value"
      [orientation]="orientation()"
      [disabled]="disabled()"
      [showDelay]="showDelay()"
      [hideDelay]="hideDelay()"
    >
      <ul qzNavigationMenuList>
        <li qzNavigationMenuItem="products" [qzNavigationMenuItemDisabled]="itemDisabled()">
          <button qzNavigationMenuTrigger>Products</button>
          <ng-template qzNavigationMenuContent>
            <div><a href="/products" qzNavigationMenuLink>Product overview</a></div>
          </ng-template>
        </li>
        <li qzNavigationMenuItem="company">
          <button qzNavigationMenuTrigger>Company</button>
          <ng-template qzNavigationMenuContent>
            <div>
              <a href="/company" qzNavigationMenuLink [qzNavigationMenuLinkCurrent]="true"
                >Company page</a
              >
            </div>
          </ng-template>
        </li>
        <li qzNavigationMenuItem="disabled" qzNavigationMenuItemDisabled>
          <button qzNavigationMenuTrigger>Disabled</button>
          <ng-template qzNavigationMenuContent><div>Disabled content</div></ng-template>
        </li>
      </ul>
    </nav>
  `,
})
class NavigationMenuHost {
  readonly value = signal('');
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly disabled = signal(false);
  readonly itemDisabled = signal(false);
  readonly showDelay = signal(10);
  readonly hideDelay = signal(10);
}

afterEach(() => vi.useRealTimers());

describe('NavigationMenu', () => {
  it('does not put aria-orientation on the plain list (not allowed for its implicit role)', async () => {
    const { container } = await render(NavigationMenuHost);
    const list = container.querySelector('[qzNavigationMenuList]')!;
    expect(list.hasAttribute('aria-orientation')).toBe(false);
    expect(list.getAttribute('data-qz-orientation')).toBe('horizontal');
  });

  it('uses navigation disclosure semantics and only references mounted content', async () => {
    const { fixture } = await render(NavigationMenuHost);
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    const trigger = screen.getByRole('button', { name: 'Products' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).not.toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).not.toHaveAttribute('aria-controls');

    fireEvent.click(trigger);
    await screen.findByRole('link', { name: 'Product overview' });
    fixture.detectChanges();
    expect(nav).toContainElement(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger.getAttribute('aria-controls')).toBeTruthy();
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Company' }));
    await screen.findByRole('link', { name: 'Company page' });
    expect(screen.getByRole('link', { name: 'Company page' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('opens on ArrowDown, enters content, and Escape closes the top layer and restores focus', async () => {
    const { fixture } = await render(NavigationMenuHost);
    const trigger = screen.getByRole('button', { name: 'Products' });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    await screen.findByRole('link', { name: 'Product overview' });
    fixture.detectChanges();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Product overview' }));

    fireEvent.keyDown(document, { key: 'Escape' });
    fixture.detectChanges();
    expect(screen.queryByRole('link', { name: 'Product overview' })).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(trigger);
  });

  it('switches one controlled flyout between triggers and supports sibling keyboard navigation', async () => {
    const { fixture } = await render(NavigationMenuHost);
    const host = fixture.componentInstance;
    const products = screen.getByRole('button', { name: 'Products' });
    const company = screen.getByRole('button', { name: 'Company' });
    host.value.set('products');
    fixture.detectChanges();
    await screen.findByRole('link', { name: 'Product overview' });
    expect(products).toHaveAttribute('aria-expanded', 'true');

    host.value.set('company');
    fixture.detectChanges();
    await screen.findByRole('link', { name: 'Company page' });
    expect(products).toHaveAttribute('aria-expanded', 'false');
    expect(company).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('link', { name: 'Product overview' })).not.toBeInTheDocument();

    products.focus();
    fireEvent.keyDown(products, { key: 'ArrowRight' });
    fixture.detectChanges();
    expect(document.activeElement).toBe(company);
  });

  it('skips disabled triggers and respects the root disabled input', async () => {
    const { fixture } = await render(NavigationMenuHost);
    const host = fixture.componentInstance;
    const products = screen.getByRole('button', { name: 'Products' });
    const disabled = screen.getByRole('button', { name: 'Disabled' });
    expect(disabled).toBeDisabled();
    products.focus();
    fireEvent.keyDown(products, { key: 'ArrowRight' });
    fixture.detectChanges();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Company' }));

    host.disabled.set(true);
    fixture.detectChanges();
    fireEvent.click(products);
    expect(host.value()).toBe('');
    expect(products).toBeDisabled();
  });

  it('opens and closes with hover delays, cancels stale timers, and dismisses outside', async () => {
    vi.useFakeTimers();
    const { fixture } = await render(NavigationMenuHost);
    const products = screen.getByRole('button', { name: 'Products' });
    const company = screen.getByRole('button', { name: 'Company' });
    fireEvent.pointerEnter(products, { pointerType: 'mouse' });
    await vi.advanceTimersByTimeAsync(10);
    fixture.detectChanges();
    await screen.findByRole('link', { name: 'Product overview' });

    fireEvent.pointerLeave(products, { pointerType: 'mouse' });
    fireEvent.pointerEnter(company, { pointerType: 'mouse' });
    await vi.advanceTimersByTimeAsync(10);
    fixture.detectChanges();
    await screen.findByRole('link', { name: 'Company page' });
    expect(screen.queryByRole('link', { name: 'Product overview' })).not.toBeInTheDocument();

    fireEvent.pointerLeave(company, { pointerType: 'mouse' });
    await vi.advanceTimersByTimeAsync(10);
    fixture.detectChanges();
    expect(screen.queryByRole('link', { name: 'Company page' })).not.toBeInTheDocument();

    fireEvent.click(products);
    await screen.findByRole('link', { name: 'Product overview' });
    fireEvent.pointerDown(document.body);
    fixture.detectChanges();
    expect(screen.queryByRole('link', { name: 'Product overview' })).not.toBeInTheDocument();
  });
});
