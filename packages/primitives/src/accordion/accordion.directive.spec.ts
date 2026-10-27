import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { AccordionDirective } from './accordion.directive';
import { AccordionItemDirective } from './accordion-item.directive';
import { AccordionPanelDirective } from './accordion-panel.directive';
import { AccordionTriggerDirective } from './accordion-trigger.directive';

const ACCORDION_IMPORTS = [
  AccordionDirective,
  AccordionItemDirective,
  AccordionTriggerDirective,
  AccordionPanelDirective,
];

@Component({
  standalone: true,
  imports: ACCORDION_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzAccordion
      [(value)]="value"
      [type]="type()"
      [collapsible]="collapsible()"
      [orientation]="orientation()"
      [disabled]="disabled()"
      [attr.dir]="dir()"
    >
      @for (item of items(); track item) {
        <div [qzAccordionItem]="item" [qzAccordionItemDisabled]="item === disabledItem()">
          <button qzAccordionTrigger>{{ item }}</button>
          <div qzAccordionPanel>{{ item }} panel</div>
        </div>
      }
    </div>
  `,
})
class AccordionHost {
  readonly value = signal<string | string[] | null>(null);
  readonly type = signal<'single' | 'multiple'>('single');
  readonly collapsible = signal(false);
  readonly orientation = signal<'vertical' | 'horizontal'>('vertical');
  readonly disabled = signal(false);
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly items = signal(['One', 'Two', 'Three']);
  readonly disabledItem = signal('Three');
}

describe('Accordion', () => {
  it('keeps one item open by default in single non-collapsible mode', async () => {
    await render(AccordionHost);

    expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Two panel')).toHaveAttribute('hidden');
  });

  it('moves the open item in single mode', async () => {
    const { fixture } = await render(AccordionHost);

    fireEvent.click(screen.getByRole('button', { name: 'Two' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('Two');
    expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('allows no open item when collapsible', async () => {
    const { fixture } = await render(AccordionHost);
    fixture.componentInstance.collapsible.set(true);
    fixture.detectChanges();

    fireEvent.click(screen.getByRole('button', { name: 'One' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBeNull();
  });

  it('supports multiple open items', async () => {
    const { fixture } = await render(AccordionHost);
    fixture.componentInstance.type.set('multiple');
    fixture.componentInstance.value.set([]);
    fixture.detectChanges();

    fireEvent.click(screen.getByRole('button', { name: 'One' }));
    fireEvent.click(screen.getByRole('button', { name: 'Two' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toEqual(['One', 'Two']);
  });

  it('moves focus among enabled triggers with arrow keys', async () => {
    await render(AccordionHost);

    screen.getByRole('button', { name: 'One' }).focus();
    fireEvent.keyDown(screen.getByRole('button', { name: 'One' }), { key: 'ArrowDown' });

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Two' }));

    fireEvent.keyDown(screen.getByRole('button', { name: 'Two' }), { key: 'ArrowDown' });

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Two' }));
  });

  it('propagates container disabled without confusing the required-open trigger', async () => {
    const { fixture } = await render(AccordionHost);
    const host = fixture.componentInstance;
    const one = screen.getByRole('button', { name: 'One' });
    expect(one).toHaveAttribute('aria-disabled', 'true');
    expect(one).toHaveAttribute('tabindex', '0');

    host.disabled.set(true);
    fixture.detectChanges();
    expect(one).toHaveAttribute('aria-disabled', 'true');
    expect(one).toHaveAttribute('tabindex', '-1');
    fireEvent.click(screen.getByRole('button', { name: 'Two' }));
    fixture.detectChanges();
    expect(host.value()).toBe('One');
  });

  it('uses horizontal arrows in RTL and keeps focus navigation separate from activation', async () => {
    const { fixture } = await render(AccordionHost);
    const host = fixture.componentInstance;
    host.orientation.set('horizontal');
    host.dir.set('rtl');
    fixture.detectChanges();
    const one = screen.getByRole('button', { name: 'One' });
    const two = screen.getByRole('button', { name: 'Two' });
    one.focus();
    fireEvent.keyDown(one, { key: 'ArrowLeft' });
    fixture.detectChanges();
    expect(document.activeElement).toBe(two);
    expect(host.value()).toBe('One');
    expect(two).toHaveAttribute('aria-expanded', 'false');
  });

  it('recovers focus when a focused trigger is removed', async () => {
    const { fixture } = await render(AccordionHost);
    const host = fixture.componentInstance;
    screen.getByRole('button', { name: 'One' }).focus();
    host.items.set(['Two', 'Three']);
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Two' }));
    expect(host.value()).toBe('Two');
  });
});
