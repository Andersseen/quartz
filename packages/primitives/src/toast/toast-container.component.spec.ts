import { render, screen } from '@testing-library/angular';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, afterEach } from 'vitest';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService } from './toast.service';

describe('ToastContainerComponent', () => {
  afterEach(() => {
    TestBed.inject(ToastService).dismissAll();
  });

  it('should keep an aria-live region for every position', async () => {
    const { container } = await render(ToastContainerComponent);
    const regions = container.querySelectorAll('.qz-toast-container');

    expect(regions).toHaveLength(6);
    expect(regions[0].getAttribute('aria-live')).toBe('assertive'); // top-*
    expect(regions[5].getAttribute('aria-live')).toBe('polite'); // bottom-*
  });

  it('should render a toast inside its position container', async () => {
    const { fixture, container } = await render(ToastContainerComponent);
    TestBed.inject(ToastService).info('Hello', undefined, { position: 'bottom-right' });
    fixture.detectChanges();

    const toast = screen.getByText('Hello').closest('qz-toast');
    expect(toast).not.toBeNull();
    expect(toast?.closest('.qz-toast-container--bottom-right')).not.toBeNull();
    expect(container.querySelectorAll('qz-toast')).toHaveLength(1);
  });

  // NOTE: the "empty containers must stay click-through" guarantee is verified in
  // e2e/behavior.spec.ts — jsdom's getComputedStyle does not apply `pointer-events`
  // from a component stylesheet, so it cannot be asserted here.
});
