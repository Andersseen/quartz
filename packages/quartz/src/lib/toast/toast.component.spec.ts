import { render, screen } from '@testing-library/angular';
import { vi, describe, it, expect } from 'vitest';
import { ToastComponent } from './toast.component';
import { Toast } from './toast.model';

describe('ToastComponent', () => {
  const mockToast: Toast = {
    id: '1',
    message: 'Test Message',
    type: 'success',
    duration: 3000,
    closable: true,
    pauseOnHover: true,
    showProgress: true,
    position: 'top-right',
    createdAt: new Date(),
    remainingTime: 3000,
    isPaused: false,
  };

  it('should render toast message', async () => {
    await render(ToastComponent, {
      inputs: {
        toast: mockToast,
        progress: 100,
      },
    });

    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });

  it('should have success class', async () => {
    await render(ToastComponent, {
      inputs: {
        toast: mockToast,
        progress: 100,
      },
    });

    const toastElement = screen.getByRole('alert');
    expect(toastElement).toHaveClass('qz-toast--success');
  });

  it('should emit pause on mouse enter', async () => {
    const { fixture } = await render(ToastComponent, {
      inputs: {
        toast: mockToast,
        progress: 100,
      },
    });

    const pauseSpy = vi.spyOn(fixture.componentInstance.qzPause, 'emit');
    const toastElement = screen.getByRole('alert');

    toastElement.dispatchEvent(new MouseEvent('mouseenter'));
    expect(pauseSpy).toHaveBeenCalled();
  });

  it('should emit resume on mouse leave', async () => {
    const { fixture } = await render(ToastComponent, {
      inputs: {
        toast: mockToast,
        progress: 100,
      },
    });

    const resumeSpy = vi.spyOn(fixture.componentInstance.qzResume, 'emit');
    const toastElement = screen.getByRole('alert');

    toastElement.dispatchEvent(new MouseEvent('mouseleave'));
    expect(resumeSpy).toHaveBeenCalled();
  });
});
