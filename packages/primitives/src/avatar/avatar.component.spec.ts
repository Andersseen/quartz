import { fireEvent, render, waitFor } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  it('renders consumer fallback when no image source is supplied', async () => {
    const { getByText, queryByRole } = await render(AvatarComponent, {
      inputs: { fallback: 'JD' },
    });
    getByText('JD');
    expect(queryByRole('img')).toBeNull();
  });

  it('shows an image after load and restores fallback after a source replacement', async () => {
    const { container, rerender } = await render(AvatarComponent, {
      inputs: { src: '/first.png', fallback: 'JD', fallbackDelay: 1000 },
    });
    const image = container.querySelector('img')!;
    expect(image.hidden).toBe(true);
    fireEvent.load(image);
    await waitFor(() => expect(container.getAttribute('data-qz-state')).toBe('loaded'));
    await rerender({ inputs: { src: '/second.png', fallback: 'JD', fallbackDelay: 1000 } });
    const replacement = container.querySelector('img') as HTMLImageElement;
    expect(replacement.src).toContain('/second.png');
    await waitFor(() => expect(container.getAttribute('data-qz-state')).toBe('loading'));
  });

  it('shows fallback when image loading fails', async () => {
    const { container, getByText } = await render(AvatarComponent, {
      inputs: { src: '/missing.png', fallback: 'AB', fallbackDelay: 1000 },
    });
    fireEvent.error(container.querySelector('img')!);
    getByText('AB');
    expect(container.getAttribute('data-qz-state')).toBe('fallback');
  });

  it('reveals fallback when the configured delay expires', async () => {
    const { container, getByText } = await render(AvatarComponent, {
      inputs: { src: '/pending.png', fallback: 'CD', fallbackDelay: 5 },
    });
    await waitFor(() => getByText('CD'));
    expect(container.getAttribute('data-qz-state')).toBe('fallback');
  });
});
