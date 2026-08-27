import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { render, screen, fireEvent } from '@testing-library/angular';
import { describe, it, expect } from 'vitest';
import { SplitterContainerDirective } from './splitter-container.directive';
import { SplitterHandleDirective } from './splitter-handle.directive';

@Component({
  standalone: true,
  imports: [SplitterContainerDirective, SplitterHandleDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div qzSplitterContainer [defaultPosition]="50" [step]="1">
      <div qzSplitterHandle>handle</div>
    </div>
  `,
})
class Host {
  @ViewChild(SplitterContainerDirective, { static: true })
  container!: SplitterContainerDirective;
}

describe('SplitterHandleDirective', () => {
  it('exposes slider ARIA attributes', async () => {
    await render(Host);
    const handle = screen.getByText('handle');

    expect(handle).toHaveAttribute('role', 'separator');
    expect(handle).toHaveAttribute('tabindex', '0');
    expect(handle).toHaveAttribute('aria-orientation', 'horizontal');
    expect(handle).toHaveAttribute('aria-valuemin', '0');
    expect(handle).toHaveAttribute('aria-valuemax', '100');
    expect(handle).toHaveAttribute('aria-valuenow', '50');
  });

  it('moves position with arrow keys', async () => {
    const { fixture } = await render(Host);
    const handle = screen.getByText('handle');
    const service = fixture.componentInstance.container.splitterService;

    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    fixture.detectChanges();
    expect(service.position()).toBe(51);

    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    fixture.detectChanges();
    expect(service.position()).toBe(50);
  });

  it('jumps to bounds with Home/End', async () => {
    const { fixture } = await render(Host);
    const handle = screen.getByText('handle');
    const service = fixture.componentInstance.container.splitterService;

    fireEvent.keyDown(handle, { key: 'End' });
    fixture.detectChanges();
    expect(service.position()).toBe(100);

    fireEvent.keyDown(handle, { key: 'Home' });
    fixture.detectChanges();
    expect(service.position()).toBe(0);
  });

  it('toggles dragging state on mousedown/mouseup', async () => {
    const { fixture } = await render(Host);
    const handle = screen.getByText('handle');
    const service = fixture.componentInstance.container.splitterService;

    fireEvent.mouseDown(handle);
    fixture.detectChanges();
    expect(service.isDragging()).toBe(true);

    document.dispatchEvent(new MouseEvent('mouseup'));
    fixture.detectChanges();
    expect(service.isDragging()).toBe(false);
  });
});
