import { render, screen } from '@testing-library/angular';
import { vi, describe, it, expect } from 'vitest';
import { ToastComponent } from './toast.component';
import { Toast } from './toast.types';

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
    const { fixture } = await render(ToastComponent, {
      inputs: {
        toast: mockToast,
        progress: 100,
      },
    });

    const toastElement = fixture.nativeElement.querySelector('.qz-toast');
    expect(toastElement).toHaveClass('qz-toast--success');
  });

  it('should emit paused on mouse enter', async () => {
    const { fixture } = await render(ToastComponent, {
      inputs: {
        toast: mockToast,
        progress: 100,
      },
    });

    const pauseSpy = vi.spyOn(fixture.componentInstance.paused, 'emit');
    const toastElement = fixture.nativeElement.querySelector('.qz-toast');

    toastElement.dispatchEvent(new MouseEvent('mouseenter'));
    expect(pauseSpy).toHaveBeenCalled();
  });

  it('should emit resumed on mouse leave', async () => {
    const { fixture } = await render(ToastComponent, {
      inputs: {
        toast: mockToast,
        progress: 100,
      },
    });

    const resumeSpy = vi.spyOn(fixture.componentInstance.resumed, 'emit');
    const toastElement = fixture.nativeElement.querySelector('.qz-toast');

    toastElement.dispatchEvent(new MouseEvent('mouseleave'));
    expect(resumeSpy).toHaveBeenCalled();
  });
});
