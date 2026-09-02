import { render, screen } from '@testing-library/angular';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, afterEach } from 'vitest';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService } from './toast.service';

describe('ToastContainerComponent', () => {
  afterEach(() => {
    TestBed.inject(ToastService).dismissAll();
  });

  it('should render an aria-atomic container for every position, deferring live-region politeness to each toast', async () => {
    const { container } = await render(ToastContainerComponent);
    const regions = container.querySelectorAll('.qz-toast-container');

    expect(regions).toHaveLength(6);
    // Politeness must not be a function of visual position — every container is "off";
    // each qz-toast establishes its own live region via role (see toast.component.spec.ts).
    regions.forEach((region) => {
      expect(region.getAttribute('aria-live')).toBe('off');
    });
  });

  it('announces an error toast the same way regardless of its visual position', async () => {
    const { fixture, container } = await render(ToastContainerComponent);
    const service = TestBed.inject(ToastService);
    // Error at the "polite" bottom-left corner, info at the "assertive" top-left corner
    // under the old position-based logic — both must now be keyed off type, not position.
    service.error('Something broke', undefined, { position: 'bottom-left' });
    service.info('FYI', undefined, { position: 'top-left' });
    fixture.detectChanges();

    const errorToast = screen.getByText('Something broke').closest('.qz-toast');
    const infoToast = screen.getByText('FYI').closest('.qz-toast');

    expect(errorToast).toHaveAttribute('role', 'alert');
    expect(infoToast).toHaveAttribute('role', 'status');
    expect(container.querySelectorAll('qz-toast')).toHaveLength(2);
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
