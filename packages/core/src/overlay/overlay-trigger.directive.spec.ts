import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { vi, describe, it, expect, afterEach } from 'vitest';
import { OverlayTriggerDirective } from './overlay-trigger.directive';

@Component({
  standalone: true,
  imports: [OverlayTriggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button qzOverlayTrigger [overlayTemplate]="tpl" [closeOnClickOutside]="true">Open</button>
    <ng-template #tpl>
      <div class="overlay-content">Overlay body</div>
    </ng-template>
  `,
})
class TestHost {
  @ViewChild(OverlayTriggerDirective, { static: true })
  trigger!: OverlayTriggerDirective;
}

@Component({
  standalone: true,
  imports: [OverlayTriggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button qzOverlayTrigger [overlayTemplate]="tpl" [closeOnEscape]="true">Open</button>
    <ng-template #tpl>
      <div class="overlay-content">Overlay body</div>
    </ng-template>
  `,
})
class EscapeHost {
  @ViewChild(OverlayTriggerDirective, { static: true })
  trigger!: OverlayTriggerDirective;
}

@Component({
  standalone: true,
  imports: [OverlayTriggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div tabindex="0" qzOverlayTrigger [overlayTemplate]="tpl">Open</div>
    <ng-template #tpl>
      <div class="overlay-content">Overlay body</div>
    </ng-template>
  `,
})
class DivHost {}

describe('OverlayTriggerDirective', () => {
  afterEach(() => {
    document.querySelector('[data-qz-overlay-container]')?.remove();
  });

  it('should open and close overlay on trigger click', async () => {
    await render(TestHost);
    const button = screen.getByText('Open');

    expect(document.querySelector('.overlay-content')).toBeNull();

    button.click();
    await waitForOverlayFrame();

    expect(document.querySelector('.overlay-content')).not.toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('true');

    button.click();
    await waitForOverlayFrame();

    expect(document.querySelector('.overlay-content')).toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('should emit closed exactly once per close when opened multiple times', async () => {
    const { fixture } = await render(TestHost);
    const trigger = fixture.componentInstance.trigger;
    const closedSpy = vi.fn();

    trigger.closed.subscribe(closedSpy);

    for (let i = 0; i < 3; i++) {
      trigger.open();
      await waitForOverlayFrame();
      trigger.close();
      await waitForOverlayFrame();
    }

    expect(closedSpy).toHaveBeenCalledTimes(3);
  });

  it('should open on Enter for a non-native host', async () => {
    await render(DivHost);
    const host = screen.getByText('Open');

    expect(document.querySelector('.overlay-content')).toBeNull();

    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await waitForOverlayFrame();

    expect(document.querySelector('.overlay-content')).not.toBeNull();
  });

  it('should not activate on Enter for a native button (avoids double toggle)', async () => {
    await render(TestHost);
    const button = screen.getByText('Open');

    // Native buttons already synthesize a click from Enter/Space, so the
    // directive must ignore keydown on them. In jsdom no click is synthesized,
    // so the overlay must stay closed.
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await waitForOverlayFrame();

    expect(document.querySelector('.overlay-content')).toBeNull();
  });

  it('should close on Escape key', async () => {
    const { fixture } = await render(EscapeHost);
    const trigger = fixture.componentInstance.trigger;

    trigger.open();
    await waitForOverlayFrame();
    expect(document.querySelector('.overlay-content')).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await waitForOverlayFrame();

    expect(document.querySelector('.overlay-content')).toBeNull();
  });
});

function waitForOverlayFrame(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 20));
}
