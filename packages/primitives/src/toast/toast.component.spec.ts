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

  it.each([
    ['error', 'alert'],
    ['warning', 'status'],
    ['info', 'status'],
    ['success', 'status'],
  ] as const)('announces %s toasts with role=%s', async (type, role) => {
    await render(ToastComponent, { inputs: { toast: { ...mockToast, type }, progress: 100 } });
    expect(screen.getByRole(role)).toBeInTheDocument();
  });

  it('keeps the progress bar out of the accessibility tree so progress never re-announces', async () => {
    const { fixture } = await render(ToastComponent, {
      inputs: { toast: mockToast, progress: 40 },
    });
    expect(fixture.nativeElement.querySelector('.qz-toast__progress')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    fixture.componentRef.setInput('progress', 20);
    fixture.detectChanges();
    expect(screen.getByRole('status')).toHaveTextContent('Test Message');
  });

  it('exposes an accessibly named close button only when closable', async () => {
    const { rerender } = await render(ToastComponent, {
      inputs: { toast: mockToast, progress: 100 },
    });
    expect(screen.getByRole('button', { name: 'Close notification' })).toBeInTheDocument();
    await rerender({ inputs: { toast: { ...mockToast, closable: false }, progress: 100 } });
    expect(screen.queryByRole('button')).toBeNull();
  });
});
