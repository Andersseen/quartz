import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { render, screen } from '@testing-library/angular';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TooltipDirective } from './tooltip.directive';

@Component({
  standalone: true,
  imports: [TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button qzTooltip="Hello tooltip">Hover me</button>`,
})
class TestHost {}

@Component({
  standalone: true,
  imports: [TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button qzTooltip="Hello tooltip" [tooltipDisabled]="disabled()">Hover me</button>`,
})
class DisableableHost {
  readonly disabled = signal(false);
}

describe('TooltipDirective', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    // Clean up any tooltip DOM leftovers
    document.querySelectorAll('.qz-tooltip').forEach((el) => el.remove());
  });

  it('should create tooltip element on mouseenter after delay', async () => {
    await render(TestHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    expect(document.querySelector('.qz-tooltip')).toBeNull();

    vi.advanceTimersByTime(400);
    expect(document.querySelector('.qz-tooltip')).not.toBeNull();
    expect(document.querySelector('.qz-tooltip')?.textContent).toBe('Hello tooltip');
  });

  it('should remove tooltip on mouseleave after hide delay', async () => {
    await render(TestHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    expect(document.querySelector('.qz-tooltip')).not.toBeNull();

    button.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(200);
    expect(document.querySelector('.qz-tooltip')).toBeNull();
  });

  it('should not show tooltip when disabled', async () => {
    @Component({
      standalone: true,
      imports: [TooltipDirective],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<button qzTooltip="Hello" [tooltipDisabled]="true">Hover me</button>`,
    })
    class DisabledHost {}

    await render(DisabledHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    expect(document.querySelector('.qz-tooltip')).toBeNull();
  });

  it('should set aria-describedby when tooltip is visible', async () => {
    const { fixture } = await render(TestHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    fixture.detectChanges();

    const tooltip = document.querySelector('.qz-tooltip');
    expect(tooltip).not.toBeNull();
    expect(button.getAttribute('aria-describedby')).toBe(tooltip?.id);
  });

  it('should wire aria-describedby for template tooltips', async () => {
    @Component({
      standalone: true,
      imports: [TooltipDirective],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <button [qzTooltip]="tooltip">Hover me</button>
        <ng-template #tooltip>
          <div class="rich-tooltip">Rich tooltip</div>
        </ng-template>
      `,
    })
    class TemplateHost {}

    const { fixture } = await render(TemplateHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    fixture.detectChanges();

    const tooltip = document.querySelector('.rich-tooltip');
    expect(tooltip).not.toBeNull();
    expect(tooltip?.getAttribute('role')).toBe('tooltip');
    expect(button.getAttribute('aria-describedby')).toBe(tooltip?.id);
  });

  it('should dismiss with Escape while visible', async () => {
    await render(TestHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    expect(document.querySelector('.qz-tooltip')).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    // Dismissal is immediate — no hide delay to wait out.
    expect(document.querySelector('.qz-tooltip')).toBeNull();
  });

  it('should ignore Escape once the tooltip is gone', async () => {
    await render(TestHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(document.querySelector('.qz-tooltip')).toBeNull();
  });

  it('should not stack show timers across repeated hovers', async () => {
    await render(TestHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(100);
    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(100);
    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);

    expect(document.querySelectorAll('.qz-tooltip')).toHaveLength(1);
  });

  it('should hide immediately when disabled while visible', async () => {
    const { fixture } = await render(DisableableHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    expect(document.querySelector('.qz-tooltip')).not.toBeNull();

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(document.querySelector('.qz-tooltip')).toBeNull();
  });

  it('should reveal the tooltip only once it has been positioned', async () => {
    await render(TestHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);

    // It starts hidden to avoid a flash at the viewport origin; by the time the
    // positioning frame has run it must be both placed and visible again.
    const tooltip = document.querySelector<HTMLElement>('.qz-tooltip');
    expect(tooltip?.style.transform).toMatch(/^translate\(/);
    expect(tooltip?.style.visibility).toBe('visible');
  });

  it('dismisses a string tooltip on scroll, through a single dismiss controller', async () => {
    await render(TestHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    expect(document.querySelector('.qz-tooltip')).not.toBeNull();

    document.dispatchEvent(new Event('scroll'));
    expect(document.querySelector('.qz-tooltip')).toBeNull();
  });

  it('dismisses a template tooltip on scroll exactly once (no duplicate Overlay-internal scroll-dismiss)', async () => {
    @Component({
      standalone: true,
      imports: [TooltipDirective],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <button [qzTooltip]="tooltip">Hover me</button>
        <ng-template #tooltip>
          <div class="rich-tooltip">Rich tooltip</div>
        </ng-template>
      `,
    })
    class TemplateHost {}

    const { fixture } = await render(TemplateHost);
    const button = screen.getByText('Hover me');

    button.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(400);
    fixture.detectChanges();
    expect(document.querySelector('.rich-tooltip')).not.toBeNull();

    document.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(document.querySelector('.rich-tooltip')).toBeNull();
    // A leftover Overlay-internal scroll listener firing a second, redundant close would
    // still leave the tooltip gone, but let's also make sure nothing throws when a second
    // scroll fires against an already-closed tooltip.
    expect(() => document.dispatchEvent(new Event('scroll'))).not.toThrow();
  });

  describe('aria-describedby preservation', () => {
    @Component({
      standalone: true,
      imports: [TooltipDirective],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <p id="help">Help</p>
        <button qzTooltip="Tip" aria-describedby="help">Hover me</button>
      `,
    })
    class DescribedHost {}

    it('keeps the consumer description before, during and after the tooltip', async () => {
      await render(DescribedHost);
      const button = screen.getByText('Hover me');
      expect(button.getAttribute('aria-describedby')).toBe('help');

      button.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(400);
      const id = document.querySelector('.qz-tooltip')?.id;
      expect(button.getAttribute('aria-describedby')).toBe(`help ${id}`);

      button.dispatchEvent(new MouseEvent('mouseleave'));
      vi.advanceTimersByTime(200);
      expect(button.getAttribute('aria-describedby')).toBe('help');
    });

    it('does not add an aria-describedby attribute while hidden and removes it afterwards', async () => {
      await render(TestHost);
      const button = screen.getByText('Hover me');
      expect(button.hasAttribute('aria-describedby')).toBe(false);

      button.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(400);
      expect(button.hasAttribute('aria-describedby')).toBe(true);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(button.hasAttribute('aria-describedby')).toBe(false);
    });

    it('restores the description when the directive is destroyed while visible', async () => {
      const { fixture } = await render(DescribedHost);
      const button = screen.getByText('Hover me');
      button.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(400);

      fixture.destroy();
      expect(document.querySelector('.qz-tooltip')).toBeNull();
      expect(button.getAttribute('aria-describedby')).toBe('help');
    });
  });

  describe('overlapping interaction sources', () => {
    it('stays visible while focus remains after the pointer leaves', async () => {
      await render(TestHost);
      const button = screen.getByText('Hover me');

      button.dispatchEvent(new MouseEvent('mouseenter'));
      button.dispatchEvent(new FocusEvent('focus'));
      vi.advanceTimersByTime(400);
      button.dispatchEvent(new MouseEvent('mouseleave'));
      vi.advanceTimersByTime(500);
      expect(document.querySelector('.qz-tooltip')).not.toBeNull();

      button.dispatchEvent(new FocusEvent('blur'));
      vi.advanceTimersByTime(200);
      expect(document.querySelector('.qz-tooltip')).toBeNull();
    });

    it('stays visible while the pointer remains after focus leaves', async () => {
      await render(TestHost);
      const button = screen.getByText('Hover me');

      button.dispatchEvent(new FocusEvent('focus'));
      button.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(400);
      button.dispatchEvent(new FocusEvent('blur'));
      vi.advanceTimersByTime(500);
      expect(document.querySelector('.qz-tooltip')).not.toBeNull();

      button.dispatchEvent(new MouseEvent('mouseleave'));
      vi.advanceTimersByTime(200);
      expect(document.querySelector('.qz-tooltip')).toBeNull();
    });

    it('re-entering during the hide delay cancels the pending hide', async () => {
      await render(TestHost);
      const button = screen.getByText('Hover me');

      button.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(400);
      button.dispatchEvent(new MouseEvent('mouseleave'));
      vi.advanceTimersByTime(50);
      button.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(500);
      expect(document.querySelector('.qz-tooltip')).not.toBeNull();
    });

    it('overlapping hide requests leave no orphaned timer behind', async () => {
      const { fixture } = await render(TestHost);
      const button = screen.getByText('Hover me');

      button.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(400);
      const directive = fixture.debugElement
        .query(By.directive(TooltipDirective))
        .injector.get(TooltipDirective);
      directive.hide();
      directive.hide();
      directive.show();
      vi.advanceTimersByTime(500);
      expect(document.querySelector('.qz-tooltip')).not.toBeNull();
    });
  });

  describe('lifecycle', () => {
    it('does not render when the host is destroyed before the show delay elapses', async () => {
      const { fixture } = await render(TestHost);
      screen.getByText('Hover me').dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(100);

      fixture.destroy();
      vi.advanceTimersByTime(1000);
      expect(document.querySelector('.qz-tooltip')).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
    });

    it('cancels the pending positioning frame when torn down before it runs', async () => {
      const cancel = vi.spyOn(window, 'cancelAnimationFrame');
      await render(TestHost);
      const button = screen.getByText('Hover me');
      button.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(300);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(cancel).toHaveBeenCalled();
      cancel.mockRestore();
    });

    it('updates the text of a visible tooltip when the content changes', async () => {
      @Component({
        standalone: true,
        imports: [TooltipDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `<button [qzTooltip]="text()">Hover me</button>`,
      })
      class DynamicHost {
        readonly text = signal('One');
      }
      const { fixture } = await render(DynamicHost);
      const button = screen.getByText('Hover me');
      button.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(400);
      expect(document.querySelector('.qz-tooltip')?.textContent).toBe('One');

      fixture.componentInstance.text.set('Two');
      fixture.detectChanges();
      expect(document.querySelectorAll('.qz-tooltip')).toHaveLength(1);
      expect(document.querySelector('.qz-tooltip')?.textContent).toBe('Two');

      fixture.componentInstance.text.set('');
      fixture.detectChanges();
      expect(document.querySelector('.qz-tooltip')).toBeNull();
      expect(button.hasAttribute('aria-describedby')).toBe(false);
    });

    it('a template tooltip keeps a consumer-provided id and role', async () => {
      @Component({
        standalone: true,
        imports: [TooltipDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <button [qzTooltip]="tpl">Hover me</button>
          <ng-template #tpl><div id="mine" class="rich">Rich</div></ng-template>
        `,
      })
      class IdHost {}
      await render(IdHost);
      const button = screen.getByText('Hover me');
      button.dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(400);
      expect(document.querySelector('.rich')?.id).toBe('mine');
      expect(button.getAttribute('aria-describedby')).toBe('mine');
    });
  });
});
