import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewContainerRef,
  inject,
  viewChild,
} from '@angular/core';
import { render, screen, fireEvent } from '@testing-library/angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DialogRef } from '../dialog/dialog-ref';
import { DrawerService, resolveDrawerSide } from './drawer.service';
import type { DrawerConfig } from './drawer.types';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="page"><button id="opener">open</button></main>
    <ng-template #tpl let-ref let-labelledBy="ariaLabelledBy" let-describedBy="ariaDescribedBy">
      <h2 [id]="labelledBy">Title</h2>
      <p [id]="describedBy">Description</p>
      <button (click)="ref.close()">inside</button>
    </ng-template>
  `,
})
class Host {
  readonly drawers = inject(DrawerService);
  readonly vcr = inject(ViewContainerRef);
  readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
  closedCount = 0;
  open(config: Partial<DrawerConfig> = {}): DialogRef {
    const ref = this.drawers.open(this.tpl(), this.vcr, config);
    ref.closed$.subscribe(() => this.closedCount++);
    return ref;
  }
}

const panel = () => document.querySelector<HTMLElement>('[data-qz-drawer]');
const wrapper = () => document.querySelector<HTMLElement>('[data-qz-dialog-wrapper]');

describe('DrawerService', () => {
  let style: HTMLStyleElement;
  beforeEach(() => {
    style = document.createElement('style');
    style.textContent = `[data-qz-drawer][data-state='closing'] { transition-duration: 200ms; }`;
    document.head.appendChild(style);
  });
  afterEach(() => {
    style.remove();
    document.documentElement.removeAttribute('dir');
    document
      .querySelectorAll('[data-qz-dialog-backdrop], [data-qz-dialog-wrapper]')
      .forEach((el) => el.remove());
    document.body.style.overflow = '';
    vi.useRealTimers();
  });

  it('resolves logical sides against the writing direction', () => {
    expect(resolveDrawerSide('inline-start', 'ltr')).toBe('left');
    expect(resolveDrawerSide('inline-start', 'rtl')).toBe('right');
    expect(resolveDrawerSide('inline-end', 'ltr')).toBe('right');
    expect(resolveDrawerSide('inline-end', 'rtl')).toBe('left');
    expect(resolveDrawerSide('left', 'rtl')).toBe('left');
    expect(resolveDrawerSide('top', 'rtl')).toBe('top');
  });

  it.each([
    ['left', 'flex-start', undefined],
    ['right', 'flex-end', undefined],
    ['top', 'flex-start', 'column'],
    ['bottom', 'flex-end', 'column'],
  ] as const)('anchors a %s drawer to its edge', async (side, justify, direction) => {
    const { fixture } = await render(Host);
    fixture.componentInstance.open({ side });
    expect(panel()).toHaveAttribute('data-side', side);
    expect(wrapper()?.style.justifyContent).toBe(justify);
    expect(wrapper()?.style.flexDirection).toBe(direction ?? '');
  });

  it('puts inline-start on the right in RTL and on the left in LTR', async () => {
    document.documentElement.setAttribute('dir', 'rtl');
    const { fixture } = await render(Host);
    const ref = fixture.componentInstance.open({ side: 'inline-start' });
    expect(panel()).toHaveAttribute('data-side', 'right');
    ref.close();
    panel()!.dispatchEvent(new Event('transitionend'));
    document.documentElement.setAttribute('dir', 'ltr');
    fixture.componentInstance.open({ side: 'inline-start' });
    expect(panel()).toHaveAttribute('data-side', 'left');
  });

  it('is a labelled, described modal dialog that takes focus', async () => {
    const { fixture } = await render(Host);
    fixture.componentInstance.open();
    const dialog = panel()!;
    expect(dialog).toHaveAttribute('role', 'dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)).toHaveTextContent(
      'Title',
    );
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('applies no visual dimensions of its own', async () => {
    const { fixture } = await render(Host);
    fixture.componentInstance.open();
    expect(panel()!.style.width).toBe('');
    expect(panel()!.style.height).toBe('');
  });

  it('closes without waiting when nothing animates, emitting closed$ once', async () => {
    const { fixture } = await render(Host);
    style.remove();
    const ref = fixture.componentInstance.open();
    ref.close();
    ref.close();
    expect(panel()).toBeNull();
    expect(ref.state()).toBe('closed');
    expect(fixture.componentInstance.closedCount).toBe(1);
    expect(document.body.style.overflow).toBe('');
  });

  describe('exit presence', () => {
    it('stays mounted as data-state=closing until the transition ends, keeping the lock', async () => {
      const { fixture } = await render(Host);
      const ref = fixture.componentInstance.open();
      const el = panel()!;
      ref.close();
      expect(ref.state()).toBe('closing');
      expect(el.isConnected).toBe(true);
      expect(el).toHaveAttribute('data-state', 'closing');
      expect(document.body.style.overflow).toBe('hidden');
      expect(fixture.componentInstance.closedCount).toBe(0);

      el.dispatchEvent(new Event('transitionend'));
      expect(el.isConnected).toBe(false);
      expect(ref.state()).toBe('closed');
      expect(document.body.style.overflow).toBe('');
      expect(fixture.componentInstance.closedCount).toBe(1);
    });

    it('ignores end events bubbling from children', async () => {
      const { fixture } = await render(Host);
      const ref = fixture.componentInstance.open();
      const el = panel()!;
      ref.close();
      screen.getByText('inside').dispatchEvent(new Event('transitionend', { bubbles: true }));
      expect(el.isConnected).toBe(true);
      el.dispatchEvent(new Event('transitionend'));
      expect(el.isConnected).toBe(false);
    });

    it('falls back to a timer when no end event ever arrives', async () => {
      vi.useFakeTimers();
      const { fixture } = await render(Host);
      const ref = fixture.componentInstance.open();
      const el = panel()!;
      ref.close();
      vi.advanceTimersByTime(250);
      expect(el.isConnected).toBe(true);
      vi.advanceTimersByTime(100);
      expect(el.isConnected).toBe(false);
      expect(fixture.componentInstance.closedCount).toBe(1);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('does not start a second exit or a second notification on repeated close/Escape', async () => {
      const { fixture } = await render(Host);
      const ref = fixture.componentInstance.open();
      const el = panel()!;
      ref.close();
      fireEvent.keyDown(document, { key: 'Escape' });
      ref.close();
      el.dispatchEvent(new Event('transitionend'));
      el.dispatchEvent(new Event('transitionend'));
      expect(fixture.componentInstance.closedCount).toBe(1);
    });

    it('cleans up immediately when the host is destroyed mid-exit, with no orphaned timer', async () => {
      vi.useFakeTimers();
      const { fixture } = await render(Host);
      const ref = fixture.componentInstance.open();
      ref.close();
      expect(panel()).not.toBeNull();
      fixture.destroy();
      expect(panel()).toBeNull();
      expect(document.body.style.overflow).toBe('');
      expect(fixture.componentInstance.closedCount).toBe(1);
      // Any leftover timer firing now must not notify a second time.
      vi.runOnlyPendingTimers();
      expect(fixture.componentInstance.closedCount).toBe(1);
    });

    it('skips the wait under prefers-reduced-motion', async () => {
      const original = window.matchMedia;
      window.matchMedia = ((q: string) => ({ matches: q.includes('reduce') })) as never;
      try {
        const { fixture } = await render(Host);
        const ref = fixture.componentInstance.open();
        ref.close();
        expect(panel()).toBeNull();
        expect(fixture.componentInstance.closedCount).toBe(1);
      } finally {
        window.matchMedia = original;
      }
    });

    it('can be turned off to remove the panel immediately', async () => {
      const { fixture } = await render(Host);
      const ref = fixture.componentInstance.open({ presence: false });
      ref.close();
      expect(panel()).toBeNull();
    });
  });

  it('restores focus to the opener and releases background inertness after the exit', async () => {
    const { fixture } = await render(Host);
    const opener = document.getElementById('opener')!;
    opener.focus();
    const ref = fixture.componentInstance.open();
    const page = document.getElementById('page')!;
    expect(page.closest('[inert]')).not.toBeNull();
    ref.close();
    expect(page.closest('[inert]')).not.toBeNull();
    panel()!.dispatchEvent(new Event('transitionend'));
    expect(page.closest('[inert]')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('honors closeOnEscape / closeOnBackdropClick configuration', async () => {
    const { fixture } = await render(Host);
    style.remove();
    const ref = fixture.componentInstance.open({
      closeOnEscape: false,
      closeOnBackdropClick: false,
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    document
      .querySelector('[data-qz-dialog-backdrop]')!
      .dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(panel()).not.toBeNull();
    ref.close();
  });

  it('Escape closes it when enabled', async () => {
    const { fixture } = await render(Host);
    style.remove();
    fixture.componentInstance.open();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(panel()).toBeNull();
  });

  it('is a no-op that still notifies on the server', async () => {
    const { fixture } = await render(Host);
    const drawers = fixture.componentInstance.drawers;
    const doc = (drawers as unknown as { document: Document }).document;
    const spy = vi.spyOn(doc, 'defaultView', 'get').mockReturnValue(null);
    const ref = drawers.open(fixture.componentInstance.tpl(), fixture.componentInstance.vcr);
    spy.mockRestore();
    expect(ref.state()).toBe('closed');
  });
});
